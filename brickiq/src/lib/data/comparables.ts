import type { Comparable, EnergyLabel, Property, PropertyType } from "../types";
import { ENERGY_LABELS } from "../types";
import { conditionFactor, energyFactor, sizeFactor, typeFactor, ageFactor } from "../engine/factors";

/**
 * Comparable-sales provider abstraction.
 *
 * The demo ships with a SyntheticComparablesProvider only. A licensed
 * Kadaster (Kadaster Woningwaarde / transactieprijzen) or NVM provider can be
 * dropped in by implementing the same interface; the engine, UI, PDF and AI
 * analyst consume `Comparable[]` and the `source` field and do not need to
 * change.
 */
export interface ComparablesProvider {
  readonly id: string;
  readonly label: string;
  readonly provenance: Comparable["source"];
  isAvailable(): boolean;
  getComparables(subject: Property, count?: number): Comparable[];
}

/** Deterministic PRNG so the same property always gets the same demo comps. */
function seeded(seedText: string) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const STREET_STEMS = [
  "Lindenhof",
  "Esdoornstraat",
  "Molenkade",
  "Brouwerslaan",
  "Kastanjeplein",
  "Schippershof",
  "Wilgenpad",
  "Tuinderskade",
  "Ververstraat",
  "Klokkenhof",
];

export class SyntheticComparablesProvider implements ComparablesProvider {
  readonly id = "synthetic";
  readonly label = "Synthetic demo comparables";
  readonly provenance = "synthetic" as const;

  isAvailable() {
    return true;
  }

  getComparables(subject: Property, count = 6): Comparable[] {
    const rnd = seeded(subject.id + subject.address.value.display);
    const ref = subject.marketReference.value;
    const area = subject.livingArea.value;
    const subjType = subject.type.value;
    const subjYear = subject.buildYear.value;
    const subjLabelIdx = ENERGY_LABELS.indexOf(subject.energyLabel.value);
    const comps: Comparable[] = [];

    for (let i = 0; i < count; i++) {
      const cArea = Math.round(area * (0.78 + rnd() * 0.44));
      const cYear = Math.max(
        1880,
        Math.min(2025, Math.round(subjYear + (rnd() - 0.5) * 40)),
      );
      const labelIdx = Math.max(
        0,
        Math.min(ENERGY_LABELS.length - 1, subjLabelIdx + Math.round((rnd() - 0.5) * 4)),
      );
      const cLabel = ENERGY_LABELS[labelIdx] as EnergyLabel;
      const cCond = Math.max(1, Math.min(5, Math.round(subject.condition.value + (rnd() - 0.5) * 2.6)));
      const cType: PropertyType = rnd() > 0.8 ? neighbourType(subjType) : subjType;

      const intrinsic =
        typeFactor(cType) *
        sizeFactor(cArea) *
        energyFactor(cLabel) *
        conditionFactor(cCond) *
        ageFactor(cYear);
      const noise = 0.92 + rnd() * 0.16; // ±8% idiosyncratic noise
      const ppsm = Math.round(ref * intrinsic * noise);
      const price = Math.round((ppsm * cArea) / 1000) * 1000;

      // Adjust comp €/m² towards subject characteristics (classic grid adjustment)
      const subjIntrinsic =
        typeFactor(subjType) *
        sizeFactor(area) *
        energyFactor(subject.energyLabel.value) *
        conditionFactor(subject.condition.value) *
        ageFactor(subjYear);
      const adjusted = Math.round((price / cArea) * (subjIntrinsic / intrinsic));

      const distanceKm = Math.round((0.15 + rnd() * 1.6) * 10) / 10;
      const similarity = Math.round(
        100 -
          Math.abs(cArea - area) / area * 60 -
          Math.abs(cYear - subjYear) / 4 -
          distanceKm * 6 -
          (cType === subjType ? 0 : 10),
      );
      const stem = STREET_STEMS[Math.floor(rnd() * STREET_STEMS.length)];
      comps.push({
        id: `${subject.id}-comp-${i + 1}`,
        label: `Demo comp ${String.fromCharCode(65 + i)}`,
        street: `${stem} ${Math.floor(2 + rnd() * 180)} (fictional)`,
        distanceKm,
        type: cType,
        livingArea: cArea,
        buildYear: cYear,
        energyLabel: cLabel,
        condition: cCond,
        price,
        pricePerSqm: Math.round(price / cArea),
        adjustedPricePerSqm: adjusted,
        monthsAgo: 1 + Math.floor(rnd() * 11),
        similarity: Math.max(35, Math.min(97, similarity)),
        source: "synthetic",
        origin: "Synthetic — generated for demonstration, not a real sale",
      });
    }
    return comps.sort((a, b) => b.similarity - a.similarity);
  }
}

function neighbourType(t: PropertyType): PropertyType {
  const order: PropertyType[] = ["apartment", "terraced", "corner", "semi-detached", "detached"];
  const i = order.indexOf(t);
  return order[Math.min(order.length - 1, i + 1)] ?? t;
}

/**
 * Placeholder for licensed transaction data. Intentionally not available in
 * this build: BrickIQ never invents real-world transaction prices.
 */
export class KadasterComparablesProvider implements ComparablesProvider {
  readonly id = "kadaster";
  readonly label = "Kadaster transaction data (licensed)";
  readonly provenance = "verified" as const;
  isAvailable() {
    return false;
  }
  getComparables(): Comparable[] {
    throw new Error(
      "Kadaster transaction data requires a commercial licence and is not connected in this build.",
    );
  }
}

const providers: ComparablesProvider[] = [
  new KadasterComparablesProvider(),
  new SyntheticComparablesProvider(),
];

export function activeComparablesProvider(): ComparablesProvider {
  return providers.find((p) => p.isAvailable())!;
}
