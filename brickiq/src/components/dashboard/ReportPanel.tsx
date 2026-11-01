"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Download, FileText, Loader2, Lock, Sparkles } from "lucide-react";
import type { Analysis } from "@/lib/engine/analysis";
import { eur } from "@/lib/engine/analysis";
import type { BidInputs, BidOutcome } from "@/lib/engine/bidding";
import { generateReportPdf } from "@/lib/pdf";
import { isPurchased } from "@/lib/scenario-store";
import { propertyHref } from "@/lib/property-codec";
import { Button, ButtonLink, Card, Disclaimer, Eyebrow } from "../ui";

export function usePdf(a: Analysis, bid: { inputs: BidInputs; outcome: BidOutcome }) {
  const [busy, setBusy] = useState<null | "summary" | "full">(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (full: boolean) => {
    setBusy(full ? "full" : "summary");
    setError(null);
    try {
      await generateReportPdf(a, bid, { full });
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF generation failed");
    } finally {
      setBusy(null);
    }
  };
  return { busy, error, run };
}

export function ReportPanel({ analysis: a, bid }: { analysis: Analysis; bid: { inputs: BidInputs; outcome: BidOutcome } }) {
  const { busy, error, run } = usePdf(a, bid);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => setUnlocked(isPurchased(a.property.id)), [a.property.id]);
  const p = a.property;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Preview */}
        <Card className="overflow-hidden">
          <div className="bg-emerald px-6 py-5 text-ivory">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl font-semibold">BrickIQ</div>
              <div className="text-xs opacity-80">Property Intelligence Report</div>
            </div>
          </div>
          <div className="space-y-4 p-6">
            {p.isDemo && <div className="rounded-xl bg-violet-soft px-3 py-2 text-xs font-semibold text-violet">Demonstration report — fictional property, synthetic data</div>}
            <div>
              <div className="font-display text-2xl font-medium">{p.address.value.street} {p.address.value.houseNumber}</div>
              <div className="text-sm text-muted">{p.address.value.postcode} {p.address.value.city}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Estimate", eur(a.valuation.fairValue)],
                ["Deal Score", `${a.score.total}/100`],
                ["Asking", eur(p.askingPrice.value)],
                ["€/m²", eur(a.askingPricePerSqm)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-ivory p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                  <div className="num text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <ul className="space-y-2 text-sm">
              {[
                ["Property facts with provenance", true],
                ["Valuation build-up & factors", true],
                ["Deal Score breakdown", true],
                ["Strengths & risks", true],
                ["Comparables appendix", false],
                ["Your bidding scenario & stress test", false],
                ["Due-diligence checklist", false],
              ].map(([t, free]) => (
                <li key={String(t)} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
                  <span className="flex items-center gap-2 text-ink-2">
                    <FileText className="h-4 w-4 text-muted" /> {t}
                  </span>
                  {free ? (
                    <span className="text-xs font-semibold text-emerald-2">Free</span>
                  ) : unlocked ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-2"><BadgeCheck className="h-3.5 w-3.5" /> Unlocked</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted"><Lock className="h-3 w-3" /> Full</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Card className="p-6">
            <Eyebrow>Free</Eyebrow>
            <div className="font-display mt-1 text-xl font-medium">Summary PDF</div>
            <p className="mt-1 text-sm text-muted">Valuation, Deal Score, facts and risks — ready to share with your partner.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => run(false)} disabled={busy !== null}>
              {busy === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download summary
            </Button>
          </Card>
          <Card className="relative overflow-hidden border-emerald/30 p-6">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-3/15 blur-2xl" />
            <Eyebrow>Full report · €19</Eyebrow>
            <div className="font-display mt-1 text-xl font-medium">Full Intelligence Report</div>
            <p className="mt-1 text-sm text-muted">Everything in the summary plus comparables, your current bid scenario ({eur(bid.inputs.offer)}), stress test and checklist.</p>
            {unlocked ? (
              <Button className="mt-4 w-full" onClick={() => run(true)} disabled={busy !== null}>
                {busy === "full" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download full report
              </Button>
            ) : (
              <ButtonLink href={propertyHref(p, "/report")} className="mt-4 w-full">
                <Sparkles className="h-4 w-4" /> Get the full report
              </ButtonLink>
            )}
          </Card>
          {error && <p role="alert" className="rounded-xl bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
