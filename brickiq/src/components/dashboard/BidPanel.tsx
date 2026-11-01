"use client";

import { useMemo } from "react";
import { ArrowRight, Info, RotateCcw, ShieldAlert } from "lucide-react";
import type { Property } from "@/lib/types";
import { CONDITION_LABEL } from "@/lib/types";
import { eur } from "@/lib/engine/analysis";
import { defaultBidInputs, simulateBid, type BidInputs, type BidOutcome, type RiskLevel } from "@/lib/engine/bidding";
import { Button, Card, Disclaimer, Eyebrow, ProvenanceTag, cn } from "../ui";
import { OfferCurve, ValueRangeBar } from "../charts";
import type { TabKey } from "./Dashboard";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="num text-[15px] font-semibold">{display}</span>
      </div>
      <input
        type="range"
        className="slider mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--fill" as string]: `${fill}%` }}
        aria-valuetext={display}
      />
      {hint && <div className="text-[11.5px] text-muted">{hint}</div>}
    </label>
  );
}

const LEVEL: Record<RiskLevel, { label: string; cls: string; dot: string }> = {
  low: { label: "Low", cls: "bg-mint text-emerald", dot: "bg-emerald-2" },
  moderate: { label: "Moderate", cls: "bg-gold-soft text-gold", dot: "bg-gold" },
  elevated: { label: "Elevated", cls: "bg-rose-soft text-rose", dot: "bg-[#c0673f]" },
  high: { label: "High", cls: "bg-rose text-ivory", dot: "bg-rose" },
};

export function BidPanel({
  property,
  inputs,
  onChange,
  outcome: o,
  onNavigate,
}: {
  property: Property;
  inputs: BidInputs;
  onChange: (b: BidInputs) => void;
  outcome: BidOutcome;
  onNavigate: (t: TabKey) => void;
}) {
  const set = <K extends keyof BidInputs>(k: K, v: BidInputs[K]) => onChange({ ...inputs, [k]: v });
  const v = o.analysis.valuation;
  const baseAsking = property.askingPrice.value;
  const askMin = Math.round((baseAsking * 0.8) / 5000) * 5000;
  const askMax = Math.round((baseAsking * 1.2) / 5000) * 5000;
  const offerMin = Math.round((inputs.askingPrice * 0.85) / 1000) * 1000;
  const offerMax = Math.round((inputs.askingPrice * 1.2) / 1000) * 1000;

  const curve = useMemo(() => {
    const pts: { offer: number; cash: number }[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const offer = Math.round(offerMin + ((offerMax - offerMin) * i) / steps);
      const r = simulateBid(property, { ...inputs, offer });
      pts.push({ offer, cash: r.cashRequired });
    }
    return pts;
  }, [property, inputs, offerMin, offerMax]);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-emerald-2" />
        <p>
          The simulator shows the <strong>financial consequences</strong> of an offer. It does not — and cannot honestly — predict whether a seller will accept it.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Controls */}
        <Card className="space-y-6 p-5 sm:p-6 lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Your scenario</h2>
            <Button variant="ghost" size="sm" onClick={() => onChange(defaultBidInputs(property))}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
          <Slider
            label="Asking price"
            value={inputs.askingPrice}
            min={askMin}
            max={askMax}
            step={5000}
            onChange={(val) => onChange({ ...inputs, askingPrice: val, offer: Math.max(Math.round(val * 0.85), Math.min(Math.round(val * 1.2), inputs.offer)) })}
            display={eur(inputs.askingPrice)}
            hint={inputs.askingPrice !== baseAsking ? `Listed: ${eur(baseAsking)}` : "As listed"}
          />
          <Slider
            label="Your intended offer"
            value={inputs.offer}
            min={offerMin}
            max={offerMax}
            step={1000}
            onChange={(val) => set("offer", val)}
            display={eur(inputs.offer)}
            hint={`${o.offerVsAsking >= 0 ? "+" : ""}${(o.offerVsAsking * 100).toFixed(1)}% vs asking`}
          />
          <Slider
            label="Property condition"
            value={inputs.condition}
            min={1}
            max={5}
            step={1}
            onChange={(val) => set("condition", val)}
            display={`${inputs.condition}/5`}
            hint={CONDITION_LABEL[inputs.condition]}
          />
          <Slider
            label="Comparable market assumption"
            value={Math.round(inputs.marketAdjustment * 100)}
            min={-10}
            max={10}
            step={1}
            onChange={(val) => set("marketAdjustment", val / 100)}
            display={`${inputs.marketAdjustment > 0 ? "+" : ""}${Math.round(inputs.marketAdjustment * 100)}%`}
            hint="Shift comparable prices and the regional prior up or down"
          />
          <div className="border-t border-line pt-5">
            <Eyebrow>Financing assumptions</Eyebrow>
            <div className="mt-4 space-y-6">
              <Slider
                label="Own funds available"
                value={inputs.ownFunds}
                min={0}
                max={Math.max(200000, Math.round(inputs.askingPrice * 0.4 / 5000) * 5000)}
                step={5000}
                onChange={(val) => set("ownFunds", val)}
                display={eur(inputs.ownFunds)}
              />
              <Slider
                label="Mortgage interest rate"
                value={Math.round(inputs.interestRate * 1000) / 10}
                min={2}
                max={6.5}
                step={0.1}
                onChange={(val) => set("interestRate", Math.round(val * 10) / 1000)}
                display={`${(inputs.interestRate * 100).toFixed(1)}%`}
                hint="30-year annuity, gross"
              />
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium">Starter exemption (0% transfer tax)</span>
                  <span className="block text-[11.5px] text-muted">Age and price conditions apply — check Belastingdienst.</span>
                </span>
                <input
                  type="checkbox"
                  checked={inputs.starterExemption}
                  onChange={(e) => set("starterExemption", e.target.checked)}
                  className="peer sr-only"
                />
                <span className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line-2 transition peer-checked:bg-emerald-2 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-2/40 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-paper after:shadow after:transition peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>
        </Card>

        {/* Outcomes */}
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow>Offer vs. estimate</Eyebrow>
                <div className="num mt-1 text-3xl font-semibold">{eur(inputs.offer)}</div>
                <div className={cn("mt-1 text-sm font-medium", o.offerVsFair > 0.02 ? "text-rose" : o.offerVsFair < -0.02 ? "text-emerald-2" : "text-ink-2")}>
                  {o.premiumOverFair >= 0 ? "+" : "−"}{eur(Math.abs(o.premiumOverFair))} ({o.offerVsFair >= 0 ? "+" : ""}{(o.offerVsFair * 100).toFixed(1)}%) vs. estimate of {eur(v.fairValue)}
                </div>
              </div>
              <ProvenanceTag source="model" />
            </div>
            <ValueRangeBar low={v.low} fair={v.fairValue} high={v.high} asking={inputs.askingPrice} offer={inputs.offer} className="mt-3" />
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Own funds needed", v: eur(o.cashRequired), sub: o.fundingShortfall > 0 ? `${eur(o.fundingShortfall)} short` : "Covered", bad: o.fundingShortfall > 0 },
              { k: "Modelled mortgage", v: eur(o.mortgageAmount), sub: "≤ 100% of estimate" },
              { k: "Gross monthly", v: eur(o.monthlyGross), sub: `${(inputs.interestRate * 100).toFixed(1)}% · 30 yrs` },
              { k: "Buyer costs", v: eur(o.totalBuyerCosts), sub: inputs.starterExemption ? "Incl. 0% transfer tax" : "Incl. 2% transfer tax" },
            ].map((s) => (
              <Card key={s.k} className="p-4">
                <div className="text-[11px] text-muted">{s.k}</div>
                <div className="num mt-1 text-lg font-semibold leading-tight">{s.v}</div>
                <div className={cn("mt-0.5 text-[11px]", s.bad ? "font-semibold text-rose" : "text-muted")}>{s.sub}</div>
              </Card>
            ))}
          </div>

          <Card className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-medium">Risk indicators</h3>
            <ul className="mt-4 space-y-3">
              {o.risks.map((r) => (
                <li key={r.key} className="flex items-start gap-3 rounded-2xl border border-line p-3.5">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", LEVEL[r.level].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="num text-sm font-semibold">{r.value}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", LEVEL[r.level].cls)}>{LEVEL[r.level].label}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{r.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-medium">Own funds needed across offers</h3>
            <p className="mt-1 text-xs text-muted">Above the estimate, every extra euro must come from your own money if the appraisal matches BrickIQ&apos;s estimate.</p>
            <div className="mt-4"><OfferCurve points={curve} offer={inputs.offer} fair={v.fairValue} high={v.high} /></div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-medium">Cost breakdown</h3>
            <dl className="mt-3 divide-y divide-line text-sm">
              <div className="flex justify-between py-2"><dt className="text-muted">Transfer tax (overdrachtsbelasting)</dt><dd className="num font-medium">{eur(o.transferTax)}</dd></div>
              {o.otherCosts.map((c) => (
                <div key={c.label} className="flex justify-between py-2"><dt className="text-muted">{c.label} <span className="text-[10px]">(assumption)</span></dt><dd className="num font-medium">{eur(c.amount)}</dd></div>
              ))}
              <div className="flex justify-between py-2"><dt className="text-muted">Valuation gap (offer above estimate)</dt><dd className="num font-medium">{eur(o.valuationGap)}</dd></div>
              <div className="flex justify-between py-2.5 font-semibold"><dt>Total own funds needed</dt><dd className="num">{eur(o.cashRequired)}</dd></div>
            </dl>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-ivory/70 p-3 text-[11.5px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Dutch lenders generally cap mortgages at 100% of the appraised market value. Your actual borrowing capacity depends on income and lender criteria — speak with a mortgage adviser.
            </div>
          </Card>

          <button
            type="button"
            onClick={() => onNavigate("analyst")}
            className="group flex w-full items-center justify-between rounded-3xl bg-ink p-5 text-left text-ivory shadow-lift"
          >
            <span>
              <span className="block font-medium">Discuss this scenario with the analyst</span>
              <span className="text-sm text-ivory/60">Your current sliders are shared as context.</span>
            </span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
