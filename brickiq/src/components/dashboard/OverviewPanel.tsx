"use client";

import { ArrowRight, Bot, CircleAlert, CircleCheck, Info } from "lucide-react";
import type { Analysis } from "@/lib/engine/analysis";
import { eur } from "@/lib/engine/analysis";
import type { Field } from "@/lib/types";
import { CONDITION_LABEL, LEASEHOLD_LABEL, OUTDOOR_LABEL, PROPERTY_TYPE_LABEL } from "@/lib/types";
import { Card, Disclaimer, Eyebrow, ProvenanceLegend, ProvenanceTag, cn } from "../ui";
import { Facade, facadeFor } from "../Facade";
import { TileMap } from "../TileMap";
import { ScoreBreakdown, ScoreRing, bandTone } from "../Score";
import { ValueRangeBar } from "../charts";
import type { TabKey } from "./Dashboard";

export function OverviewPanel({ analysis: a, onNavigate }: { analysis: Analysis; onNavigate: (t: TabKey) => void }) {
  const p = a.property;
  const tone = bandTone(a.score.band);
  const v = a.valuation;
  const strengths = a.insights.filter((i) => i.kind === "strength");
  const risks = a.insights.filter((i) => i.kind === "risk");

  const details: [string, Field<unknown> | undefined, string][] = [
    ["Type", p.type, PROPERTY_TYPE_LABEL[p.type.value]],
    ["Living area", p.livingArea, `${p.livingArea.value} m²`],
    ["Plot", p.plotArea, p.plotArea ? `${p.plotArea.value} m²` : ""],
    ["Build year", p.buildYear, String(p.buildYear.value)],
    ["Energy label", p.energyLabel, p.energyLabel.value],
    ["Rooms", p.rooms, `${p.rooms.value} (${p.bedrooms.value} bed)`],
    ["Condition", p.condition, `${p.condition.value}/5 · ${CONDITION_LABEL[p.condition.value]}`],
    ["Outdoor", p.outdoor, OUTDOOR_LABEL[p.outdoor.value]],
    ["Parking", p.parking, p.parking.value ? "Private" : "None"],
    ["Tenure", p.leasehold, LEASEHOLD_LABEL[p.leasehold.value]],
    ["Ground lease", p.leaseholdAnnual, p.leaseholdAnnual ? `${eur(p.leaseholdAnnual.value)}/yr` : ""],
    ["VvE", p.vveMonthly, p.vveMonthly ? `${eur(p.vveMonthly.value)}/mo` : ""],
    ["Asking price", p.askingPrice, eur(p.askingPrice.value)],
  ];

  return (
    <div className="space-y-5">
      {p.isDemo && (
        <div className="flex items-start gap-3 rounded-2xl border border-violet/20 bg-violet-soft/60 px-4 py-3 text-sm text-violet">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong className="font-semibold">Demonstration report.</strong> This home, its address and all figures are fictional synthetic data created to showcase BrickIQ.</p>
        </div>
      )}

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-52 bg-ivory-2 lg:min-h-full">
            <Facade style={facadeFor(p.type.value, p.buildYear.value)} className="absolute inset-0 h-full w-full" title="Architectural illustration (not a photo of the property)" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              <ProvenanceTag source={p.address.source} origin={p.address.origin} />
            </div>
            <div className="absolute bottom-3 right-3 rounded-md bg-paper/80 px-2 py-0.5 text-[10px] text-muted backdrop-blur">Illustration · not a photo</div>
          </div>
          <div className="p-5 sm:p-7">
            <Eyebrow>{p.address.value.neighbourhood ?? p.address.value.city}</Eyebrow>
            <h1 className="font-display mt-1.5 text-[28px] font-medium leading-tight sm:text-4xl">{p.address.value.street} {p.address.value.houseNumber}</h1>
            <div className="mt-1 text-sm text-muted">{p.address.value.postcode} {p.address.value.city}{p.address.value.municipality && p.address.value.municipality !== p.address.value.city ? ` · ${p.address.value.municipality}` : ""}</div>

            <div className="mt-5 flex items-center gap-5">
              <ScoreRing score={a.score.total} band={a.score.band} size={118} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted">Estimated value <ProvenanceTag source="model" compact /></div>
                <div className="num text-3xl font-semibold leading-tight sm:text-[34px]">{eur(v.fairValue)}</div>
                <div className="num text-xs text-muted">{eur(v.low)} – {eur(v.high)}</div>
                <div className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone.bg, tone.text)}>
                  {a.score.band} · asking {a.askingVsFair >= 0 ? "+" : ""}{(a.askingVsFair * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <ValueRangeBar low={v.low} fair={v.fairValue} high={v.high} asking={p.askingPrice.value} className="mt-3" />
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-ivory/70 p-3 text-center">
              {[
                ["Asking €/m²", eur(a.askingPricePerSqm)],
                ["Estimate €/m²", eur(v.blendedPricePerSqm)],
                ["Confidence", `${v.confidence}/100`],
              ].map(([k, val]) => (
                <div key={k}>
                  <div className="text-[10.5px] text-muted">{k}</div>
                  <div className="num text-sm font-semibold">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Strengths & risks */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Strengths & risks</h2>
            <ProvenanceTag source="model" />
          </div>
          <div className="mt-4 space-y-2.5">
            {strengths.map((s) => (
              <div key={s.title} className="flex gap-3 rounded-2xl bg-mint/50 p-3.5">
                <CircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-2" />
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <p className="text-xs leading-relaxed text-ink-2">{s.detail}</p>
                </div>
              </div>
            ))}
            {risks.map((r) => (
              <div key={r.title} className={cn("flex gap-3 rounded-2xl p-3.5", r.severity === "high" ? "bg-rose-soft" : "bg-gold-soft/70")}>
                <CircleAlert className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", r.severity === "high" ? "text-rose" : "text-gold")} />
                <div>
                  <div className="text-sm font-semibold">
                    {r.title} {r.severity && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{r.severity}</span>}
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">{r.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Why {a.score.total}/100</h2>
            <ProvenanceTag source="model" />
          </div>
          <p className="mt-1 text-xs text-muted">A weighted average of six transparent components.</p>
          <div className="mt-5"><ScoreBreakdown score={a.score} /></div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-medium">Property facts</h2>
          <dl className="mt-4 divide-y divide-line">
            {details.filter(([, f, val]) => f && val).map(([k, f, val]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="flex min-w-0 items-center gap-2 text-right text-sm font-medium">
                  <span className="truncate">{val}</span>
                  <ProvenanceTag source={f!.source} origin={f!.origin} compact />
                </dd>
              </div>
            ))}
          </dl>
          {p.bag && (
            <p className="mt-3 text-[11px] text-muted">
              BAG: {p.bag.retrievedFrom}{p.bag.usage ? ` · usage ${p.bag.usage}` : ""}{p.bag.status ? ` · ${p.bag.status}` : ""}
            </p>
          )}
          <ProvenanceLegend className="mt-5 border-t border-line pt-4" />
        </Card>
        <div className="space-y-5">
          {p.coordinates ? (
            <TileMap
              lat={p.coordinates.value.lat}
              lon={p.coordinates.value.lon}
              label={p.address.value.neighbourhood ?? p.address.value.city}
              approximate={p.isDemo}
              className="h-72"
            />
          ) : (
            <Card className="grid h-40 place-items-center p-6 text-center text-sm text-muted">
              No verified location — search by address to see the map.
            </Card>
          )}
          <button
            type="button"
            onClick={() => onNavigate("analyst")}
            className="group flex w-full items-center gap-4 rounded-3xl bg-ink p-5 text-left text-ivory shadow-lift transition hover:bg-ink-2"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-2"><Bot className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-medium">Ask the AI property analyst</div>
              <div className="text-sm text-ivory/60">“Why is the asking price {a.askingVsFair >= 0 ? "above" : "below"} the estimate?”</div>
            </div>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("bid")}
            className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-paper p-5 text-left shadow-card transition hover:shadow-lift"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">Simulate your offer</div>
              <div className="text-sm text-muted">See costs, own funds and risk for any bid.</div>
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-2 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
