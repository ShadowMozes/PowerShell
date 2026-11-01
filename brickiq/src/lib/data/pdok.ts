import type { Address, BagRecord } from "../types";

/**
 * Official public Dutch government geo services (no API key required):
 *  - PDOK Locatieserver v3.1 : address search & lookup (based on BAG)
 *  - PDOK BAG WFS v2.0       : verblijfsobject attributes (floor area, build year, usage)
 *  - Kadaster BAG Individuele Bevragingen v2 (optional, needs BAG_API_KEY)
 *
 * All calls are made server-side from Next.js route handlers.
 */
const LOCATIESERVER = "https://api.pdok.nl/bzk/locatieserver/search/v3_1";
const BAG_WFS = "https://service.pdok.nl/lv/bag/wfs/v2_0";
const BAG_API = "https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2";

const TIMEOUT_MS = 6000;

async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: "application/json", ...(init.headers ?? {}) },
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export interface Suggestion {
  id: string;
  label: string;
  type: string;
}

export async function suggestAddresses(q: string): Promise<Suggestion[]> {
  const url = new URL(`${LOCATIESERVER}/suggest`);
  url.searchParams.set("q", q);
  url.searchParams.set("fq", "type:adres");
  url.searchParams.set("rows", "7");
  const data = (await getJson(url.toString())) as {
    response?: { docs?: { id: string; weergavenaam: string; type: string }[] };
  };
  return (data.response?.docs ?? []).map((d) => ({
    id: d.id,
    label: d.weergavenaam,
    type: d.type,
  }));
}

export interface LookupResult {
  address: Address;
  coordinates?: { lat: number; lon: number };
  bag: BagRecord | null;
  bagError?: string;
  sources: string[];
}

type LookupDoc = Record<string, unknown>;

function str(doc: LookupDoc, key: string): string | undefined {
  const v = doc[key];
  if (v === undefined || v === null) return undefined;
  return String(v);
}

/** Parse "POINT(4.89 52.37)" into lat/lon. */
export function parsePoint(wkt?: string): { lat: number; lon: number } | undefined {
  if (!wkt) return undefined;
  const m = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(wkt);
  if (!m) return undefined;
  return { lon: Number(m[1]), lat: Number(m[2]) };
}

export function normalizeLookupDoc(doc: LookupDoc): Omit<LookupResult, "bag" | "sources"> & {
  verblijfsobjectId?: string;
  nummeraanduidingId?: string;
} {
  const huisnummer = str(doc, "huisnummer") ?? "";
  const letter = str(doc, "huisletter") ?? "";
  const toevoeging = str(doc, "huisnummertoevoeging");
  const houseNumber = `${huisnummer}${letter}${toevoeging ? `-${toevoeging}` : ""}`;
  const address: Address = {
    street: str(doc, "straatnaam") ?? "",
    houseNumber,
    postcode: (str(doc, "postcode") ?? "").replace(/^(\d{4})\s?([A-Z]{2})$/, "$1 $2"),
    city: str(doc, "woonplaatsnaam") ?? "",
    municipality: str(doc, "gemeentenaam"),
    province: str(doc, "provincienaam"),
    neighbourhood: str(doc, "buurtnaam"),
    district: str(doc, "wijknaam"),
    display: str(doc, "weergavenaam") ?? "",
  };
  return {
    address,
    coordinates: parsePoint(str(doc, "centroide_ll")),
    verblijfsobjectId: str(doc, "adresseerbaarobject_id"),
    nummeraanduidingId: str(doc, "nummeraanduiding_id"),
  };
}

export async function lookupAddress(id: string): Promise<LookupResult> {
  const url = new URL(`${LOCATIESERVER}/lookup`);
  url.searchParams.set("id", id);
  url.searchParams.set("fl", "*");
  const data = (await getJson(url.toString())) as { response?: { docs?: LookupDoc[] } };
  const doc = data.response?.docs?.[0];
  if (!doc) throw new Error("Address not found in PDOK Locatieserver");
  const base = normalizeLookupDoc(doc);
  const sources = ["PDOK Locatieserver (BAG-based address register)"];

  let bag: BagRecord | null = null;
  let bagError: string | undefined;
  if (base.verblijfsobjectId) {
    try {
      bag = process.env.BAG_API_KEY
        ? await bagFromKadasterApi(base.verblijfsobjectId)
        : await bagFromWfs(base.verblijfsobjectId, base.coordinates);
      if (bag) {
        bag.nummeraanduidingId = base.nummeraanduidingId;
        sources.push(bag.retrievedFrom);
      }
    } catch (e) {
      bagError = e instanceof Error ? e.message : "BAG lookup failed";
    }
  }
  return { address: base.address, coordinates: base.coordinates, bag, bagError, sources };
}

type WfsFeature = { properties?: Record<string, unknown> };

export function parseBagWfsFeature(f: WfsFeature): BagRecord {
  const p = f.properties ?? {};
  const num = (k: string) => {
    const v = p[k];
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const s = (k: string) => (p[k] === undefined || p[k] === null ? undefined : String(p[k]));
  return {
    verblijfsobjectId: s("identificatie"),
    pandId: s("pandidentificatie"),
    usage: s("gebruiksdoel"),
    status: s("status"),
    floorArea: num("oppervlakte"),
    buildYear: num("bouwjaar"),
    retrievedFrom: "BAG via PDOK WFS",
  };
}

async function bagFromWfs(
  verblijfsobjectId: string,
  coords?: { lat: number; lon: number },
): Promise<BagRecord | null> {
  // 1) Attribute filter on identificatie
  const filter =
    `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">` +
    `<fes:PropertyIsEqualTo><fes:ValueReference>identificatie</fes:ValueReference>` +
    `<fes:Literal>${verblijfsobjectId}</fes:Literal></fes:PropertyIsEqualTo></fes:Filter>`;
  const base = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: "bag:verblijfsobject",
    outputFormat: "application/json",
    count: "5",
  });
  try {
    const byId = new URLSearchParams(base);
    byId.set("filter", filter);
    const data = (await getJson(`${BAG_WFS}?${byId}`)) as { features?: WfsFeature[] };
    const hit = data.features?.find(
      (f) => String(f.properties?.identificatie ?? "") === verblijfsobjectId,
    ) ?? data.features?.[0];
    if (hit) return parseBagWfsFeature(hit);
  } catch {
    // fall through to bbox query
  }
  // 2) Small bounding box around the address point
  if (!coords) return null;
  const d = 0.0004;
  const byBox = new URLSearchParams(base);
  byBox.set("count", "60");
  byBox.set("srsName", "EPSG:4326");
  byBox.set(
    "bbox",
    `${coords.lat - d},${coords.lon - d},${coords.lat + d},${coords.lon + d},urn:ogc:def:crs:EPSG::4326`,
  );
  const data = (await getJson(`${BAG_WFS}?${byBox}`)) as { features?: WfsFeature[] };
  const hit = data.features?.find(
    (f) => String(f.properties?.identificatie ?? "") === verblijfsobjectId,
  );
  return hit ? parseBagWfsFeature(hit) : null;
}

async function bagFromKadasterApi(verblijfsobjectId: string): Promise<BagRecord | null> {
  const headers = {
    "X-Api-Key": process.env.BAG_API_KEY!,
    "Accept-Crs": "epsg:28992",
  };
  const vbo = (await getJson(`${BAG_API}/verblijfsobjecten/${verblijfsobjectId}`, { headers })) as {
    verblijfsobject?: {
      verblijfsobject?: {
        oppervlakte?: number;
        gebruiksdoelen?: string[];
        status?: string;
        maaktDeelUitVan?: string[];
      };
    };
  };
  const v = vbo.verblijfsobject?.verblijfsobject;
  if (!v) return null;
  const pandId = v.maaktDeelUitVan?.[0];
  let buildYear: number | undefined;
  if (pandId) {
    const pand = (await getJson(`${BAG_API}/panden/${pandId}`, { headers })) as {
      pand?: { pand?: { oorspronkelijkBouwjaar?: string | number } };
    };
    const y = Number(pand.pand?.pand?.oorspronkelijkBouwjaar);
    buildYear = Number.isFinite(y) ? y : undefined;
  }
  return {
    verblijfsobjectId,
    pandId,
    usage: v.gebruiksdoelen?.join(", "),
    status: v.status,
    floorArea: v.oppervlakte,
    buildYear,
    retrievedFrom: "Kadaster BAG API Individuele Bevragingen",
  };
}
