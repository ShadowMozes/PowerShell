import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Calculator,
  ChartColumnBig,
  FileDown,
  Gauge,
  Map,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { SearchPanel } from "@/components/SearchPanel";
import { ButtonLink, Card, Disclaimer, Eyebrow, ProvenanceTag, cn } from "@/components/ui";
import { Facade, facadeFor } from "@/components/Facade";
import { DEMO_PROPERTIES } from "@/lib/demo";
import { analyze, eur } from "@/lib/engine/analysis";
import { PROPERTY_TYPE_LABEL } from "@/lib/types";
import { HeroPreview } from "@/components/HeroPreview";

export default function Home() {
  const demos = DEMO_PROPERTIES.map((p) => ({ p, a: analyze(p) }));
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section id="search" className="relative overflow-hidden">
          <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-3/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/80 px-3 py-1 text-xs font-medium text-ink-2 shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-2" /> Property intelligence for Dutch homebuyers
              </div>
              <h1 className="font-display mt-5 text-[44px] font-medium leading-[1.02] sm:text-6xl lg:text-[68px]">
                Know before
                <br />
                you <em className="font-normal italic text-emerald">buy.</em>
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
                BrickIQ turns any Dutch address into a transparent intelligence report — fair-value range, Deal Score,
                comparables, risks and a bidding simulator — so you walk into the biggest purchase of your life with
                clarity, not guesswork.
              </p>
              <div className="mt-7 max-w-xl">
                <SearchPanel />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-emerald-2" /> Official PDOK & BAG data</span>
                <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 text-emerald-2" /> Every number explained</span>
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-2" /> No account required</span>
              </div>
            </div>
            <div className="animate-rise [animation-delay:120ms]">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* DEMOS */}
        <section id="demos" className="border-y border-line bg-paper/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Eyebrow>Try it instantly</Eyebrow>
                <h2 className="font-display mt-2 text-3xl font-medium sm:text-4xl">Three demo reports, three different stories.</h2>
              </div>
              <ProvenanceTag source="synthetic" className="self-start sm:self-auto" />
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              These homes are fictional and every figure is synthetic demonstration data — explore the full experience without entering anything.
            </p>
            <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
              {demos.map(({ p, a }) => (
                <Link
                  key={p.id}
                  href={`/property/${p.id}`}
                  className="group w-[82%] shrink-0 snap-center overflow-hidden rounded-3xl border border-line bg-paper shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:w-auto"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Facade style={facadeFor(p.type.value, p.buildYear.value)} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" title={`Illustration of ${p.nickname}`} />
                    <div className="absolute left-3 top-3"><ProvenanceTag source="synthetic" /></div>
                    <div className={cn(
                      "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-card",
                      a.score.total >= 65 ? "bg-emerald text-ivory" : a.score.total >= 50 ? "bg-gold text-ivory" : "bg-rose text-ivory",
                    )}>
                      <span className="num">{a.score.total}</span> · {a.score.band}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted">{p.address.value.city} · {PROPERTY_TYPE_LABEL[p.type.value]}</div>
                    <div className="font-display mt-1 text-xl font-medium">{p.nickname}</div>
                    <p className="mt-1 text-sm text-ink-2">{p.tagline}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                      <div>
                        <div className="text-[11px] text-muted">Asking</div>
                        <div className="num font-semibold">{eur(p.askingPrice.value)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted">BrickIQ estimate</div>
                        <div className="num font-semibold text-emerald">{eur(a.valuation.fairValue)}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-2">
                      Open report <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display mt-2 max-w-2xl text-3xl font-medium sm:text-4xl">From address to decision in under a minute.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: "01", t: "Find the home", d: "Search any Dutch address. We resolve it against PDOK and pull floor area, build year and usage from the BAG register." },
              { n: "02", t: "Add what only you know", d: "Asking price, energy label, condition, VvE and erfpacht. Every input stays labelled as yours." },
              { n: "03", t: "Decide with clarity", d: "Get a fair-value range, Deal Score, risks and a bidding simulator — then ask the AI analyst anything." },
            ].map((s) => (
              <Card key={s.n} className="p-6">
                <div className="num text-sm text-emerald-2">{s.n}</div>
                <div className="font-display mt-3 text-xl font-medium">{s.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-ink text-ivory">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Eyebrow className="text-ivory/50">The intelligence report</Eyebrow>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-medium sm:text-4xl">Everything a sharp buyer&apos;s agent would check — in one report.</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-ivory/10 bg-ivory/10 sm:grid-cols-3">
              {[
                { I: Map, t: "Property overview", d: "Official address, BAG characteristics, maps and aerial imagery." },
                { I: TrendingUp, t: "Fair value range", d: "Central estimate with an honest uncertainty band and confidence." },
                { I: Gauge, t: "Deal Score 0–100", d: "Six weighted, explained components. No black box." },
                { I: ChartColumnBig, t: "Price per m²", d: "Asking €/m² against model and adjusted comparables." },
                { I: Scale, t: "Comparables", d: "Grid-adjusted comps; licensed Kadaster data ready to plug in." },
                { I: ShieldAlert, t: "Strengths & risks", d: "Erfpacht, VvE, energy label, foundations, renovation exposure." },
                { I: Calculator, t: "Bidding simulator", d: "Offer, costs, valuation gap, own funds and stress tests — live." },
                { I: Bot, t: "AI property analyst", d: "Ask why, what-if and what-to-check. Grounded in your report." },
                { I: FileDown, t: "Downloadable report", d: "A polished PDF to share with your partner, adviser or bank." },
              ].map(({ I, t, d }) => (
                <div key={t} className="bg-ink p-6">
                  <I className="h-5 w-5 text-emerald-3" />
                  <div className="mt-4 font-medium">{t}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>Radical transparency</Eyebrow>
              <h2 className="font-display mt-2 text-3xl font-medium sm:text-4xl">You always know where a number comes from.</h2>
              <p className="mt-4 text-ink-2">
                Property decisions deserve more than a confident-looking figure. Every value in BrickIQ carries one of four labels, in the app, in the PDF and in the AI analyst&apos;s answers.
              </p>
              <ButtonLink href="/methodology" variant="secondary" className="mt-6">
                Read the methodology <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="grid gap-3">
              {[
                { s: "verified" as const, t: "Verified", d: "Official public registers: PDOK Locatieserver and BAG (address, floor area, build year, usage)." },
                { s: "user" as const, t: "Your input", d: "Things only you know or chose to override — asking price, condition, energy label." },
                { s: "model" as const, t: "Model estimate", d: "BrickIQ's transparent hedonic model, range and Deal Score. Never a certified valuation." },
                { s: "synthetic" as const, t: "Demo data", d: "Synthetic comparables and demo homes. Never presented as real transactions." },
              ].map((x) => (
                <Card key={x.s} className="flex items-start gap-4 p-5">
                  <ProvenanceTag source={x.s} className="mt-0.5" />
                  <p className="text-sm leading-relaxed text-ink-2">{x.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="border-t border-line bg-paper/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-display mt-2 text-3xl font-medium sm:text-4xl">Free to explore. Pay only for the full report.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <Card className="p-7">
                <div className="text-sm font-medium text-muted">Explorer</div>
                <div className="font-display mt-2 text-4xl font-medium">Free</div>
                <ul className="mt-5 space-y-2.5 text-sm text-ink-2">
                  {["Address lookup & BAG data", "Fair-value range & Deal Score", "Bidding simulator", "AI analyst", "Summary PDF"].map((x) => (
                    <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-2" />{x}</li>
                  ))}
                </ul>
                <ButtonLink href="#search" variant="secondary" className="mt-7 w-full">Start free</ButtonLink>
              </Card>
              <Card className="relative overflow-hidden border-emerald/30 p-7">
                <div className="absolute right-5 top-5 rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold text-emerald">Most popular</div>
                <div className="text-sm font-medium text-muted">Full Intelligence Report</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-medium">€19</span>
                  <span className="text-sm text-muted">per property</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-sm text-ink-2">
                  {["Everything in Explorer", "Full comparables appendix", "Your bidding scenario & stress test", "Due-diligence checklist", "Shareable premium PDF"].map((x) => (
                    <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-2" />{x}</li>
                  ))}
                </ul>
                <ButtonLink href="/property/demo-family-home/report" className="mt-7 w-full">See a demo report</ButtonLink>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="font-display text-3xl font-medium">Questions</h2>
          <div className="mt-6 divide-y divide-line rounded-3xl border border-line bg-paper">
            {[
              ["Is the BrickIQ estimate a valuation?", "No. It's an indicative model estimate for orientation. Mortgage lenders require a certified valuation report (taxatierapport) from a registered appraiser."],
              ["Will BrickIQ tell me if my offer will be accepted?", "No — and we think anyone who claims to is guessing. We show financial outcomes and risks of an offer, not acceptance odds."],
              ["Where do the comparable sales come from?", "In this demo, comparables are synthetic and clearly labelled. The architecture is built to plug in licensed Kadaster transaction data."],
              ["Do you scrape Funda?", "Never. You can paste a Funda link as a reference — we only read the address hint from the link text you paste."],
              ["Is the AI analyst a real AI?", "When an AI provider is configured, answers are generated live by Claude and grounded in your report. Otherwise BrickIQ uses a clearly labelled rule-based analyst."],
            ].map(([q, a]) => (
              <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ivory-2 text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
          <Disclaimer className="mt-6 text-center" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
