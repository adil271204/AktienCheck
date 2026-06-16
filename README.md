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

# 3. Apply the committed migration (creates all tables/enums in prisma/migrations/)
npx prisma migrate dev

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

## Pushing to GitHub

If you haven't already pushed this project:

```bash
git init                                   # skip if already a git repo
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(If `git push` is rejected with a 403/permission error, your remote URL or credentials are wrong —
re-check the repo exists at that exact path under your account and that you're authenticated, e.g. via
`gh auth login` or a Personal Access Token with `repo` scope.)

## Deploying to Render

This repo includes a `render.yaml` Render Blueprint defining:
- a managed PostgreSQL database (`market-event-impact-db`)
- the Next.js web service (`market-event-impact-web`) — build runs `npm install`, then
  `npx prisma migrate deploy` (applies the committed migration in `prisma/migrations/`), then
  `npm run build` (`prisma generate && next build`); start runs `npm run start`
  (`next start -p ${PORT:-3000}`, honoring Render's injected `$PORT`)
- an optional background worker (`market-event-impact-cron`) running `npm run cron` — **background
  workers require a paid Render plan.** On the free tier, delete/comment out this service in
  `render.yaml` and instead schedule `POST https://<your-app>.onrender.com/api/cron/run` via Render's
  **Cron Jobs** feature or an external scheduler (e.g. cron-job.org) hitting that URL every 15 minutes.

### Exact steps

1. **Push the repo to GitHub** (see above) if you haven't already.
2. In the [Render dashboard](https://dashboard.render.com/), click **New +** → **Blueprint**.
3. Connect your GitHub account if prompted, then select this repository.
4. Render detects `render.yaml` and shows a preview of the resources it will create (1 database, 1 web
   service, 1 worker). Give the blueprint a name and click **Apply**.
   - If you're on the free tier and don't want the worker, remove its block from `render.yaml` (or set
     its plan/visibility so Render skips it) before this step, or just delete the worker service from
     the Render dashboard after creation.
5. Render provisions the Postgres database first, then builds and deploys the web service. Build logs
   will show `prisma migrate deploy` applying `20260616000000_init` — this creates all tables/enums in
   the fresh database. No manual migration step is needed.
6. Once the web service shows **Live**, open its URL and check `GET /api/health` — it should return
   `{"status":"ok","database":"connected",...}` with a `200` status. (It will correctly return `503` if
   the database isn't reachable yet — useful for debugging a failed first boot.)
7. **Seed mock data** (companies, default watchlist, and one pipeline run of mock news/macro events) by
   opening a shell for the web service in the Render dashboard (**Shell** tab) and running:
   ```bash
   npm run prisma:seed
   ```
   Alternatively, trigger the pipeline (without the default watchlist) by calling the API directly:
   ```bash
   curl -X POST https://<your-app>.onrender.com/api/cron/run
   ```
8. Visit the deployed URL — the Dashboard, Watchlist, Macro Event Radar, Sector Impact Map, and Alerts
   pages should now show data.

### Updating environment variables on Render

`DATABASE_URL` is wired automatically via `fromDatabase` in `render.yaml` — you should not need to set it
manually. To change the mock pipeline's schedule, edit `CRON_SCHEDULE` on the worker service (or the
external scheduler hitting `/api/cron/run`) under the service's **Environment** tab.

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
