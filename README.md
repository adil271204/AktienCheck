# Market Event Impact Intelligence System

A research-style dashboard for understanding how company news, country-level decisions, macroeconomic
events, regulatory changes, and geopolitical events *may* affect sectors, industries, and publicly
traded companies.

> **This is not financial advice.** The app never produces buy/sell/hold signals or guaranteed
> predictions. Every analysis includes uncertainty (confidence scores), reasoning, risk factors, source
> links, and an explicit "priced-in" assessment. See the in-app disclaimer on every page.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + hand-rolled shadcn/ui-style components (button, card, badge, table, input)
- Prisma ORM + PostgreSQL
- Zod for input/DTO validation
- node-cron for the scheduled mock-data pipeline
- All data is **mocked** — no paid APIs are called. Mock "collectors" stand in for future real news/macro
  data feeds.

## Project structure

```
prisma/
  schema.prisma        # Company, WatchlistItem, NewsItem, MacroEvent, SectorImpact,
                        # CompanyImpact, ImpactAnalysis, Alert, Source, AnalysisSource
  seed.ts               # seeds companies, a default watchlist, and runs the mock pipeline once
src/
  app/
    page.tsx                       # Dashboard
    watchlist/page.tsx             # Watchlist
    company/[ticker]/page.tsx      # Company Detail
    macro-events/page.tsx          # Macro Event Radar
    sectors/page.tsx               # Sector Impact Map
    alerts/page.tsx                # Alerts
    analysis/[id]/page.tsx         # Analysis Detail (full priced-in object, scores, risks, sources)
    api/                           # REST API routes backing the pages
  components/
    ui/                            # shadcn-style primitives
    shared/                        # Disclaimer, ImpactBadge, PricedInBadge, ScoreBar, Nav
    dashboard/                     # client components (watchlist add/remove form)
  lib/
    mock/                          # mock company news collector, macro event collector,
                                    # sector mapping table, company exposure overrides
    services/                      # News Analyzer, Macro Analyzer, Sector Impact Engine,
                                    # Exposure Engine, Priced-In Assessment Engine, Alert
                                    # generator, and the pipeline that wires them together
    schemas/                       # Zod schemas (enums + entity/DTO shapes)
    cron/runner.ts                 # standalone node-cron process (`npm run cron`)
```

## How the analysis pipeline works

1. **Mock collectors** (`src/lib/mock/`) generate company news items and macro/country events with a
   rough illustrative "raw signal" in `[-1, 1]` — standing in for a future real ingestion pipeline.
2. **Sector Impact Engine** (`sector-impact-engine.ts`) maps a macro event's type to a curated set of
   affected sectors/industries with a direction (`BULLISH`/`BEARISH`/`NEUTRAL`/`MIXED`/`UNKNOWN`) and a
   direct/indirect effect explanation.
3. **Exposure Engine** (`exposure-engine.ts`) maps those sectors to specific companies in the universe,
   classifying exposure as `DIRECT`, `INDIRECT`, `SUPPLY_CHAIN`, `REGULATORY`, `DEMAND`, or `COST`.
4. **News Analyzer** / **Macro Analyzer** turn the raw signal + exposure context into the full
   `ImpactAnalysis` record: classification, headline impact score, adjusted impact score, confidence
   score, time horizon, reasoning, and risks.
5. **Priced-In Assessment Engine** (`priced-in-engine.ts`) attaches, to every analysis, a
   `priced_in_assessment` object: `status`, `surprise_level`, `expectation_gap`, `reasoning`,
   `confidence`. This is a deterministic illustrative heuristic in the MVP — a real system would compare
   pre/post-event price and volume behavior against consensus expectations.
6. **Alert generator** creates an `Alert` whenever a news item or macro event affects a company that's on
   the demo user's watchlist.

All of the above is orchestrated by `src/lib/services/pipeline.ts`, which is called from:
- `prisma/seed.ts` (one-time seed)
- `src/lib/cron/runner.ts` (recurring `node-cron` schedule, default every 15 minutes)
- `POST /api/cron/run` (manual trigger, e.g. for testing)

## Local setup

### Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database (local install, Docker, or a hosted instance)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure your database connection
cp .env.example .env
# edit .env and set DATABASE_URL to your Postgres connection string

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed mock data (companies, default watchlist, one pipeline run)
npm run prisma:seed

# 5. Start the dev server
npm run dev
# open http://localhost:3000
```

### Running the scheduled mock-data job locally

In a second terminal:

```bash
npm run cron
```

This runs the same pipeline as the seed script, on a recurring schedule (`CRON_SCHEDULE` env var,
default `*/15 * * * *`). You can also trigger a single run manually:

```bash
curl -X POST http://localhost:3000/api/cron/run
```

## Deploying to Render

This repo includes a `render.yaml` Render Blueprint defining:
- a managed PostgreSQL database
- the Next.js web service (runs `prisma migrate deploy` during build, then `next build`/`next start`)
- an optional background worker running `npm run cron` (background workers require a paid Render plan —
  on the free tier, omit this service and instead schedule `POST /api/cron/run` via Render Cron Jobs or
  an external scheduler)

To deploy:
1. Push this repo to GitHub.
2. In the Render dashboard, choose **New > Blueprint** and point it at the repo — Render will read
   `render.yaml` and provision the database + web service (and worker, if you keep it / upgrade the plan).
3. Render injects `DATABASE_URL` automatically from the managed database.
4. After the first deploy, run the seed once (via the Render shell, or by hitting `/api/cron/run` to
   populate mock news/macro data without seeding a default watchlist):
   ```bash
   npx prisma db seed
   ```

## Design principles (enforced throughout the app)

- **No financial advice.** No buy/sell/hold labels, no guaranteed predictions. Language is always framed
  as "research signal," "directional estimate," or "hypothesis."
- **Uncertainty is always visible.** Every score is paired with a confidence value and risk factors.
  Scores are bounded `[-1, 1]` for impact and `[0, 1]` for confidence, and the UI shows them as a
  centered bar (not a single point estimate) to discourage over-reading precision.
- **Every analysis cites a source** (mocked here, but the data model and UI already support real source
  links via the `Source` model).
- **The priced-in assessment is mandatory** on every `ImpactAnalysis` — it's a model field, not optional
  UI sugar, so it can't be silently dropped as the app evolves.

## Database models

`Company`, `WatchlistItem`, `Source`, `NewsItem`, `MacroEvent`, `SectorImpact`, `CompanyImpact`,
`ImpactAnalysis` (embeds the priced-in assessment as scalar fields), `AnalysisSource` (join table),
`Alert`. See `prisma/schema.prisma` for full field definitions and enums.

## Next steps beyond this MVP

- Replace mock collectors with real data providers (news APIs, macro/economic data feeds) behind the same
  collector interfaces in `src/lib/mock/` — the rest of the pipeline doesn't need to change.
- Add authentication so `WatchlistItem`/`Alert` are scoped to real users instead of the `demo-user`
  placeholder.
- Replace the heuristic Priced-In Assessment Engine with one backed by real price/volume/options data.
