import type { Property } from "../types";
import { analyze, type Analysis } from "./analysis";

/**
 * Bidding intelligence.
 *
 * Computes financial outcomes and risk indicators for a hypothetical offer.
 * It deliberately does NOT estimate the probability that a seller accepts an
 * offer: BrickIQ has no data that would support such a number.
 */
export interface BidInputs {
  askingPrice: number;
  offer: number;
  condition: number;
  /** e.g. -0.05 = 5% softer than the regional prior */
  marketAdjustment: number;
  ownFunds: number;
  interestRate: number; // annual, e.g. 0.039
  starterExemption: boolean;
}

export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export interface RiskIndicator {
  key: string;
  label: string;
  level: RiskLevel;
  value: string;
  explanation: string;
}

export interface BidOutcome {
  analysis: Analysis;
  offerVsAsking: number;
  offerVsFair: number;
  premiumOverFair: number;
  transferTax: number;
  otherCosts: { label: string; amount: number }[];
  totalBuyerCosts: number;
  /** Max mortgage assuming lender caps at 100% of appraised value = model estimate. */
  mortgageAmount: number;
  /** Shortfall to fund from own money if appraisal equals the model estimate. */
  valuationGap: number;
  cashRequired: number;
  fundingShortfall: number;
  monthlyGross: number;
  stressValue: number;
  equityAfterStress: number;
  risks: RiskIndicator[];
}

export const BUYER_COST_ASSUMPTIONS = [
  { label: "Notary & land registry", amount: 1800 },
  { label: "Mortgage advice", amount: 2800 },
  { label: "Valuation report (taxatie)", amount: 800 },
  { label: "Building survey", amount: 450 },
];

/** Dutch transfer tax for owner-occupied homes (2% standard rate). */
export const TRANSFER_TAX_RATE = 0.02;

export function annuityMonthly(principal: number, annualRate: number, years = 30): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function simulateBid(property: Property, input: BidInputs): BidOutcome {
  const analysis = analyze(property, {
    condition: input.condition,
    marketAdjustment: input.marketAdjustment,
    askingPrice: input.askingPrice,
  });
  const fair = analysis.valuation.fairValue;
  const offer = input.offer;

  const transferTax = input.starterExemption ? 0 : Math.round(offer * TRANSFER_TAX_RATE);
  const otherCosts = BUYER_COST_ASSUMPTIONS;
  const totalBuyerCosts = transferTax + otherCosts.reduce((a, c) => a + c.amount, 0);

  const mortgageAmount = Math.min(offer, fair);
  const valuationGap = Math.max(0, offer - fair);
  const cashRequired = valuationGap + totalBuyerCosts;
  const fundingShortfall = Math.max(0, cashRequired - input.ownFunds);
  const monthlyGross = annuityMonthly(mortgageAmount, input.interestRate);

  const stressValue = Math.round(fair * 0.9);
  const equityAfterStress = stressValue - mortgageAmount;

  const offerVsAsking = offer / input.askingPrice - 1;
  const offerVsFair = offer / fair - 1;
  const premiumOverFair = offer - fair;
  const { high } = analysis.valuation;

  const risks: RiskIndicator[] = [];

  // 1. Overpayment vs model range
  {
    const level: RiskLevel =
      offer <= fair ? "low" : offer <= high ? "moderate" : offer <= high * 1.05 ? "elevated" : "high";
    risks.push({
      key: "overpay",
      label: "Overpayment vs. estimate",
      level,
      value: `${offerVsFair >= 0 ? "+" : ""}${(offerVsFair * 100).toFixed(1)}%`,
      explanation:
        offer <= fair
          ? "Offer is at or below BrickIQ's central estimate."
          : offer <= high
            ? "Offer is above the central estimate but within the estimated range."
            : `Offer exceeds the upper end of the range (${fmt(high)}).`,
    });
  }
  // 2. Funding gap
  {
    const ratio = input.ownFunds > 0 ? cashRequired / input.ownFunds : Infinity;
    const level: RiskLevel = ratio <= 0.6 ? "low" : ratio <= 0.9 ? "moderate" : ratio <= 1 ? "elevated" : "high";
    risks.push({
      key: "funding",
      label: "Own-funds requirement",
      level,
      value: fmt(cashRequired),
      explanation:
        fundingShortfall > 0
          ? `Cash needed exceeds your stated own funds by ${fmt(fundingShortfall)}, assuming the appraisal matches BrickIQ's estimate.`
          : `Costs plus any valuation gap use ${Math.round(Math.min(ratio, 9.99) * 100)}% of your stated own funds.`,
    });
  }
  // 3. Condition / renovation
  {
    const reserve = analysis.renovationReserve;
    const level: RiskLevel = reserve === 0 ? "low" : reserve < 15000 ? "moderate" : reserve < 50000 ? "elevated" : "high";
    risks.push({
      key: "condition",
      label: "Renovation exposure",
      level,
      value: fmt(reserve),
      explanation: "Indicative reserve based on condition and living area. Confirm with a building survey.",
    });
  }
  // 4. Market sensitivity
  {
    const level: RiskLevel = equityAfterStress >= 0 ? "low" : equityAfterStress > -25000 ? "moderate" : equityAfterStress > -60000 ? "elevated" : "high";
    risks.push({
      key: "market",
      label: "10% market correction",
      level,
      value: `${equityAfterStress >= 0 ? "+" : "−"}${fmt(Math.abs(equityAfterStress))}`,
      explanation: `If values fell 10% to ${fmt(stressValue)}, home equity vs. the modelled mortgage would be ${equityAfterStress >= 0 ? "positive" : "negative"}.`,
    });
  }

  return {
    analysis,
    offerVsAsking,
    offerVsFair,
    premiumOverFair,
    transferTax,
    otherCosts,
    totalBuyerCosts,
    mortgageAmount,
    valuationGap,
    cashRequired,
    fundingShortfall,
    monthlyGross,
    stressValue,
    equityAfterStress,
    risks,
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Math.round(n));
}

export function defaultBidInputs(property: Property): BidInputs {
  return {
    askingPrice: property.askingPrice.value,
    offer: property.askingPrice.value,
    condition: property.condition.value,
    marketAdjustment: 0,
    ownFunds: Math.round((property.askingPrice.value * 0.1) / 5000) * 5000,
    interestRate: 0.039,
    starterExemption: false,
  };
}
