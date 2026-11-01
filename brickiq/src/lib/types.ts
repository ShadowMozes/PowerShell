/**
 * BrickIQ core data model.
 *
 * Every value that reaches the user carries a provenance so the UI, the PDF
 * and the AI analyst can always distinguish:
 *  - verified  : retrieved from an official public source (PDOK Locatieserver, BAG)
 *  - user      : entered or overridden by the user
 *  - model     : estimated by the BrickIQ model (transparent, rule-based)
 *  - synthetic : fabricated demonstration data (never real transactions)
 */
export type Provenance = "verified" | "user" | "model" | "synthetic";

export interface Field<T> {
  value: T;
  source: Provenance;
  /** Human-readable origin, e.g. "BAG via PDOK" or "Demo dataset". */
  origin?: string;
}

export type PropertyType =
  | "apartment"
  | "terraced"
  | "corner"
  | "semi-detached"
  | "detached";

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apartment: "Apartment",
  terraced: "Terraced house",
  corner: "Corner house",
  "semi-detached": "Semi-detached house",
  detached: "Detached house",
};

export const ENERGY_LABELS = [
  "A++++",
  "A+++",
  "A++",
  "A+",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
] as const;
export type EnergyLabel = (typeof ENERGY_LABELS)[number];

export type Outdoor = "none" | "balcony" | "garden" | "roof-terrace";
export const OUTDOOR_LABEL: Record<Outdoor, string> = {
  none: "No outdoor space",
  balcony: "Balcony",
  garden: "Garden",
  "roof-terrace": "Roof terrace",
};

export type Leasehold = "freehold" | "bought-off" | "ongoing";
export const LEASEHOLD_LABEL: Record<Leasehold, string> = {
  freehold: "Freehold (eigen grond)",
  "bought-off": "Leasehold, bought off (afgekocht)",
  ongoing: "Leasehold, ongoing canon (erfpacht)",
};

export const CONDITION_LABEL: Record<number, string> = {
  1: "Needs full renovation",
  2: "Needs updating",
  3: "Average / livable",
  4: "Good, recently updated",
  5: "Excellent / turnkey",
};

export interface Address {
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  municipality?: string;
  province?: string;
  neighbourhood?: string;
  district?: string;
  display: string;
}

export interface BagRecord {
  verblijfsobjectId?: string;
  pandId?: string;
  nummeraanduidingId?: string;
  usage?: string;
  status?: string;
  floorArea?: number;
  buildYear?: number;
  retrievedFrom: string;
}

export interface Property {
  id: string;
  isDemo: boolean;
  /** Short marketing-style name for demo properties. */
  nickname?: string;
  tagline?: string;
  address: Field<Address>;
  coordinates?: Field<{ lat: number; lon: number }>;
  type: Field<PropertyType>;
  livingArea: Field<number>;
  plotArea?: Field<number>;
  buildYear: Field<number>;
  energyLabel: Field<EnergyLabel>;
  rooms: Field<number>;
  bedrooms: Field<number>;
  condition: Field<number>;
  outdoor: Field<Outdoor>;
  parking: Field<boolean>;
  leasehold: Field<Leasehold>;
  /** Annual ground-lease canon in EUR when leasehold is ongoing. */
  leaseholdAnnual?: Field<number>;
  /** Monthly owners' association (VvE) contribution. */
  vveMonthly?: Field<number>;
  askingPrice: Field<number>;
  /** Regional reference price per m² used as model prior. Always a model assumption. */
  marketReference: Field<number>;
  bag?: BagRecord;
  /** Reference URL the user pasted (e.g. Funda). Never fetched. */
  referenceUrl?: string;
  notes?: string[];
}

export interface Comparable {
  id: string;
  label: string;
  street: string;
  distanceKm: number;
  type: PropertyType;
  livingArea: number;
  buildYear: number;
  energyLabel: EnergyLabel;
  condition: number;
  /** Synthetic "sale" price. Never a real transaction in this build. */
  price: number;
  pricePerSqm: number;
  /** Price per m² adjusted to the subject's characteristics. */
  adjustedPricePerSqm: number;
  monthsAgo: number;
  similarity: number;
  source: Provenance;
  origin: string;
}
