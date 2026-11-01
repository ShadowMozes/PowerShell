import type { Analysis } from "./engine/analysis";
import { eur } from "./engine/analysis";
import type { BidOutcome, BidInputs } from "./engine/bidding";
import { CONDITION_LABEL, LEASEHOLD_LABEL, PROPERTY_TYPE_LABEL } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const SUGGESTED_QUESTIONS = [
  "How did you arrive at the estimated value?",
  "Why is the Deal Score what it is?",
  "What are the biggest risks here?",
  "What should I consider when bidding?",
  "Which data is verified and which is synthetic?",
];

/** Compact, provenance-labelled context passed to the live model. */
export function buildAnalystContext(a: Analysis, bid?: { inputs: BidInputs; outcome: BidOutcome }) {
  const p = a.property;
  const f = <T,>(x: { value: T; source: string } | undefined) =>
    x ? { value: x.value, provenance: x.source } : undefined;
  return {
    property: {
      address: f(p.address) && { value: p.address.value.display, provenance: p.address.source },
      isDemo: p.isDemo,
      type: f(p.type),
      livingAreaM2: f(p.livingArea),
      plotAreaM2: f(p.plotArea),
      buildYear: f(p.buildYear),
      energyLabel: f(p.energyLabel),
      condition: { value: `${p.condition.value}/5 – ${CONDITION_LABEL[p.condition.value]}`, provenance: p.condition.source },
      outdoor: f(p.outdoor),
      parking: f(p.parking),
      tenure: f(p.leasehold),
      groundLeaseAnnualEur: f(p.leaseholdAnnual),
      vveMonthlyEur: f(p.vveMonthly),
      askingPriceEur: f(p.askingPrice),
      regionalPriorPerM2: f(p.marketReference),
      bag: p.bag ?? null,
    },
    valuation: {
      provenance: "model",
      fairValueEur: a.valuation.fairValue,
      rangeEur: [a.valuation.low, a.valuation.high],
      confidence: a.valuation.confidence,
      modelPricePerM2: a.valuation.modelPricePerSqm,
      comparablesMedianAdjustedPerM2: a.valuation.compsMedianPricePerSqm,
      blendWeights: { model: a.valuation.modelWeight, comparables: a.valuation.compsWeight },
      factors: a.valuation.factors.map((x) => ({ factor: x.label, detail: x.detail, multiplier: Number(x.factor.toFixed(3)) })),
      askingPerM2: a.askingPricePerSqm,
      askingVsEstimatePct: Number((a.askingVsFair * 100).toFixed(1)),
    },
    dealScore: {
      provenance: "model",
      total: a.score.total,
      band: a.score.band,
      components: a.score.components.map((c) => ({ label: c.label, weight: c.weight, score: c.score, why: c.explanation })),
    },
    comparables: {
      provenance: "synthetic",
      provider: a.comparablesProvider,
      items: a.comparables.map((c) => ({
        label: c.label,
        areaM2: c.livingArea,
        buildYear: c.buildYear,
        label_energy: c.energyLabel,
        price: c.price,
        perM2: c.pricePerSqm,
        adjustedPerM2: c.adjustedPricePerSqm,
        monthsAgo: c.monthsAgo,
        distanceKm: c.distanceKm,
      })),
    },
    insights: a.insights,
    monthlyOwnershipCostsEur: a.monthlyOwnershipCosts,
    renovationReserveEur: a.renovationReserve,
    biddingScenario: bid
      ? {
          inputs: bid.inputs,
          offerVsAskingPct: Number((bid.outcome.offerVsAsking * 100).toFixed(1)),
          offerVsEstimatePct: Number((bid.outcome.offerVsFair * 100).toFixed(1)),
          buyerCostsEur: bid.outcome.totalBuyerCosts,
          valuationGapEur: bid.outcome.valuationGap,
          cashRequiredEur: bid.outcome.cashRequired,
          fundingShortfallEur: bid.outcome.fundingShortfall,
          modelledMortgageEur: bid.outcome.mortgageAmount,
          monthlyGrossEur: Math.round(bid.outcome.monthlyGross),
          risks: bid.outcome.risks,
        }
      : null,
  };
}

export const ANALYST_SYSTEM_PROMPT = `You are the BrickIQ Property Analyst, helping Dutch homebuyers understand a property intelligence report.

Ground every answer in the JSON report context you are given. Each value carries a provenance:
- "verified": from official public registers (PDOK Locatieserver / BAG)
- "user": entered by the user
- "model": BrickIQ's transparent rule-based estimate
- "synthetic": fabricated demonstration data (e.g. comparable sales) — never real transactions
When you cite a number, make its provenance clear when it matters. If the property is a demo (isDemo true), remind the user the property and its data are fictional where relevant.

Hard rules:
- BrickIQ estimates are indicative model outputs, not certified valuations (no taxatierapport). Never present them otherwise.
- Never estimate or imply a probability that a seller will accept an offer, and never invent market statistics, transaction prices, or facts not in the context.
- Do not give personalised financial, legal or tax advice; suggest a mortgage adviser, aankoopmakelaar, notary or building surveyor where appropriate.
- Dutch context is welcome (erfpacht, VvE, kosten koper, overdrachtsbelasting, bouwkundige keuring, NHG) but explain terms briefly.

Style: warm, precise and concise. Lead with the answer in one or two sentences, then up to 4 short bullet points. Use euro amounts formatted like €512.000. Respond in the language the user writes in (Dutch or English).`;

/**
 * Deterministic analyst used when no AI credentials are configured. It is
 * clearly labelled in the UI as rule-based — it is not presented as live AI.
 */
export function deterministicAnswer(
  question: string,
  a: Analysis,
  bid?: { inputs: BidInputs; outcome: BidOutcome },
): string {
  const q = question.toLowerCase();
  const p = a.property;
  const v = a.valuation;
  const demoNote = p.isDemo ? "\n\n_Note: this is a fictional demo property; all figures are demonstration data._" : "";
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has("verified", "synthetic", "source", "data", "bron", "geverifieerd", "kadaster", "bag")) {
    const rows = [
      ["Address", p.address.source],
      ["Living area", p.livingArea.source],
      ["Build year", p.buildYear.source],
      ["Energy label", p.energyLabel.source],
      ["Asking price", p.askingPrice.source],
      ["Regional prior €/m²", p.marketReference.source],
    ];
    return (
      `Here is how the data in this report is sourced:\n\n` +
      rows.map(([k, s]) => `- **${k}**: ${s}`).join("\n") +
      `\n- **Comparable sales**: synthetic demo data (${a.comparablesProvider}). No real transaction prices are used.` +
      `\n- **Fair value, range and Deal Score**: model estimates.` +
      (p.bag ? `\n\nBAG record: ${p.bag.retrievedFrom}${p.bag.floorArea ? `, ${p.bag.floorArea} m²` : ""}${p.bag.buildYear ? `, built ${p.bag.buildYear}` : ""}.` : "") +
      demoNote
    );
  }

  if (has("bid", "offer", "bod", "bieden", "overbid", "overbieden", "negotiat")) {
    const b = bid?.outcome;
    const lines = [
      `The model estimate is **${eur(v.fairValue)}** (range ${eur(v.low)} – ${eur(v.high)}), versus an asking price of ${eur(p.askingPrice.value)}.`,
    ];
    if (b && bid) {
      lines.push(
        `\nYour current scenario — an offer of **${eur(bid.inputs.offer)}** (${pctStr(b.offerVsAsking)} vs asking, ${pctStr(b.offerVsFair)} vs estimate):`,
        `- Buyer costs (kosten koper): ~${eur(b.totalBuyerCosts)}`,
        b.valuationGap > 0
          ? `- If the appraisal matches our estimate, ~${eur(b.valuationGap)} of the price would need to come from own funds (Dutch mortgages are capped at 100% of market value).`
          : `- The offer is at or below the estimate, so no valuation gap is modelled.`,
        `- Cash required: ~${eur(b.cashRequired)}${b.fundingShortfall > 0 ? ` — **${eur(b.fundingShortfall)} more than your stated own funds**` : ""}.`,
        `- Gross monthly mortgage (30-yr annuity at ${(bid.inputs.interestRate * 100).toFixed(1)}%): ~${eur(b.monthlyGross)}.`,
      );
    } else {
      lines.push(
        `- Offers above ${eur(v.high)} exceed the top of BrickIQ's range.`,
        `- Anything above the eventual appraisal must be funded from own money.`,
      );
    }
    lines.push(
      `\nBrickIQ does not estimate whether a seller will accept an offer. Consider discussing strategy with an independent aankoopmakelaar.`,
    );
    return lines.join("\n") + demoNote;
  }

  if (has("risk", "risico", "concern", "watch", "danger", "nadelen")) {
    const risks = a.insights.filter((i) => i.kind === "risk");
    if (!risks.length) return `No major risk flags were raised by the model for this property, but always commission a building survey and review legal documents.${demoNote}`;
    return (
      `The main points to investigate:\n\n` +
      risks.map((r) => `- **${r.title}**${r.severity ? ` (${r.severity})` : ""}: ${r.detail}`).join("\n") +
      `\n\nThese are rule-based flags from the available data — not an inspection.` +
      demoNote
    );
  }

  if (has("strength", "good", "pros", "voordelen", "sterk", "positive")) {
    const s = a.insights.filter((i) => i.kind === "strength");
    return (s.length ? `What works in this property's favour:\n\n${s.map((x) => `- **${x.title}**: ${x.detail}`).join("\n")}` : "The model found few standout strengths in the available data.") + demoNote;
  }

  if (has("score", "deal")) {
    const sorted = [...a.score.components].sort((x, y) => x.score - y.score);
    return (
      `The Deal Score is **${a.score.total}/100 (${a.score.band})** — a weighted average of six transparent components:\n\n` +
      a.score.components.map((c) => `- ${c.label} (${Math.round(c.weight * 100)}%): **${c.score}** — ${c.explanation}`).join("\n") +
      `\n\nThe weakest component is *${sorted[0].label.toLowerCase()}*; the strongest is *${sorted[sorted.length - 1].label.toLowerCase()}*.` +
      demoNote
    );
  }

  if (has("energy", "label", "energie", "duurzaam", "insulat")) {
    return `The property has energy label **${p.energyLabel.value}** (${p.energyLabel.source}). In the model this applies a ×${a.valuation.factors.find((f) => f.key === "energy")!.factor.toFixed(3)} adjustment to the price per m², and it scores ${a.score.components.find((c) => c.key === "energy")!.score}/100 on sustainability. Verify the registered label on EP-Online before bidding.${demoNote}`;
  }

  if (has("erfpacht", "leasehold", "ground lease", "vve", "cost", "kosten", "monthly")) {
    return (
      `Tenure: **${LEASEHOLD_LABEL[p.leasehold.value]}**.` +
      (p.leaseholdAnnual ? ` Ground-lease canon: ${eur(p.leaseholdAnnual.value)}/year.` : "") +
      (p.vveMonthly ? ` VvE contribution: ${eur(p.vveMonthly.value)}/month.` : "") +
      `\n\nRecurring ownership costs recorded: **${eur(a.monthlyOwnershipCosts)}/month** (excluding mortgage, energy and municipal taxes).` +
      (p.leasehold.value === "ongoing" ? `\n\n- Check when the current erfpacht period ends and how the canon will be revised.` : "") +
      (p.vveMonthly ? `\n- Ask for the VvE's maintenance plan (MJOP) and reserve fund.` : "") +
      demoNote
    );
  }

  if (has("comp", "vergelijk", "similar", "sales", "verkoch")) {
    return (
      `BrickIQ compared this home with ${a.comparables.length} **synthetic demo comparables** (no real sales). After adjusting each one for size, age, energy label and condition, their median is **${eur(v.compsMedianPricePerSqm)}/m²**, versus ${eur(a.askingPricePerSqm)}/m² asking.\n\n` +
      a.comparables.slice(0, 3).map((c) => `- ${c.label}: ${c.livingArea} m², ${eur(c.price)} → adjusted ${eur(c.adjustedPricePerSqm)}/m²`).join("\n") +
      `\n\nWith licensed Kadaster transaction data connected, these would be replaced by real nearby sales.` +
      demoNote
    );
  }

  // Default: valuation explanation
  const top = [...v.factors].filter((f) => f.factor !== 1).sort((x, y) => Math.abs(y.factor - 1) - Math.abs(x.factor - 1)).slice(0, 4);
  return (
    `BrickIQ estimates this ${PROPERTY_TYPE_LABEL[p.type.value].toLowerCase()} at **${eur(v.fairValue)}**, with a range of ${eur(v.low)} – ${eur(v.high)} (confidence ${v.confidence}/100). The asking price is ${pctStr(a.askingVsFair)} versus that estimate.\n\n` +
    `How it's built:\n` +
    `- Start from a regional prior of ${eur(p.marketReference.value)}/m² (model assumption).\n` +
    top.map((f) => `- ${f.label} (${f.detail}): ×${f.factor.toFixed(3)}`).join("\n") +
    `\n- Model result ${eur(v.modelPricePerSqm)}/m² is blended ${Math.round(v.modelWeight * 100)}/${Math.round(v.compsWeight * 100)} with the adjusted comparable median of ${eur(v.compsMedianPricePerSqm)}/m².\n\n` +
    `This is an indicative model estimate — not a certified valuation (taxatie).` +
    demoNote
  );
}

function pctStr(x: number) {
  return `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
}
