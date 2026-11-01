import type {
  Address,
  BagRecord,
  EnergyLabel,
  Field,
  Leasehold,
  Outdoor,
  Property,
  PropertyType,
  Provenance,
} from "./types";
import { marketReferenceFor } from "./market";
import { getDemoProperty } from "./demo";

/** Encode a property into a URL-safe string so reports are shareable without accounts. */
export function encodeProperty(p: Property): string {
  const json = JSON.stringify(p);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeProperty(s: string): Property | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes)) as Property;
    if (!p?.address?.value || !p.livingArea?.value || !p.askingPrice?.value) return null;
    return p;
  } catch {
    return null;
  }
}

export function resolveProperty(id: string, d?: string | null): Property | null {
  if (id.startsWith("demo-")) return getDemoProperty(id) ?? null;
  if (d) return decodeProperty(d);
  return null;
}

export function propertyHref(p: Property, suffix = ""): string {
  if (p.isDemo) return `/property/${p.id}${suffix}`;
  return `/property/custom${suffix}?d=${encodeProperty(p)}`;
}

export interface PropertyForm {
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  type: PropertyType;
  livingArea: number;
  plotArea?: number;
  buildYear: number;
  energyLabel: EnergyLabel;
  rooms: number;
  bedrooms: number;
  condition: number;
  outdoor: Outdoor;
  parking: boolean;
  leasehold: Leasehold;
  leaseholdAnnual?: number;
  vveMonthly?: number;
  askingPrice: number;
  marketReference?: number;
  referenceUrl?: string;
}

export interface VerifiedContext {
  address: Address;
  coordinates?: { lat: number; lon: number };
  bag: BagRecord | null;
  sources: string[];
}

/**
 * Build a Property from user form input, preserving provenance. A field stays
 * "verified" only if the user kept the value that came from an official source.
 */
export function buildProperty(form: PropertyForm, verified?: VerifiedContext): Property {
  const user = <T,>(value: T): Field<T> => ({ value, source: "user", origin: "Entered by you" });
  const keepVerified = <T,>(value: T, official: T | undefined, origin: string): Field<T> =>
    official !== undefined && official === value
      ? { value, source: "verified", origin }
      : user(value);

  const addrSource: Provenance = verified ? "verified" : "user";
  const address: Address = verified
    ? verified.address
    : {
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim(),
        postcode: form.postcode.trim().toUpperCase(),
        city: form.city.trim(),
        municipality: form.city.trim(),
        display: `${form.street.trim()} ${form.houseNumber.trim()}, ${form.postcode.trim().toUpperCase()} ${form.city.trim()}`.replace(/\s+,/, ","),
      };

  const ref = marketReferenceFor(address.city, address.municipality);
  const marketValue = form.marketReference ?? ref.pricePerSqm;
  const bagOrigin = verified?.bag?.retrievedFrom ?? "BAG";

  const id = `custom-${Math.abs(hash(address.display + form.askingPrice)).toString(36)}`;

  return {
    id,
    isDemo: false,
    address: {
      value: address,
      source: addrSource,
      origin: verified ? "PDOK Locatieserver" : "Entered by you",
    },
    coordinates: verified?.coordinates
      ? { value: verified.coordinates, source: "verified", origin: "PDOK Locatieserver" }
      : undefined,
    type: user(form.type),
    livingArea: keepVerified(form.livingArea, verified?.bag?.floorArea, `${bagOrigin} (gebruiksoppervlakte)`),
    plotArea: form.plotArea ? user(form.plotArea) : undefined,
    buildYear: keepVerified(form.buildYear, verified?.bag?.buildYear, `${bagOrigin} (bouwjaar)`),
    energyLabel: user(form.energyLabel),
    rooms: user(form.rooms),
    bedrooms: user(form.bedrooms),
    condition: user(form.condition),
    outdoor: user(form.outdoor),
    parking: user(form.parking),
    leasehold: user(form.leasehold),
    leaseholdAnnual: form.leasehold === "ongoing" && form.leaseholdAnnual ? user(form.leaseholdAnnual) : undefined,
    vveMonthly: form.vveMonthly ? user(form.vveMonthly) : undefined,
    askingPrice: user(form.askingPrice),
    marketReference:
      form.marketReference && form.marketReference !== ref.pricePerSqm
        ? { value: marketValue, source: "user", origin: "Your market assumption" }
        : { value: marketValue, source: "model", origin: `BrickIQ regional prior (${ref.label})` },
    bag: verified?.bag ?? undefined,
    referenceUrl: form.referenceUrl || undefined,
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Extract a search hint from a Funda listing URL *string*. The page itself is
 * never requested — we only read the URL the user pasted.
 */
export function searchHintFromFundaUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (!/(^|\.)funda\.nl$/i.test(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    // e.g. /detail/koop/amsterdam/appartement-keizersgracht-123-a/43123456/
    //      /koop/amsterdam/huis-12345678-dorpsstraat-1/
    const cityIdx = parts.findIndex((p) => p === "koop" || p === "huur");
    const city = cityIdx >= 0 ? parts[cityIdx + 1] : undefined;
    const slug = cityIdx >= 0 ? parts[cityIdx + 2] : undefined;
    if (!slug) return null;
    const cleaned = slug
      .replace(/^(appartement|huis|parkeergelegenheid|bouwgrond)-/, "")
      .replace(/^\d{6,}-/, "")
      .replace(/-/g, " ")
      .trim();
    return [cleaned, city?.replace(/-/g, " ")].filter(Boolean).join(" ");
  } catch {
    return null;
  }
}
