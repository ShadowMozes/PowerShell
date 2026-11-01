"use client";

import { Database, FlaskConical } from "lucide-react";
import type { Analysis } from "@/lib/engine/analysis";
import { eur } from "@/lib/engine/analysis";
import { PROPERTY_TYPE_LABEL } from "@/lib/types";
import { Card, Disclaimer, ProvenanceTag } from "../ui";
import { CompsChart } from "../charts";

export function CompsPanel({ analysis: a }: { analysis: Analysis }) {
  const p = a.property;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-violet/20 bg-violet-soft/60 px-4 py-3 text-sm text-violet">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong className="font-semibold">Synthetic comparables.</strong> These sales are generated for demonstration and are not real transactions. BrickIQ never invents real-world sale prices.
        </p>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-medium">Adjusted price per m²</h2>
            <p className="mt-1 text-xs text-muted">Each comparable is grid-adjusted to this home&apos;s size, age, label and condition.</p>
          </div>
          <ProvenanceTag source="synthetic" />
        </div>
        <div className="mt-4">
          <CompsChart comps={a.comparables} askingPpsm={a.askingPricePerSqm} estimatePpsm={a.valuation.blendedPricePerSqm} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#c9bfa9]" />Adjusted comp €/m²</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-2" />BrickIQ estimate</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-gold" />Asking</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3 sm:p-6 sm:pb-3">
          <h2 className="font-display text-xl font-medium">Comparable sales</h2>
          <span className="text-xs text-muted">{a.comparables.length} demo comps</span>
        </div>
        {/* Mobile cards */}
        <ul className="divide-y divide-line border-t border-line sm:hidden">
          {a.comparables.map((c) => (
            <li key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.label}</div>
                  <div className="truncate text-xs text-muted">{c.street} · {c.distanceKm} km</div>
                </div>
                <div className="text-right">
                  <div className="num text-sm font-semibold">{eur(c.price)}</div>
                  <div className="text-[11px] text-muted">{c.monthsAgo} mo ago</div>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-[11px]">
                <div><div className="text-muted">Area</div><div className="num font-medium">{c.livingArea} m²</div></div>
                <div><div className="text-muted">Year</div><div className="num font-medium">{c.buildYear}</div></div>
                <div><div className="text-muted">Label</div><div className="font-medium">{c.energyLabel}</div></div>
                <div><div className="text-muted">Adj. €/m²</div><div className="num font-semibold text-emerald">{eur(c.adjustedPricePerSqm)}</div></div>
              </div>
            </li>
          ))}
        </ul>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line bg-ivory/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-6 py-2.5 font-semibold">Comparable</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 text-right font-semibold">Area</th>
                <th className="px-3 py-2.5 text-right font-semibold">Year</th>
                <th className="px-3 py-2.5 font-semibold">Label</th>
                <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                <th className="px-3 py-2.5 text-right font-semibold">€/m²</th>
                <th className="px-3 py-2.5 text-right font-semibold">Adj. €/m²</th>
                <th className="px-6 py-2.5 text-right font-semibold">Similarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="bg-mint/40">
                <td className="px-6 py-3 font-semibold">This home</td>
                <td className="px-3 py-3">{PROPERTY_TYPE_LABEL[p.type.value]}</td>
                <td className="num px-3 py-3 text-right">{p.livingArea.value} m²</td>
                <td className="num px-3 py-3 text-right">{p.buildYear.value}</td>
                <td className="px-3 py-3">{p.energyLabel.value}</td>
                <td className="num px-3 py-3 text-right">{eur(p.askingPrice.value)}</td>
                <td className="num px-3 py-3 text-right font-semibold text-gold">{eur(a.askingPricePerSqm)}</td>
                <td className="px-3 py-3 text-right text-muted">asking</td>
                <td className="px-6 py-3" />
              </tr>
              {a.comparables.map((c) => (
                <tr key={c.id} className="hover:bg-ivory/50">
                  <td className="px-6 py-3">
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted">{c.street} · {c.distanceKm} km · {c.monthsAgo} mo ago</div>
                  </td>
                  <td className="px-3 py-3 text-ink-2">{PROPERTY_TYPE_LABEL[c.type]}</td>
                  <td className="num px-3 py-3 text-right">{c.livingArea} m²</td>
                  <td className="num px-3 py-3 text-right">{c.buildYear}</td>
                  <td className="px-3 py-3">{c.energyLabel}</td>
                  <td className="num px-3 py-3 text-right">{eur(c.price)}</td>
                  <td className="num px-3 py-3 text-right text-ink-2">{eur(c.pricePerSqm)}</td>
                  <td className="num px-3 py-3 text-right font-semibold text-emerald">{eur(c.adjustedPricePerSqm)}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="ml-auto flex w-24 items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-ivory-2"><div className="h-full rounded-full bg-emerald-3" style={{ width: `${c.similarity}%` }} /></div>
                      <span className="num w-6 text-xs">{c.similarity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="flex items-start gap-4 p-5 sm:p-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ivory-2"><Database className="h-5 w-5 text-ink-2" /></div>
        <div>
          <div className="font-medium">Ready for licensed transaction data</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Comparables flow through a provider interface. Connecting licensed Kadaster transaction data replaces this synthetic set with real nearby sales — and raises their weight in the estimate from {Math.round(a.valuation.compsWeight * 100)}% to 60%.
          </p>
        </div>
      </Card>
      <Disclaimer />
    </div>
  );
}
