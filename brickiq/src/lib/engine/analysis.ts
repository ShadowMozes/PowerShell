import type { Comparable, Property } from "../types";
import { activeComparablesProvider } from "../data/comparables";
import {
  ageFactor,
  conditionFactor,
  energyFactor,
  ENERGY_SCORE,
  leaseholdFactor,
  outdoorFactor,
  parkingFactor,
  renovationReservePerSqm,
  sizeFactor,
  typeFactor,
} from "./factors";
import { CONDITION_LABEL, LEASEHOLD_LABEL, OUTDOOR_LABEL, PROPERTY_TYPE_LABEL } from "../types";

export interface FactorLine {
  key: string;
  label: string;
  detail: string;
  factor: number;
}

export interface Valuation {
  modelPricePerSqm: number;
  compsMedianPricePerSqm: number;
  blendedPricePerSqm: number;
  fairValue: number;
  low: number;
  high: number;
  rangePct: number;
  confidence: number;
  factors: FactorLine[];
  modelWeight: number;
  compsWeight: number;
  marketAdjustment: number;
}

export interface ScoreComponent {
  key: string;
  label: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface DealScore {
  total: number;
  band: "Strong" | "Favourable" | "Fair" | "Stretched" | "Overpriced";
  components: ScoreComponent[];
}

export interface Insight {
  kind: "strength" | "risk";
  title: string;
  detail: string;
  severity?: "low" | "medium" | "high";
}

export interface Analysis {
  property: Property;
  comparables: Comparable[];
  valuation: Valuation;
  score: DealScore;
  insights: Insight[];
  askingPricePerSqm: number;
  askingVsFair: number;
  monthlyOwnershipCosts: number;
  renovationReserve: number;
  comparablesProvider: string;
}

export interface AnalysisOptions {
  /** Override condition (bidding simulator). */
  condition?: number;
  /** Market assumption, e.g. -0.05 for 5% softer than the prior. */
  marketAdjustment?: number;
  /** Override asking price (bidding simulator). */
  askingPrice?: number;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

export function analyze(property: Property, opts: AnalysisOptions = {}): Analysis {
  const condition = opts.condition ?? property.condition.value;
  const marketAdjustment = opts.marketAdjustment ?? 0;
  const asking = opts.askingPrice ?? property.askingPrice.value;
  const subject: Property = {
    ...property,
    condition: { ...property.condition, value: condition },
  };
  const area = subject.livingArea.value;

  const provider = activeComparablesProvider();
  const comparables = provider.getComparables(subject, 6);

  // ---------- Hedonic model ----------
  const ref = subject.marketReference.value;
  const factors: FactorLine[] = [
    {
      key: "type",
      label: "Property type",
      detail: PROPERTY_TYPE_LABEL[subject.type.value],
      factor: typeFactor(subject.type.value),
    },
    { key: "size", label: "Size elasticity", detail: `${area} m² vs 90 m² reference`, factor: sizeFactor(area) },
    { key: "age", label: "Construction period", detail: `Built ${subject.buildYear.value}`, factor: ageFactor(subject.buildYear.value) },
    { key: "energy", label: "Energy label", detail: `Label ${subject.energyLabel.value}`, factor: energyFactor(subject.energyLabel.value) },
    { key: "condition", label: "Condition", detail: CONDITION_LABEL[condition], factor: conditionFactor(condition) },
    { key: "outdoor", label: "Outdoor space", detail: OUTDOOR_LABEL[subject.outdoor.value], factor: outdoorFactor(subject.outdoor.value) },
    { key: "parking", label: "Parking", detail: subject.parking.value ? "Private parking" : "No private parking", factor: parkingFactor(subject.parking.value) },
    { key: "leasehold", label: "Land tenure", detail: LEASEHOLD_LABEL[subject.leasehold.value], factor: leaseholdFactor(subject.leasehold.value) },
    { key: "market", label: "Market assumption", detail: marketAdjustment === 0 ? "Neutral vs prior" : `${pct(marketAdjustment)} vs prior`, factor: 1 + marketAdjustment },
  ];
  const product = factors.reduce((acc, f) => acc * f.factor, 1);
  const modelPricePerSqm = Math.round(ref * product);

  // ---------- Comparables ----------
  // Comps already adjusted to subject characteristics; apply market assumption & tenure/outdoor/parking
  const compAdj =
    (1 + marketAdjustment) *
    outdoorFactor(subject.outdoor.value) *
    parkingFactor(subject.parking.value) *
    leaseholdFactor(subject.leasehold.value);
  const compsMedianPricePerSqm = Math.round(
    median(comparables.map((c) => c.adjustedPricePerSqm)) * compAdj,
  );

  // Synthetic comps receive a lower weight than licensed data would.
  const compsWeight = provider.provenance === "verified" ? 0.6 : 0.4;
  const modelWeight = 1 - compsWeight;
  const blendedPricePerSqm = Math.round(
    modelPricePerSqm * modelWeight + compsMedianPricePerSqm * compsWeight,
  );
  const fairValue = Math.round((blendedPricePerSqm * area) / 1000) * 1000;

  // ---------- Uncertainty ----------
  const sorted = comparables.map((c) => c.adjustedPricePerSqm).sort((a, b) => a - b);
  const dispersion = (sorted[sorted.length - 2] - sorted[1]) / median(sorted); // inter-quantile spread
  const coreFields = [
    subject.livingArea,
    subject.buildYear,
    subject.energyLabel,
    subject.type,
    subject.address,
  ];
  const verifiedShare = coreFields.filter((f) => f.source === "verified").length / coreFields.length;
  const syntheticPenalty = provider.provenance === "synthetic" ? 0.02 : 0;
  const rangePct = Math.min(
    0.18,
    0.04 + dispersion * 0.15 + (1 - verifiedShare) * 0.025 + syntheticPenalty + Math.abs(marketAdjustment) * 0.2,
  );
  const low = Math.round((fairValue * (1 - rangePct)) / 1000) * 1000;
  const high = Math.round((fairValue * (1 + rangePct)) / 1000) * 1000;
  const confidence = Math.round(clamp(100 - rangePct * 400, 20, 95));

  const valuation: Valuation = {
    modelPricePerSqm,
    compsMedianPricePerSqm,
    blendedPricePerSqm,
    fairValue,
    low,
    high,
    rangePct,
    confidence,
    factors,
    modelWeight,
    compsWeight,
    marketAdjustment,
  };

  // ---------- Costs ----------
  const askingPricePerSqm = Math.round(asking / area);
  const askingVsFair = asking / fairValue - 1;
  const leaseMonthly = subject.leasehold.value === "ongoing" ? (subject.leaseholdAnnual?.value ?? 0) / 12 : 0;
  const monthlyOwnershipCosts = Math.round((subject.vveMonthly?.value ?? 0) + leaseMonthly);
  const renovationReserve = Math.round((renovationReservePerSqm(condition) * area) / 500) * 500;

  // ---------- Deal score ----------
  const priceScore = clamp(55 - askingVsFair * 300);
  const ppsmVsComps = askingPricePerSqm / compsMedianPricePerSqm - 1;
  const compsScore = clamp(55 - ppsmVsComps * 260);
  const energyScore = ENERGY_SCORE[subject.energyLabel.value];
  const age = new Date().getFullYear() - subject.buildYear.value;
  const conditionScore = clamp(condition * 20 - (condition < 4 && age > 80 ? 10 : 0) + (age < 10 ? 5 : 0));
  const costRatio = (monthlyOwnershipCosts * 12) / asking; // annual fixed costs vs price
  const ownershipScore = clamp(100 - costRatio * 2500);
  const dataScore = clamp(Math.round(verifiedShare * 70 + (provider.provenance === "verified" ? 30 : 10)));

  const components: ScoreComponent[] = [
    {
      key: "price",
      label: "Asking price vs. estimated value",
      weight: 0.35,
      score: Math.round(priceScore),
      explanation: `Asking is ${pct(askingVsFair)} vs. BrickIQ's model estimate of ${eur(fairValue)}.`,
    },
    {
      key: "comps",
      label: "Price per m² vs. comparables",
      weight: 0.2,
      score: Math.round(compsScore),
      explanation: `${eur(askingPricePerSqm)}/m² asking vs. ${eur(compsMedianPricePerSqm)}/m² adjusted comparable median (${pct(ppsmVsComps)}).`,
    },
    {
      key: "energy",
      label: "Energy & sustainability",
      weight: 0.15,
      score: energyScore,
      explanation: `Energy label ${subject.energyLabel.value}. Better labels lower running costs and can increase mortgage capacity.`,
    },
    {
      key: "condition",
      label: "Condition & maintenance",
      weight: 0.15,
      score: Math.round(conditionScore),
      explanation: `${CONDITION_LABEL[condition]}; built ${subject.buildYear.value} (${age} yrs). Indicative reserve ${eur(renovationReserve)}.`,
    },
    {
      key: "ownership",
      label: "Ownership costs & tenure",
      weight: 0.1,
      score: Math.round(ownershipScore),
      explanation:
        monthlyOwnershipCosts > 0
          ? `${eur(monthlyOwnershipCosts)}/month in VvE and/or ground-lease costs.`
          : "No recurring VvE or ground-lease costs recorded.",
    },
    {
      key: "data",
      label: "Data confidence",
      weight: 0.05,
      score: dataScore,
      explanation: `${Math.round(verifiedShare * 100)}% of core fields verified from official sources; comparables are ${provider.provenance === "synthetic" ? "synthetic demo data" : "licensed"}.`,
    },
  ];
  const total = Math.round(components.reduce((acc, c) => acc + c.score * c.weight, 0));
  const band: DealScore["band"] =
    total >= 80 ? "Strong" : total >= 65 ? "Favourable" : total >= 50 ? "Fair" : total >= 35 ? "Stretched" : "Overpriced";

  // ---------- Insights ----------
  const insights: Insight[] = [];
  if (askingVsFair <= -0.03)
    insights.push({ kind: "strength", title: "Asking below model estimate", detail: `The asking price sits ${pct(-askingVsFair).replace("+", "")} below BrickIQ's central estimate.` });
  if (askingVsFair >= 0.05)
    insights.push({ kind: "risk", severity: askingVsFair > 0.1 ? "high" : "medium", title: "Asking above model estimate", detail: `Asking is ${pct(askingVsFair)} above the central estimate${asking > high ? " and above the upper bound of the range" : ""}.` });
  if (["A++++", "A+++", "A++", "A+", "A", "B"].includes(subject.energyLabel.value))
    insights.push({ kind: "strength", title: `Energy label ${subject.energyLabel.value}`, detail: "Efficient homes typically have lower energy bills and may qualify for extra borrowing capacity under Dutch lending rules." });
  if (["E", "F", "G"].includes(subject.energyLabel.value))
    insights.push({ kind: "risk", severity: "medium", title: `Weak energy label (${subject.energyLabel.value})`, detail: "Expect higher energy costs and budget for insulation upgrades; get a quote before bidding." });
  if (subject.energyLabel.value === "D")
    insights.push({ kind: "risk", severity: "low", title: "Energy label D", detail: "Average efficiency for older stock; upgrades (glazing, insulation) could be worthwhile." });
  if (condition >= 4)
    insights.push({ kind: "strength", title: "Move-in ready", detail: "Good condition limits short-term renovation spend." });
  if (condition <= 2)
    insights.push({ kind: "risk", severity: condition === 1 ? "high" : "medium", title: "Renovation required", detail: `Indicative renovation reserve of ${eur(renovationReserve)} — commission a building survey (bouwkundige keuring).` });
  if (subject.buildYear.value < 1940)
    insights.push({ kind: "risk", severity: "low", title: "Pre-war construction", detail: "Check foundations (wooden piles in many Dutch cities), roof and moisture during a building survey." });
  if (subject.leasehold.value === "ongoing")
    insights.push({ kind: "risk", severity: "medium", title: "Ongoing ground lease (erfpacht)", detail: `Canon of ${eur(subject.leaseholdAnnual?.value ?? 0)}/year recorded. Verify the term end date and any future indexation with the municipality.` });
  if ((subject.vveMonthly?.value ?? 0) > 250)
    insights.push({ kind: "risk", severity: "low", title: "Higher VvE contribution", detail: "Request the VvE's long-term maintenance plan (MJOP) and reserve fund balance." });
  if (subject.vveMonthly && (subject.vveMonthly.value ?? 0) > 0 && (subject.vveMonthly.value ?? 0) <= 250)
    insights.push({ kind: "strength", title: "Active owners' association", detail: "A VvE contribution indicates shared maintenance funding — check the reserve fund is healthy." });
  if (subject.outdoor.value === "garden" || subject.outdoor.value === "roof-terrace")
    insights.push({ kind: "strength", title: OUTDOOR_LABEL[subject.outdoor.value], detail: "Private outdoor space is scarce in Dutch cities and supports resale appeal." });
  if (subject.parking.value)
    insights.push({ kind: "strength", title: "Private parking", detail: "Parking permits are scarce in many urban districts." });
  if (rangePct > 0.1)
    insights.push({ kind: "risk", severity: "low", title: "Wide valuation range", detail: "Data uncertainty is elevated; treat the central estimate with caution and get a certified appraisal." });

  return {
    property: subject,
    comparables,
    valuation,
    score: { total, band, components },
    insights,
    askingPricePerSqm,
    askingVsFair,
    monthlyOwnershipCosts,
    renovationReserve,
    comparablesProvider: provider.label,
  };
}

export function eur(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function eurShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${Math.round(n)}`;
}
