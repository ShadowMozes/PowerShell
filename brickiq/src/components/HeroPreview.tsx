"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDemoProperty } from "@/lib/demo";
import { analyze, eur } from "@/lib/engine/analysis";
import { ScoreRing, bandTone } from "./Score";
import { ValueRangeBar } from "./charts";
import { Facade } from "./Facade";
import { ProvenanceTag, cn } from "./ui";

/** A live (not mocked) mini-report for a demo property, rendered by the real engine. */
export function HeroPreview() {
  const p = getDemoProperty("demo-family-home")!;
  const a = analyze(p);
  const tone = bandTone(a.score.band);
  return (
    <Link href={`/property/${p.id}`} className="group block">
      <div className="relative">
        <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-br from-emerald-3/15 via-transparent to-gold/10 blur-2xl" />
        <div className="overflow-hidden rounded-[30px] border border-line bg-paper shadow-lift transition-transform duration-500 group-hover:-translate-y-1">
          <div className="relative h-40 overflow-hidden sm:h-48">
            <Facade style="family" className="h-full w-full object-cover" title="Illustration of a 1930s corner house" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
            <div className="absolute left-4 top-4 flex gap-1.5">
              <ProvenanceTag source="synthetic" />
            </div>
            <div className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-paper/90 shadow-card transition group-hover:bg-emerald group-hover:text-ivory">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted">Demo report · Utrecht</div>
                <div className="font-display truncate text-xl font-medium">{p.address.value.display.split(",")[0]}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted">BrickIQ estimate</div>
                <div className="num text-[28px] font-semibold leading-tight">{eur(a.valuation.fairValue)}</div>
                <div className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", tone.bg, tone.text)}>
                  Asking {(a.askingVsFair * 100).toFixed(1)}% vs estimate
                </div>
              </div>
              <ScoreRing score={a.score.total} band={a.score.band} size={104} />
            </div>
            <ValueRangeBar low={a.valuation.low} fair={a.valuation.fairValue} high={a.valuation.high} asking={p.askingPrice.value} className="mt-2" />
            <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              {[
                ["€/m² asking", eur(a.askingPricePerSqm)],
                ["Confidence", `${a.valuation.confidence}/100`],
                ["Label", p.energyLabel.value],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10.5px] text-muted">{k}</div>
                  <div className="num text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
