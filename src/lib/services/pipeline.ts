import { prisma } from "../prisma";
import { MOCK_COMPANIES } from "../mock/companies";
import { collectMockNews } from "../mock/news-collector";
import { collectMockMacroEvents } from "../mock/macro-events-collector";
import { getSectorImpactsForEventType } from "./sector-impact-engine";
import { findExposedCompanies } from "./exposure-engine";
import { analyzeNews } from "./news-analyzer";
import { analyzeMacroEventForCompany } from "./macro-analyzer";
import { generateAlert } from "./alert-generator";

async function ensureSource(source: { title: string; url: string; publisher: string }) {
  const existing = await prisma.source.findFirst({ where: { url: source.url } });
  if (existing) return existing;
  return prisma.source.create({ data: source });
}

/** Ensures the mock company universe exists in the DB. Idempotent (upsert by ticker). */
export async function ensureCompanies() {
  for (const c of MOCK_COMPANIES) {
    await prisma.company.upsert({
      where: { ticker: c.ticker },
      update: { name: c.name, sector: c.sector, industry: c.industry, country: c.country, description: c.description },
      create: c,
    });
  }
}

/** Runs the mock company news collector + analyzer, persisting NewsItem + ImpactAnalysis (+ Alerts for watchlisted tickers). */
export async function runNewsPipeline() {
  const collected = collectMockNews();
  const watchlistTickers = new Set(
    (await prisma.watchlistItem.findMany({ include: { company: true } })).map((w) => w.company.ticker)
  );

  let created = 0;
  for (const item of collected) {
    const company = await prisma.company.findUnique({ where: { ticker: item.ticker } });
    if (!company) continue;

    const existing = await prisma.newsItem.findFirst({
      where: { companyId: company.id, headline: item.headline },
    });
    if (existing) continue;

    const source = await ensureSource(item.source);
    const newsItem = await prisma.newsItem.create({
      data: {
        companyId: company.id,
        headline: item.headline,
        body: item.body,
        publishedAt: item.publishedAt,
        sourceId: source.id,
      },
    });

    const analysis = analyzeNews({
      id: newsItem.id,
      ticker: item.ticker,
      headline: item.headline,
      body: item.body,
      rawSignal: item.rawSignal,
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
    created += 1;

    if (watchlistTickers.has(item.ticker)) {
      const alert = generateAlert({
        eventOrHeadline: item.headline,
        ticker: item.ticker,
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
  }
  return { created };
}

/** Runs the mock macro event collector + sector/exposure engines + analyzer, persisting all related rows. */
export async function runMacroPipeline() {
  const collected = collectMockMacroEvents();
  const allCompanies = await prisma.company.findMany();
  const watchlistTickers = new Set(
    (await prisma.watchlistItem.findMany({ include: { company: true } })).map((w) => w.company.ticker)
  );

  let created = 0;
  for (const event of collected) {
    const existing = await prisma.macroEvent.findFirst({ where: { title: event.title } });
    if (existing) continue;

    const source = await ensureSource(event.source);
    const macroEvent = await prisma.macroEvent.create({
      data: {
        type: event.type,
        title: event.title,
        description: event.description,
        country: event.country,
        occurredAt: event.occurredAt,
        sourceId: source.id,
      },
    });

    const sectorRules = getSectorImpactsForEventType(event.type);
    const affectedSectorNames: string[] = [];

    for (const rule of sectorRules) {
      affectedSectorNames.push(rule.sector);
      const sectorImpact = await prisma.sectorImpact.create({
        data: {
          macroEventId: macroEvent.id,
          sector: rule.sector,
          industry: rule.industry,
          direction: rule.direction,
          effectType: rule.effectType,
          explanation: rule.explanation,
        },
      });

      const exposed = findExposedCompanies(allCompanies, rule.sector, rule.industry);
      for (const exposure of exposed) {
        const company = allCompanies.find((c) => c.ticker === exposure.ticker);
        if (!company) continue;

        await prisma.companyImpact.create({
          data: {
            companyId: company.id,
            sectorImpactId: sectorImpact.id,
            exposureType: exposure.exposureType,
            reasoning: exposure.reasoning,
          },
        });

        const analysis = analyzeMacroEventForCompany({
          id: `${macroEvent.id}:${company.ticker}`,
          ticker: company.ticker,
          eventTitle: macroEvent.title,
          rawSignal: event.rawSignal,
          sectorRule: rule,
          exposureReasoning: exposure.reasoning,
        });

        const impactAnalysis = await prisma.impactAnalysis.create({
          data: {
            type: "MACRO_EVENT",
            macroEventId: macroEvent.id,
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
        created += 1;

        if (watchlistTickers.has(company.ticker)) {
          const alert = generateAlert({
            eventOrHeadline: macroEvent.title,
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
  }
  return { created };
}

export async function runFullPipeline() {
  await ensureCompanies();
  const news = await runNewsPipeline();
  const macro = await runMacroPipeline();
  return { news, macro };
}
