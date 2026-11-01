"use client";

import { useEffect, useState } from "react";
import type { DealScore } from "@/lib/engine/analysis";
import { cn } from "./ui";

export function bandTone(band: DealScore["band"]) {
  return {
    Strong: { text: "text-emerald", bg: "bg-mint", stroke: "#137a5b" },
    Favourable: { text: "text-emerald-2", bg: "bg-mint", stroke: "#2e9e78" },
    Fair: { text: "text-gold", bg: "bg-gold-soft", stroke: "#a5762a" },
    Stretched: { text: "text-rose", bg: "bg-rose-soft", stroke: "#c0673f" },
    Overpriced: { text: "text-rose", bg: "bg-rose-soft", stroke: "#b0473a" },
  }[band];
}

export function ScoreRing({ score, band, size = 148, className }: { score: number; band: DealScore["band"]; size?: number; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (score - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const tone = bandTone(band);
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }} role="img" aria-label={`Deal Score ${score} out of 100, ${band}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#efe9dc" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="num text-[2.6em] font-semibold leading-none" style={{ fontSize: size * 0.27 }}>{shown}</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Deal Score</div>
      </div>
    </div>
  );
}

export function ScoreBreakdown({ score }: { score: DealScore }) {
  return (
    <ul className="space-y-4">
      {score.components.map((c) => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-sm font-medium">
              {c.label} <span className="text-xs font-normal text-muted">· {Math.round(c.weight * 100)}%</span>
            </div>
            <div className="num text-sm font-semibold">{c.score}</div>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ivory-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                c.score >= 70 ? "bg-emerald-2" : c.score >= 45 ? "bg-gold" : "bg-rose",
              )}
              style={{ width: `${Math.max(3, c.score)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.explanation}</p>
        </li>
      ))}
    </ul>
  );
}
