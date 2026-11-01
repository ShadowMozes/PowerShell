/**
 * Regional reference prices per m² used as the *prior* of the BrickIQ model.
 *
 * IMPORTANT: these are rounded, indicative model assumptions maintained by
 * BrickIQ for demonstration purposes. They are NOT transaction prices and are
 * NOT sourced from Kadaster. Users can override them per property. When
 * licensed Kadaster/NVM data is connected, this table is replaced by a
 * data-driven neighbourhood index (see src/lib/data/comparables.ts).
 */
export interface MarketRef {
  key: string;
  label: string;
  pricePerSqm: number;
}

export const MARKET_REFERENCES: MarketRef[] = [
  { key: "amsterdam", label: "Amsterdam", pricePerSqm: 7600 },
  { key: "amstelveen", label: "Amstelveen", pricePerSqm: 6200 },
  { key: "haarlem", label: "Haarlem", pricePerSqm: 5900 },
  { key: "utrecht", label: "Utrecht", pricePerSqm: 5600 },
  { key: "leiden", label: "Leiden", pricePerSqm: 5100 },
  { key: "den haag", label: "Den Haag", pricePerSqm: 4800 },
  { key: "'s-gravenhage", label: "Den Haag", pricePerSqm: 4800 },
  { key: "delft", label: "Delft", pricePerSqm: 4700 },
  { key: "rotterdam", label: "Rotterdam", pricePerSqm: 4400 },
  { key: "eindhoven", label: "Eindhoven", pricePerSqm: 4300 },
  { key: "nijmegen", label: "Nijmegen", pricePerSqm: 4200 },
  { key: "groningen", label: "Groningen", pricePerSqm: 3900 },
  { key: "arnhem", label: "Arnhem", pricePerSqm: 3800 },
  { key: "zwolle", label: "Zwolle", pricePerSqm: 3800 },
  { key: "tilburg", label: "Tilburg", pricePerSqm: 3600 },
  { key: "maastricht", label: "Maastricht", pricePerSqm: 3700 },
];

export const DEFAULT_MARKET_REF = 4000;

export function marketReferenceFor(city?: string, municipality?: string): {
  pricePerSqm: number;
  label: string;
  matched: boolean;
} {
  const candidates = [municipality, city]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim());
  for (const c of candidates) {
    const hit = MARKET_REFERENCES.find((m) => m.key === c);
    if (hit) return { pricePerSqm: hit.pricePerSqm, label: hit.label, matched: true };
  }
  return {
    pricePerSqm: DEFAULT_MARKET_REF,
    label: "National default",
    matched: false,
  };
}

export const CITY_OPTIONS = MARKET_REFERENCES.filter(
  (m) => m.key !== "'s-gravenhage",
).map((m) => m.label);
