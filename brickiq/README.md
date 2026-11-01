# BrickIQ — Know Before You Buy

AI-powered Dutch property intelligence: fair-value range, transparent Deal Score, price-per-m² analysis, comparables, strengths & risks, a bidding simulator, an AI property analyst and a downloadable PDF report.

Built with Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Recharts, jsPDF and the Anthropic SDK.

## Run locally

```bash
cd brickiq
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live AI
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

1. Import this GitHub repository at https://vercel.com/new
2. Set **Root Directory** to `brickiq` (framework: Next.js is auto-detected)
3. Optional environment variables:
   - `ANTHROPIC_API_KEY` — enables the live AI analyst (server-side only)
   - `BRICKIQ_AI_MODEL` — defaults to `claude-opus-5-5`
   - `BAG_API_KEY` — use Kadaster's BAG Individuele Bevragingen API instead of the keyless PDOK BAG WFS
4. Deploy.

Or with the CLI: `cd brickiq && npx vercel --prod`.

## Data provenance

Every value is labelled **Verified** (PDOK Locatieserver / BAG), **Your input**, **Model estimate** or **Demo data** (synthetic). Comparable sales are synthetic in this build and served through `ComparablesProvider` (`src/lib/data/comparables.ts`), ready for a licensed Kadaster transaction provider. BrickIQ never fabricates real transaction prices, never estimates offer-acceptance probabilities and never fetches Funda pages.

## Structure

```
src/lib/types.ts               data model with provenance
src/lib/data/pdok.ts           PDOK Locatieserver + BAG (WFS / Kadaster API)
src/lib/data/comparables.ts    comparables provider abstraction (synthetic + Kadaster stub)
src/lib/engine/                valuation, Deal Score, insights, bidding
src/lib/analyst.ts             AI context, system prompt, deterministic fallback
src/lib/pdf.ts                 client-side PDF report
src/app/api/                   address suggest/lookup, analyst (streaming)
src/components/                UI, dashboard panels, charts, maps
```
