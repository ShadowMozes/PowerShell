"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Comparable } from "@/lib/types";
import { eur } from "@/lib/engine/analysis";
import { cn } from "./ui";

const C = {
  emerald: "#137a5b",
  emeraldSoft: "#cfe3d8",
  gold: "#a5762a",
  ink: "#17150f",
  muted: "#857e70",
  line: "#e6dfcf",
  bar: "#c9bfa9",
};

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-paper px-3 py-2 text-xs shadow-lift">{children}</div>;
}

/** Horizontal range band: low – central – high, plus asking (and optional offer) markers. */
export function ValueRangeBar({
  low,
  fair,
  high,
  asking,
  offer,
  className,
}: {
  low: number;
  fair: number;
  high: number;
  asking: number;
  offer?: number;
  className?: string;
}) {
  const values = [low, high, asking, ...(offer ? [offer] : [])];
  const min = Math.min(...values) * 0.97;
  const max = Math.max(...values) * 1.03;
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className={cn("relative pt-9 pb-8", className)}>
      <div className="relative h-3 rounded-full bg-ivory-2">
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-3/40 via-emerald-2 to-emerald-3/40 transition-all duration-500"
          style={{ left: `${pos(low)}%`, width: `${pos(high) - pos(low)}%` }}
        />
        <div className="absolute top-1/2 h-6 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-all duration-500" style={{ left: `${pos(fair)}%` }} />
      </div>
      <Marker at={pos(asking)} label="Asking" value={asking} tone="gold" top />
      {offer !== undefined && <Marker at={pos(offer)} label="Your offer" value={offer} tone="slate" />}
      <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[11px] text-muted">
        <span className="num" style={{ marginLeft: `${Math.max(0, pos(low) - 6)}%` }}>{eur(low)}</span>
        <span className="num" style={{ marginRight: `${Math.max(0, 100 - pos(high) - 6)}%` }}>{eur(high)}</span>
      </div>
    </div>
  );
}

function Marker({ at, label, value, tone, top }: { at: number; label: string; value: number; tone: "gold" | "slate"; top?: boolean }) {
  const color = tone === "gold" ? "bg-gold" : "bg-slate";
  const clamped = Math.max(8, Math.min(92, at));
  return (
    <div className="absolute transition-all duration-500" style={{ left: `${at}%`, top: top ? 0 : undefined, bottom: top ? undefined : 18 }}>
      <div className={cn("absolute h-4 w-[2px] -translate-x-1/2", color, top ? "top-6" : "bottom-5")} />
      <div
        className={cn("absolute whitespace-nowrap text-[11px] font-semibold", top ? "top-0" : "bottom-0", tone === "gold" ? "text-gold" : "text-slate")}
        style={{ transform: `translateX(-${clamped}%)` }}
      >
        {label} <span className="num font-medium">{eur(value)}</span>
      </div>
    </div>
  );
}

export function CompsChart({
  comps,
  askingPpsm,
  estimatePpsm,
}: {
  comps: Comparable[];
  askingPpsm: number;
  estimatePpsm: number;
}) {
  const data = comps.map((c) => ({ name: c.label.replace("Demo comp ", ""), value: c.adjustedPricePerSqm, raw: c.pricePerSqm, area: c.livingArea, price: c.price }));
  const all = [...data.map((d) => d.value), askingPpsm, estimatePpsm];
  const min = Math.floor((Math.min(...all) * 0.9) / 500) * 500;
  const max = Math.ceil((Math.max(...all) * 1.04) / 500) * 500;
  return (
    <div className="h-64 w-full" role="img" aria-label={`Adjusted price per square metre of ${comps.length} synthetic comparables versus asking (${eur(askingPpsm)}) and estimate (${eur(estimatePpsm)})`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={C.line} strokeDasharray="0" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: C.muted, fontSize: 11 }} />
          <YAxis
            domain={[min, max]}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: C.muted, fontSize: 11 }}
            tickFormatter={(v: number) => `€${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(23,21,15,0.04)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox>
                  <div className="font-semibold">Demo comp {String(payload[0].payload.name)}</div>
                  <div className="num text-ink-2">{eur(Number(payload[0].payload.price))} · {String(payload[0].payload.area)} m²</div>
                  <div className="num">Raw {eur(Number(payload[0].payload.raw))}/m²</div>
                  <div className="num font-semibold text-emerald">Adjusted {eur(Number(payload[0].value))}/m²</div>
                  <div className="mt-1 text-[10px] text-violet">Synthetic demo data</div>
                </TipBox>
              ) : null
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={C.bar} />
            ))}
          </Bar>
          <ReferenceLine y={estimatePpsm} stroke={C.emerald} strokeWidth={2} label={{ value: `Estimate ${eur(estimatePpsm)}`, position: "insideTopLeft", fill: C.emerald, fontSize: 11, fontWeight: 600 }} />
          <ReferenceLine y={askingPpsm} stroke={C.gold} strokeWidth={2} strokeDasharray="5 4" label={{ value: `Asking ${eur(askingPpsm)}`, position: "insideTopRight", fill: C.gold, fontSize: 11, fontWeight: 600 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OfferCurve({
  points,
  offer,
  fair,
  high,
}: {
  points: { offer: number; cash: number }[];
  offer: number;
  fair: number;
  high: number;
}) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Own funds required across a range of offer amounts">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.emerald} stopOpacity={0.28} />
              <stop offset="100%" stopColor={C.emerald} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={C.line} />
          <XAxis
            dataKey="offer"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: C.muted, fontSize: 11 }}
            tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
            tickCount={5}
          />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`} />
          <Tooltip
            cursor={{ stroke: C.ink, strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox>
                  <div className="text-muted">Offer <span className="num font-semibold text-ink">{eur(Number(payload[0].payload.offer))}</span></div>
                  <div className="num font-semibold text-emerald">Own funds needed {eur(Number(payload[0].value))}</div>
                </TipBox>
              ) : null
            }
          />
          <ReferenceLine x={fair} stroke={C.muted} strokeDasharray="4 4" label={{ value: "Estimate", position: "insideTopLeft", fill: C.muted, fontSize: 10 }} />
          <ReferenceLine x={high} stroke={C.muted} strokeDasharray="2 4" label={{ value: "Range top", position: "insideTopLeft", fill: C.muted, fontSize: 10 }} />
          <Area type="monotone" dataKey="cash" stroke={C.emerald} strokeWidth={2} fill="url(#cashFill)" isAnimationActive={false} />
          <ReferenceLine x={offer} stroke={C.ink} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
