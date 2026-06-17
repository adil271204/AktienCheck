/**
 * Analyze Company on Watchlist Add
 *
 * When a company is added to the watchlist and has no prior analyses, this service:
 * 1. Generates a synthetic "sector profile" news analysis seeded from the company's
 *    sector/industry (stands in for a real news-fetch until live feeds are wired).
 * 2. Runs the company against every stored MacroEvent so it benefits from the same
 *    sector/exposure analysis the pipeline already ran for other companies.
 *
 * All logic reuses the existing mock analysis chain — no paid APIs are called.
 */

import { prisma } from "../prisma";
import { makeMockSource } from "../mock/sources";
import { getSectorImpactsForEventType } from "./sector-impact-engine";
import { findExposedCompanies } from "./exposure-engine";
import { analyzeMacroEventForCompany } from "./macro-analyzer";
import { analyzeNews } from "./news-analyzer";
import { generateAlert } from "./alert-generator";

const USER_ID = "demo-user";

// Synthetic signal per sector used for the "sector profile" news analysis
const SECTOR_SIGNAL: Record<string, number> = {
  Technology: 0.3,
  "Consumer Discretionary": 0.2,
  "Communication Services": 0.2,
  Industrials: 0.1,
  Financials: 0.1,
  Energy: 0.0,
  Healthcare: 0.25,
  "Real Estate": 0.05,
  Materials: 0.0,
  Utilities: -0.05,
};

/** Returns true if this company already has at least one stored analysis. */
async function hasExistingAnalysis(companyId: string): Promise<boolean> {
  const count = await prisma.impactAnalysis.count({ where: { companyId } });
  return count > 0;
}

async function ensureSource(source: { title: string; url: string; publisher: string }) {
  const existing = await prisma.source.findFirst({ where: { url: source.url } });
  if (existing) return existing;
  return prisma.source.create({ data: source });
}

/**
 * Generates and persists an initial set of impact analyses for a company that
 * was just added to the watchlist.
 *
 * Returns an object describing what was created. Idempotent — skips if analyses
 * already exist for this company.
 */
export async function analyzeCompanyOnWatchlistAdd(
  companyId: string
): Promise<{ skipped: boolean; newsCreated: number; macroCreated: number }> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { skipped: true, newsCreated: 0, macroCreated: 0 };

  // Idempotent — only generate analyses if none exist yet
  if (await hasExistingAnalysis(companyId)) {
    return { skipped: true, newsCreated: 0, macroCreated: 0 };
  }

  let newsCreated = 0;
  let macroCreated = 0;

  // ── 1. Synthetic "sector profile" news analysis ────────────────────────────
  // Generates a single NewsItem + ImpactAnalysis seeded from the company's
  // sector/industry. Stands in for a real news headline until live feeds are wired.
  {
    const rawSignal = SECTOR_SIGNAL[company.sector] ?? 0.0;
    const headline = `Initial sector profile analysis: ${company.name} (${company.ticker}) — ${company.sector} / ${company.industry}`;
    const body =
      `This is an automatically generated sector-profile analysis created when ${company.ticker} ` +
      `was added to the watchlist. It reflects a baseline research signal for the ` +
      `"${company.sector}" sector / "${company.industry}" industry based on the current mock ` +
      `data universe. Replace with live news data when real feeds are connected.`;

    const mockSource = makeMockSource(headline);
    const source = await ensureSource(mockSource);

    const newsItem = await prisma.newsItem.create({
      data: {
        companyId: company.id,
        headline,
        body,
        publishedAt: new Date(),
        sourceId: source.id,
      },
    });

    const analysis = analyzeNews({
      id: `${newsItem.id}:sector-profile`,
      ticker: company.ticker,
      headline,
      body,
      rawSignal,
    });

    const impactAnalysis = await prisma.impactAnalysis.create({
      data: {
        type: "COMPANY_NEWS",
        newsItemId: newsItem.id,
        companyId: company.id,
        classification: analysis.classification,
        headlineImpactScore: analysis.headlineImpactScore,
        adjustedImpactScore: analysis.adjustedImpactScore,
        confidenceScore: analysis.confidenceScore,
        timeHorizon: analysis.timeHorizon,
        reasoning: analysis.reasoning,
        risks: analysis.risks,
        pricedInStatus: analysis.pricedInAssessment.status,
        pricedInSurpriseLevel: analysis.pricedInAssessment.surprise_level,
        pricedInExpectationGap: analysis.pricedInAssessment.expectation_gap,
        pricedInReasoning: analysis.pricedInAssessment.reasoning,
        pricedInConfidence: analysis.pricedInAssessment.confidence,
        sources: { create: [{ sourceId: source.id }] },
      },
    });
    newsCreated += 1;

    // Alert for this watchlist company
    const alert = generateAlert({
      eventOrHeadline: headline,
      ticker: company.ticker,
      affectedSectors: [company.sector],
      classification: analysis.classification,
      adjustedImpactScore: analysis.adjustedImpactScore,
      confidenceScore: analysis.confidenceScore,
      pricedInStatus: analysis.pricedInAssessment.status,
    });
    await prisma.alert.create({
      data: {
        impactAnalysisId: impactAnalysis.id,
        companyId: company.id,
        eventSummary: alert.eventSummary,
        affectedSectors: [company.sector],
        possibleImpact: alert.possibleImpact,
        severity: alert.severity,
      },
    });
  }

  // ── 2. Re-run company against existing macro events ────────────────────────
  // Find every macro event already in the DB and check if this company is
  // exposed via sector/industry. Generate analyses for the ones that match.
  {
    const macroEvents = await prisma.macroEvent.findMany({
      include: { sectorImpacts: true },
      orderBy: { occurredAt: "desc" },
      take: 20, // cap at 20 most-recent to avoid flooding a new watchlist add
    });

    for (const event of macroEvents) {
      const sectorRules = getSectorImpactsForEventType(event.type);

      for (const rule of sectorRules) {
        // Check if this company is exposed to this sector rule
        const exposed = findExposedCompanies([company], rule.sector, rule.industry);
        const exposure = exposed.find((e) => e.ticker === company.ticker);
        if (!exposure) continue;

        // Skip if an analysis already exists for this event+company pair
        const existingAnalysis = await prisma.impactAnalysis.findFirst({
          where: { macroEventId: event.id, companyId: company.id },
        });
        if (existingAnalysis) continue;

        // Find or create the SectorImpact row for this event+rule
        let sectorImpact = event.sectorImpacts.find(
          (si) =>
            si.sector.toLowerCase() === rule.sector.toLowerCase() &&
            (si.industry ?? "") === (rule.industry ?? "")
        );
        if (!sectorImpact) {
          sectorImpact = await prisma.sectorImpact.create({
            data: {
              macroEventId: event.id,
              sector: rule.sector,
              industry: rule.industry ?? null,
              direction: rule.direction,
              effectType: rule.effectType,
              explanation: rule.explanation,
            },
          });
        }

        // Create CompanyImpact link
        const existingImpact = await prisma.companyImpact.findFirst({
          where: { companyId: company.id, sectorImpactId: sectorImpact.id },
        });
        if (!existingImpact) {
          await prisma.companyImpact.create({
            data: {
              companyId: company.id,
              sectorImpactId: sectorImpact.id,
              exposureType: exposure.exposureType,
              reasoning: exposure.reasoning,
            },
          });
        }

        // Derive raw signal from event (default to 0 if no stored raw — we don't persist it,
        // so derive from the sector direction as a proxy)
        const directionSignal: Record<string, number> = {
          BULLISH: 0.4,
          BEARISH: -0.4,
          NEUTRAL: 0,
          MIXED: 0.1,
          UNKNOWN: 0,
        };
        const rawSignal = directionSignal[rule.direction] ?? 0;

        const analysis = analyzeMacroEventForCompany({
          id: `${event.id}:${company.ticker}:watchlist-add`,
          ticker: company.ticker,
          eventTitle: event.title,
          rawSignal,
          sectorRule: rule,
          exposureReasoning: exposure.reasoning,
        });

        // Reuse or create a source for this analysis
        const source = event.sourceId
          ? await prisma.source.findUnique({ where: { id: event.sourceId } })
          : null;

        const impactAnalysis = await prisma.impactAnalysis.create({
          data: {
            type: "MACRO_EVENT",
            macroEventId: event.id,
            companyId: company.id,
            classification: analysis.classification,
            headlineImpactScore: analysis.headlineImpactScore,
            adjustedImpactScore: analysis.adjustedImpactScore,
            confidenceScore: analysis.confidenceScore,
            timeHorizon: analysis.timeHorizon,
            reasoning: analysis.reasoning,
            risks: analysis.risks,
            pricedInStatus: analysis.pricedInAssessment.status,
            pricedInSurpriseLevel: analysis.pricedInAssessment.surprise_level,
            pricedInExpectationGap: analysis.pricedInAssessment.expectation_gap,
            pricedInReasoning: analysis.pricedInAssessment.reasoning,
            pricedInConfidence: analysis.pricedInAssessment.confidence,
            ...(source ? { sources: { create: [{ sourceId: source.id }] } } : {}),
          },
        });
        macroCreated += 1;

        // Alert since we know this company is now on the watchlist
        const alert = generateAlert({
          eventOrHeadline: event.title,
          ticker: company.ticker,
          affectedSectors: [rule.sector],
          classification: analysis.classification,
          adjustedImpactScore: analysis.adjustedImpactScore,
          confidenceScore: analysis.confidenceScore,
          pricedInStatus: analysis.pricedInAssessment.status,
        });
        await prisma.alert.create({
          data: {
            impactAnalysisId: impactAnalysis.id,
            companyId: company.id,
            eventSummary: alert.eventSummary,
            affectedSectors: [rule.sector],
            possibleImpact: alert.possibleImpact,
            severity: alert.severity,
          },
        });
      }
    }
  }

  return { skipped: false, newsCreated, macroCreated };
}
