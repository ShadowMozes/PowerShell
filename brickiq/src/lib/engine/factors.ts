import type { EnergyLabel, Leasehold, Outdoor, PropertyType } from "../types";

/**
 * Transparent multiplicative adjustment factors of the BrickIQ hedonic model.
 * Each factor is a plain, documented assumption. They are shown to the user
 * in the valuation breakdown and on the methodology page.
 */
export function typeFactor(t: PropertyType): number {
  return {
    apartment: 1.0,
    terraced: 0.96,
    corner: 0.99,
    "semi-detached": 1.04,
    detached: 1.1,
  }[t];
}

/** Larger homes trade at a lower price per m² (size elasticity −0.15 around 90 m²). */
export function sizeFactor(area: number): number {
  const a = Math.max(25, Math.min(400, area));
  return Math.pow(a / 90, -0.15);
}

export function ageFactor(year: number): number {
  if (year >= 2015) return 1.06;
  if (year >= 1995) return 1.02;
  if (year >= 1970) return 0.95;
  if (year >= 1945) return 0.96;
  if (year >= 1920) return 1.0;
  return 1.02; // pre-1920 character premium
}

export function energyFactor(label: EnergyLabel): number {
  const map: Record<EnergyLabel, number> = {
    "A++++": 1.06,
    "A+++": 1.055,
    "A++": 1.05,
    "A+": 1.045,
    A: 1.035,
    B: 1.015,
    C: 1.0,
    D: 0.98,
    E: 0.96,
    F: 0.94,
    G: 0.92,
  };
  return map[label];
}

export function conditionFactor(c: number): number {
  return [0.86, 0.93, 1.0, 1.04, 1.08][Math.max(1, Math.min(5, Math.round(c))) - 1];
}

export function outdoorFactor(o: Outdoor): number {
  return { none: 0.97, balcony: 1.0, garden: 1.03, "roof-terrace": 1.04 }[o];
}

export function parkingFactor(p: boolean): number {
  return p ? 1.025 : 1.0;
}

export function leaseholdFactor(l: Leasehold): number {
  return { freehold: 1.0, "bought-off": 0.99, ongoing: 0.95 }[l];
}

/** Indicative renovation reserve per m² by condition (model assumption). */
export function renovationReservePerSqm(c: number): number {
  return [950, 520, 180, 60, 0][Math.max(1, Math.min(5, Math.round(c))) - 1];
}

export const ENERGY_SCORE: Record<EnergyLabel, number> = {
  "A++++": 100,
  "A+++": 98,
  "A++": 96,
  "A+": 93,
  A: 88,
  B: 76,
  C: 62,
  D: 46,
  E: 32,
  F: 18,
  G: 8,
};
