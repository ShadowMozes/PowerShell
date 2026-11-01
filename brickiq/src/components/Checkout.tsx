"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CreditCard, Download, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { Property } from "@/lib/types";
import { analyze, eur } from "@/lib/engine/analysis";
import { defaultBidInputs, simulateBid } from "@/lib/engine/bidding";
import { isPurchased, loadScenario, markPurchased } from "@/lib/scenario-store";
import { propertyHref } from "@/lib/property-codec";
import { usePdf } from "./dashboard/ReportPanel";
import { Button, Card, Disclaimer, Eyebrow, cn } from "./ui";
import { Logo } from "./Brand";
import { Facade, facadeFor } from "./Facade";

type Method = "ideal" | "card" | "apple";

/**
 * Premium report purchase screen — a VISUAL DEMONSTRATION only.
 * No payment details are collected and no payment is processed.
 */
export function Checkout({ property }: { property: Property }) {
  const analysis = useMemo(() => analyze(property), [property]);
  const [inputs, setInputs] = useState(() => defaultBidInputs(property));
  useEffect(() => {
    const s = loadScenario(property.id);
    if (s) setInputs(s);
  }, [property.id]);
  const outcome = useMemo(() => simulateBid(property, inputs), [property, inputs]);
  const { busy, error, run } = usePdf(analysis, { inputs, outcome });

  const [method, setMethod] = useState<Method>("ideal");
  const [stage, setStage] = useState<"select" | "done">("select");
  useEffect(() => {
    if (isPurchased(property.id)) setStage("done");
  }, [property.id]);

  const complete = () => {
    markPurchased(property.id);
    setStage("done");
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-ivory/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href={propertyHref(property) + "#report"} className="flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to report
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_1.05fr]">
        {/* Order summary */}
        <div className="space-y-4 lg:order-2">
          <Card className="overflow-hidden">
            <div className="relative h-36">
              <Facade style={facadeFor(property.type.value, property.buildYear.value)} className="h-full w-full" title="Illustration" />
            </div>
            <div className="p-5">
              <Eyebrow>Full Intelligence Report</Eyebrow>
              <div className="font-display mt-1 text-xl font-medium">{property.address.value.display}</div>
              <ul className="mt-4 space-y-2 text-sm text-ink-2">
                {["Comparables appendix", "Your bidding scenario & stress test", "Risk indicators", "Due-diligence checklist", "Shareable premium PDF"].map((x) => (
                  <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-2" />{x}</li>
                ))}
              </ul>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Full report</dt><dd className="num">€15,70</dd></div>
                <div className="flex justify-between"><dt className="text-muted">VAT 21%</dt><dd className="num">€3,30</dd></div>
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="num">€19,00</dd></div>
              </dl>
            </div>
          </Card>
        </div>

        {/* Payment */}
        <div className="lg:order-1">
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-gold/25 bg-gold-soft px-4 py-3 text-sm text-ink-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p><strong>Demo checkout.</strong> This screen demonstrates the purchase flow. No payment details are requested and nothing is charged.</p>
          </div>

          {stage === "select" ? (
            <Card className="p-5 sm:p-7">
              <h1 className="font-display text-2xl font-medium">Unlock your full report</h1>
              <p className="mt-1 text-sm text-muted">One-time purchase · instant PDF download</p>

              <fieldset className="mt-6 space-y-2.5">
                <legend className="mb-2 text-sm font-medium">Payment method</legend>
                {([
                  { k: "ideal", t: "iDEAL", d: "Pay with your Dutch bank", badge: "iD" },
                  { k: "apple", t: "Apple Pay", d: "Touch ID or Face ID", badge: "" },
                  { k: "card", t: "Credit card", d: "Visa, Mastercard, Amex", badge: "" },
                ] as { k: Method; t: string; d: string; badge: string }[]).map((m) => (
                  <label
                    key={m.k}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition",
                      method === m.k ? "border-emerald bg-mint/40 ring-1 ring-emerald/30" : "border-line bg-paper hover:border-line-2",
                    )}
                  >
                    <input type="radio" name="method" value={m.k} checked={method === m.k} onChange={() => setMethod(m.k)} className="sr-only" />
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl text-xs font-bold", m.k === "ideal" ? "bg-[#cc0066] text-white" : m.k === "apple" ? "bg-ink text-ivory" : "bg-ivory-2 text-ink")}>
                      {m.k === "card" ? <CreditCard className="h-4 w-4" /> : m.k === "apple" ? "Pay" : m.badge}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{m.t}</span>
                      <span className="block text-xs text-muted">{m.d}</span>
                    </span>
                    <span className={cn("h-5 w-5 rounded-full border-2", method === m.k ? "border-emerald bg-emerald shadow-[inset_0_0_0_3px_#fffdf8]" : "border-line-2")} />
                  </label>
                ))}
              </fieldset>

              <Button size="lg" className={cn("mt-6 w-full", method === "apple" && "bg-ink hover:bg-ink-2")} onClick={complete}>
                Complete demo purchase · €19,00
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-2" /> Demonstration only — no charge, no data collected
              </p>
            </Card>
          ) : (
            <Card className="p-6 text-center sm:p-8 animate-rise">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint"><BadgeCheck className="h-7 w-7 text-emerald-2" /></div>
              <h1 className="font-display mt-4 text-2xl font-medium">Your full report is unlocked</h1>
              <p className="mt-1 text-sm text-muted">Demo purchase complete — nothing was charged.</p>
              <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-ivory p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-muted">Estimate</span><span className="num font-semibold">{eur(analysis.valuation.fairValue)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted">Deal Score</span><span className="num font-semibold">{analysis.score.total}/100</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted">Scenario offer</span><span className="num font-semibold">{eur(inputs.offer)}</span></div>
              </div>
              <Button size="lg" className="mt-6 w-full" onClick={() => run(true)} disabled={busy !== null}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download full report (PDF)
              </Button>
              {error && <p role="alert" className="mt-3 text-sm text-rose">{error}</p>}
              <Link href={propertyHref(property) + "#bid"} className="mt-4 inline-block text-sm font-medium text-emerald-2 underline underline-offset-2">
                Adjust bidding scenario first
              </Link>
            </Card>
          )}
          <Disclaimer className="mt-4" />
        </div>
      </main>
    </div>
  );
}
