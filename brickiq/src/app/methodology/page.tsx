import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { Card, Disclaimer, Eyebrow, ProvenanceTag } from "@/components/ui";
import { MARKET_REFERENCES } from "@/lib/market";
import { ENERGY_LABELS } from "@/lib/types";
import { energyFactor } from "@/lib/engine/factors";

export const metadata: Metadata = { title: "Methodology & data" };

export default function Methodology() {
  const refs = MARKET_REFERENCES.filter((m) => m.key !== "'s-gravenhage");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
        <div>
          <Eyebrow>Methodology</Eyebrow>
          <h1 className="font-display mt-2 text-4xl font-medium sm:text-5xl">How BrickIQ works</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">
            BrickIQ is built on one principle: every number must be explainable and labelled with where it came from.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">1 · Data sources</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-2">
            <div className="flex gap-3"><ProvenanceTag source="verified" className="mt-0.5" /><p><strong>PDOK Locatieserver</strong> (Kadaster) for address search, normalisation, coordinates, neighbourhood and municipality. <strong>BAG</strong> (Basisregistratie Adressen en Gebouwen) via the keyless PDOK BAG WFS — or the Kadaster BAG API when a key is configured — for floor area, original build year, usage and status. Queried live, server-side.</p></div>
            <div className="flex gap-3"><ProvenanceTag source="user" className="mt-0.5" /><p>Asking price, energy label, condition, outdoor space, tenure, VvE and ground-lease costs. Registers don&apos;t hold these; you do. If you override a verified BAG value, it becomes your input.</p></div>
            <div className="flex gap-3"><ProvenanceTag source="model" className="mt-0.5" /><p>Regional priors, fair-value estimate, range, confidence, Deal Score, risk flags and bidding outcomes.</p></div>
            <div className="flex gap-3"><ProvenanceTag source="synthetic" className="mt-0.5" /><p>Comparable sales and demo properties. Generated deterministically for demonstration; never presented as real transactions.</p></div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">2 · The valuation model</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            A transparent hedonic model: <span className="num">€/m² = regional prior × type × size × age × energy × condition × outdoor × parking × tenure × market</span>. The model result is blended with the median of grid-adjusted comparables (60/40 with synthetic comparables; 40/60 once licensed transaction data is connected). The range widens with comparable dispersion, unverified core data, synthetic data and stronger market assumptions.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Regional priors (model assumptions)</div>
              <p className="mt-1 text-xs text-muted">Rounded indicative €/m² used as the starting point — not transaction data. Users can override them.</p>
              <ul className="mt-3 divide-y divide-line text-sm">
                {refs.map((r) => (
                  <li key={r.key} className="flex justify-between py-1.5"><span>{r.label}</span><span className="num">€{r.pricePerSqm.toLocaleString("nl-NL")}</span></li>
                ))}
                <li className="flex justify-between py-1.5 text-muted"><span>Other municipalities</span><span className="num">€4.000</span></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Energy label adjustment</div>
              <ul className="mt-3 divide-y divide-line text-sm">
                {ENERGY_LABELS.map((l) => (
                  <li key={l} className="flex justify-between py-1.5"><span>{l}</span><span className="num">{((energyFactor(l) - 1) * 100).toFixed(1)}%</span></li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">3 · Deal Score</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {[
              ["Asking price vs. estimated value", "35%"],
              ["Price per m² vs. adjusted comparables", "20%"],
              ["Energy & sustainability", "15%"],
              ["Condition & maintenance", "15%"],
              ["Ownership costs & tenure", "10%"],
              ["Data confidence", "5%"],
            ].map(([k, w]) => (
              <li key={k} className="flex justify-between py-2"><span>{k}</span><span className="num font-semibold">{w}</span></li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Bands: 80+ Strong · 65+ Favourable · 50+ Fair · 35+ Stretched · below 35 Overpriced.</p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">4 · Bidding intelligence</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            For any offer, BrickIQ computes buyer costs (2% transfer tax unless the starter exemption applies, plus stated assumptions for notary, advice, valuation and survey), the valuation gap if the appraisal equals our estimate (Dutch mortgages are generally capped at 100% of market value), own funds required, a gross 30-year annuity and a 10% market-correction stress test. <strong>We never estimate offer-acceptance probabilities</strong> — no available data supports such a number.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">5 · AI analyst</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            When an Anthropic API key is configured server-side, the analyst is Claude, receiving the full provenance-labelled report as context with strict rules: no certified-valuation claims, no acceptance odds, no invented facts. Without credentials, a deterministic rule-based analyst answers from the same data and is labelled as such. Credentials never reach the browser.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">6 · Architecture & roadmap</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            <li>Comparables are served through a <span className="num">ComparablesProvider</span> interface. A licensed Kadaster transaction provider slots in without UI or engine changes.</li>
            <li>Reports are encoded in their URL: no accounts, no server-side storage of personal data.</li>
            <li>Next: EP-Online energy labels, CBS neighbourhood statistics, WOZ values, licensed transaction data and lender-grade valuation partners.</li>
          </ul>
        </Card>
        <Disclaimer />
      </main>
      <SiteFooter />
    </>
  );
}
