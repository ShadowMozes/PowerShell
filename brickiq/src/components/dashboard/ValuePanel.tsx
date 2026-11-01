"use client";

import type { Analysis } from "@/lib/engine/analysis";
import { eur } from "@/lib/engine/analysis";
import { Card, Disclaimer, Eyebrow, ProvenanceTag, cn } from "../ui";
import { ValueRangeBar } from "../charts";

export function ValuePanel({ analysis: a }: { analysis: Analysis }) {
  const p = a.property;
  const v = a.valuation;
  const ppsmRows = [
    { label: "Regional prior", value: p.marketReference.value, source: p.marketReference.source, note: p.marketReference.origin },
    { label: "Hedonic model", value: v.modelPricePerSqm, source: "model" as const, note: "Prior × property factors" },
    { label: "Adjusted comparables (median)", value: v.compsMedianPricePerSqm, source: "synthetic" as const, note: "Synthetic demo comps" },
    { label: "BrickIQ blended estimate", value: v.blendedPricePerSqm, source: "model" as const, note: `${Math.round(v.modelWeight * 100)}% model / ${Math.round(v.compsWeight * 100)}% comps`, strong: true },
    { label: "Asking price", value: a.askingPricePerSqm, source: p.askingPrice.source, note: `${eur(p.askingPrice.value)} ÷ ${p.livingArea.value} m²`, asking: true },
  ];
  const maxPpsm = Math.max(...ppsmRows.map((r) => r.value)) * 1.05;

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Estimated fair value</Eyebrow>
            <div className="num mt-1 text-4xl font-semibold sm:text-5xl">{eur(v.fairValue)}</div>
            <div className="mt-1 text-sm text-muted">
              Range <span className="num font-medium text-ink">{eur(v.low)} – {eur(v.high)}</span> · ±{(v.rangePct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ProvenanceTag source="model" />
            <div className="text-right">
              <div className="text-[11px] text-muted">Confidence</div>
              <div className="num text-lg font-semibold">{v.confidence}<span className="text-sm text-muted">/100</span></div>
            </div>
          </div>
        </div>
        <ValueRangeBar low={v.low} fair={v.fairValue} high={v.high} asking={p.askingPrice.value} className="mt-4" />
        <p className="text-sm leading-relaxed text-ink-2">
          The asking price of <strong className="num">{eur(p.askingPrice.value)}</strong> is{" "}
          <strong className={cn(a.askingVsFair > 0.03 ? "text-rose" : a.askingVsFair < -0.03 ? "text-emerald-2" : "text-ink")}>
            {a.askingVsFair >= 0 ? "+" : ""}{(a.askingVsFair * 100).toFixed(1)}%
          </strong>{" "}
          versus the central estimate{p.askingPrice.value > v.high ? ", above the top of the range" : p.askingPrice.value < v.low ? ", below the bottom of the range" : ", within the estimated range"}.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-medium">Price per m²</h2>
          <p className="mt-1 text-xs text-muted">How the asking price compares with each building block of the estimate.</p>
          <ul className="mt-5 space-y-4">
            {ppsmRows.map((r) => (
              <li key={r.label}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={cn("flex items-center gap-2", r.strong && "font-semibold")}>
                    {r.label} <ProvenanceTag source={r.source} compact />
                  </span>
                  <span className={cn("num font-semibold", r.asking && "text-gold", r.strong && "text-emerald")}>{eur(r.value)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ivory-2">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", r.asking ? "bg-gold" : r.strong ? "bg-emerald-2" : "bg-line-2")}
                    style={{ width: `${(r.value / maxPpsm) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-muted">{r.note}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-medium">How the model adjusts</h2>
          <p className="mt-1 text-xs text-muted">
            Starting from {eur(p.marketReference.value)}/m², each characteristic applies a transparent multiplier.
          </p>
          <ul className="mt-5 divide-y divide-line">
            {v.factors.map((f) => {
              const delta = f.factor - 1;
              const w = Math.min(50, Math.abs(delta) * 400);
              return (
                <li key={f.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="truncate text-xs text-muted">{f.detail}</div>
                  </div>
                  <div className={cn("num text-sm font-semibold", delta > 0.001 ? "text-emerald-2" : delta < -0.001 ? "text-rose" : "text-muted")}>
                    {delta >= 0 ? "+" : ""}{(delta * 100).toFixed(1)}%
                  </div>
                  <div className="col-span-2 relative h-1.5 rounded-full bg-ivory-2">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-line-2" />
                    <div
                      className={cn("absolute top-0 h-full rounded-full transition-all duration-500", delta >= 0 ? "bg-emerald-3" : "bg-rose/70")}
                      style={delta >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ivory/70 px-4 py-3 text-sm">
            <span className="text-muted">Model result</span>
            <span className="num font-semibold">{eur(v.modelPricePerSqm)}/m²</span>
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-xl font-medium">What drives the range</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Comparable dispersion", "Spread in adjusted €/m² between comparables widens the band."],
            ["Data provenance", "Unverified core fields (area, build year, address) add uncertainty."],
            ["Synthetic comparables", "Demo comparables carry an extra uncertainty margin until licensed data is connected."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line p-4">
              <div className="text-sm font-semibold">{t}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Card>
      <Disclaimer />
    </div>
  );
}
