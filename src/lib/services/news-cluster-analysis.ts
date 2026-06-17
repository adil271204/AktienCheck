/**
 * Multi-News Impact Synthesis Service
 *
 * Groups NewsItems for a company within a time window and derives a combined
 * directional research signal. Uses deterministic mock logic (seededFraction)
 * so the same cluster always produces the same output — no paid APIs are called.
 *
 * Output schema: NewsClusterAnalysis (see prisma/schema.prisma).
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { seededFraction, clamp, classifyDirection } from "./classification";
import { assessPricedIn } from "./priced-in-engine";
import type { NewsClusterAnalysis } from "@prisma/client";

// Prisma's Json type doesn't accept typed arrays directly — cast helper.
function j<T>(v: T): Prisma.InputJsonValue {
  return v as unknown as Prisma.InputJsonValue;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimeWindow = "24h" | "3d" | "7d" | "30d";

export interface DominantDriver {
  theme: string;
  weight: number;     // 0..1
  direction: string;  // ImpactDirection
}

export interface InteractionEffect {
  type: "reinforcing" | "offsetting" | "neutral";
  description: string;
}

export interface MostImportantNewsItem {
  newsItemId: string;
  headline: string;
  weight: number; // 0..1, relative importance in the cluster
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WINDOW_MS: Record<TimeWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d":  3  * 24 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

/** Derive a per-item weight from its analysis score and confidence. */
function itemWeight(score: number, confidence: number): number {
  return clamp(Math.abs(score) * 0.6 + confidence * 0.4, 0.05, 1);
}

/** Weighted average of scores. */
function weightedAvg(pairs: Array<{ score: number; weight: number }>): number {
  const totalWeight = pairs.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return 0;
  return pairs.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight;
}

/** Infer dominant thematic drivers from news headlines using keyword matching. */
function inferThemes(headlines: string[]): DominantDriver[] {
  const THEME_KEYWORDS: Array<{ theme: string; keywords: string[]; direction: string }> = [
    { theme: "Revenue / Earnings",  keywords: ["revenue", "earnings", "sales", "profit", "beat", "miss", "guidance"], direction: "MIXED" },
    { theme: "Product / Technology", keywords: ["launch", "product", "chip", "ai", "model", "platform", "unveil", "announce"], direction: "BULLISH" },
    { theme: "Supply Chain",         keywords: ["supply", "shortage", "delay", "shipment", "production", "output"], direction: "BEARISH" },
    { theme: "Regulation / Policy",  keywords: ["regulation", "regulat", "policy", "ban", "restrict", "sanction", "tariff", "law"], direction: "BEARISH" },
    { theme: "Demand / Market",      keywords: ["demand", "market", "competition", "rival", "customer"], direction: "MIXED" },
    { theme: "Macro / Rate",         keywords: ["rate", "fed", "inflation", "macro", "economy", "gdp"], direction: "MIXED" },
    { theme: "Expansion / Growth",   keywords: ["expand", "invest", "hire", "deal", "contract", "partner", "agreement"], direction: "BULLISH" },
    { theme: "Geopolitical Risk",    keywords: ["war", "conflict", "geopolit", "sanction", "tension"], direction: "BEARISH" },
  ];

  const counts: Record<string, number> = {};
  for (const headline of headlines) {
    const lower = headline.toLowerCase();
    for (const theme of THEME_KEYWORDS) {
      if (theme.keywords.some((k) => lower.includes(k))) {
        counts[theme.theme] = (counts[theme.theme] ?? 0) + 1;
      }
    }
  }

  const total = headlines.length || 1;
  return THEME_KEYWORDS
    .filter((t) => counts[t.theme])
    .map((t) => ({
      theme: t.theme,
      weight: clamp(counts[t.theme] / total, 0.05, 1),
      direction: t.direction,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
}

/** Derive interaction effects (reinforcing vs offsetting) from the score distribution. */
function inferInteractionEffects(
  scores: number[],
  clusterSeed: string
): InteractionEffect[] {
  const positives = scores.filter((s) => s > 0.1).length;
  const negatives = scores.filter((s) => s < -0.1).length;
  const neutrals  = scores.length - positives - negatives;

  const effects: InteractionEffect[] = [];

  if (positives > 1 && negatives === 0) {
    effects.push({ type: "reinforcing", description: `${positives} bullish signals reinforce each other, strengthening the overall positive research outlook.` });
  } else if (negatives > 1 && positives === 0) {
    effects.push({ type: "reinforcing", description: `${negatives} bearish signals reinforce each other, strengthening the overall negative research pressure.` });
  } else if (positives >= 1 && negatives >= 1) {
    effects.push({ type: "offsetting", description: `Bullish signals (${positives}) and bearish signals (${negatives}) partially offset each other, creating a mixed overall picture.` });
  }

  if (neutrals > 0) {
    effects.push({ type: "neutral", description: `${neutrals} neutral or low-signal news item${neutrals > 1 ? "s" : ""} contribute${neutrals === 1 ? "s" : ""} limited directional pressure.` });
  }

  const jitter = seededFraction(clusterSeed + ":interaction");
  if (jitter > 0.6 && scores.length >= 2) {
    effects.push({ type: "reinforcing", description: "The combined news flow appears to share a common macro theme, which may amplify rather than diversify the overall signal." });
  }

  return effects.slice(0, 3);
}

/** Build the human-readable synthesis reasoning paragraph. */
function buildReasoning(params: {
  ticker: string;
  timeWindow: TimeWindow;
  count: number;
  headlineScore: number;
  adjustedScore: number;
  confidence: number;
  dominantDrivers: DominantDriver[];
  effects: InteractionEffect[];
}): string {
  const { ticker, timeWindow, count, headlineScore, adjustedScore, confidence, dominantDrivers, effects } = params;

  const windowLabel: Record<TimeWindow, string> = {
    "24h": "the past 24 hours",
    "3d":  "the past 3 days",
    "7d":  "the past 7 days",
    "30d": "the past 30 days",
  };

  const topThemes = dominantDrivers.slice(0, 2).map((d) => d.theme).join(" and ");
  const direction = headlineScore > 0.15 ? "positive (bullish)" : headlineScore < -0.15 ? "negative (bearish)" : "neutral / mixed";
  const offsetNote = effects.some((e) => e.type === "offsetting")
    ? " However, offsetting signals temper the directional conviction."
    : "";

  return (
    `Over ${windowLabel[timeWindow]}, ${ticker} generated ${count} news item${count !== 1 ? "s" : ""} that were ` +
    `synthesized into a combined research signal of ${headlineScore.toFixed(2)} (headline) / ` +
    `${adjustedScore.toFixed(2)} (adjusted), with ${Math.round(confidence * 100)}% estimated confidence. ` +
    `The dominant thematic drivers are ${topThemes || "general company developments"}.${offsetNote} ` +
    `After weighting each item by its individual signal strength and estimated reliability, the combined ` +
    `directional lean is ${direction}. This synthesis represents the aggregated research signal across the ` +
    `selected news cluster and should not be interpreted as a price prediction or investment recommendation. ` +
    `Interact effects within the cluster: ${effects.map((e) => e.description).join(" ")}`
  );
}

/** Future watch items — observations a research analyst would flag for monitoring. */
function buildWatchItems(
  ticker: string,
  drivers: DominantDriver[],
  sentiment: string,
  timeWindow: TimeWindow
): string[] {
  const items: string[] = [];
  const topDriver = drivers[0]?.theme;

  if (topDriver === "Supply Chain") {
    items.push(`Monitor ${ticker} supply chain disclosures in the next earnings call for any update on component availability.`);
  }
  if (topDriver === "Revenue / Earnings") {
    items.push(`Watch for guidance revisions or analyst estimate changes following this earnings-related news cluster.`);
  }
  if (topDriver === "Regulation / Policy") {
    items.push(`Track regulatory developments in the relevant jurisdiction; a secondary ruling could significantly change the research outlook.`);
  }
  if (drivers.some((d) => d.theme === "Product / Technology")) {
    items.push(`Follow customer adoption metrics or partnership announcements related to the product/technology news.`);
  }
  if (sentiment === "MIXED") {
    items.push(`The mixed cluster warrants close monitoring over the next ${timeWindow === "24h" ? "48 hours" : "2 weeks"} to determine whether bullish or bearish signals dominate as new information arrives.`);
  }
  items.push(`Cross-reference this news cluster with sector-level macro events to isolate company-specific versus market-wide drivers.`);

  return items.slice(0, 4);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates (and persists) a Multi-News Impact Synthesis for a company over
 * the given time window.
 *
 * Always creates a new record — callers can decide whether to delete old ones first.
 * Uses only existing data in the DB + deterministic mock logic.
 */
export async function generateNewsClusterAnalysis(params: {
  companyId: string;
  timeWindow: TimeWindow;
}): Promise<NewsClusterAnalysis> {
  const { companyId, timeWindow } = params;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error(`Company not found: ${companyId}`);

  const since = new Date(Date.now() - WINDOW_MS[timeWindow]);

  // Load news items in the window with their analyses
  const newsItems = await prisma.newsItem.findMany({
    where: { companyId, publishedAt: { gte: since } },
    include: {
      impactAnalyses: {
        where: { type: "COMPANY_NEWS" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // Build the cluster seed from company + window + news IDs (deterministic)
  const clusterSeed = `${companyId}:${timeWindow}:${newsItems.map((n) => n.id).join(",")}`;

  if (newsItems.length === 0) {
    // No news in window — produce a low-confidence neutral placeholder
    const placeholderAssessment = assessPricedIn({ seed: clusterSeed, surpriseMagnitude: 0, confidenceScore: 0.2 });
    return prisma.newsClusterAnalysis.create({
      data: {
        companyId,
        timeWindow,
        clusterTitle: `No news found for ${company.ticker} in the past ${timeWindow}`,
        overallSentiment: "UNKNOWN",
        headlineImpactScore: 0,
        adjustedImpactScore: 0,
        confidence: 0.1,
        selectedNewsItemIds: j([]),
        dominantDrivers: j([]),
        interactionEffects: j([]),
        mostImportantNews: j([]),
        futureWatchItems: j([`Watch for the first news item for ${company.ticker} to appear in the ${timeWindow} window.`]),
        pricedInStatus: placeholderAssessment.status,
        surpriseLevel: placeholderAssessment.surprise_level,
        expectationGap: placeholderAssessment.expectation_gap,
        pricedInReasoning: placeholderAssessment.reasoning,
        reasoning: `No news items found for ${company.ticker} within the selected ${timeWindow} time window. This synthesis cannot be computed — run the pipeline or add news data to generate a signal.`,
        risks: j(["Insufficient data: the time window contains no news items for this company."]),
      },
    });
  }

  // Build per-item enriched data
  const enrichedItems = newsItems.map((n) => {
    const analysis = n.impactAnalyses[0];
    const score = analysis?.headlineImpactScore ?? 0;
    const adjustedScore = analysis?.adjustedImpactScore ?? 0;
    const confidence = analysis?.confidenceScore ?? 0.3;
    const weight = itemWeight(score, confidence);
    return { newsItem: n, analysis, score, adjustedScore, confidence, weight };
  });

  // Weighted headline + adjusted scores across the cluster
  const headlineImpactScore = clamp(
    weightedAvg(enrichedItems.map((i) => ({ score: i.score, weight: i.weight }))),
    -1, 1
  );
  const adjustedImpactScore = clamp(
    weightedAvg(enrichedItems.map((i) => ({ score: i.adjustedScore, weight: i.weight }))),
    -1, 1
  );

  // Cluster confidence: average individual confidence, boosted by count (more items = more signal)
  const avgConfidence = enrichedItems.reduce((s, i) => s + i.confidence, 0) / enrichedItems.length;
  const countBonus = clamp((enrichedItems.length - 1) * 0.03, 0, 0.15);
  const confidence = clamp(avgConfidence + countBonus, 0.1, 0.92);

  // Spread: difference between max and min score — high spread → MIXED
  const scores = enrichedItems.map((i) => i.score);
  const spread = Math.max(...scores) - Math.min(...scores);
  const overallSentiment = classifyDirection(adjustedImpactScore, spread > 0.6 ? 1 : 0);

  // Dominant thematic drivers from headlines
  const dominantDrivers = inferThemes(newsItems.map((n) => n.headline));

  // Interaction effects
  const interactionEffects = inferInteractionEffects(scores, clusterSeed);

  // Most important news items (top 3 by weight)
  const mostImportantNews: MostImportantNewsItem[] = enrichedItems
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((i) => ({ newsItemId: i.newsItem.id, headline: i.newsItem.headline, weight: Math.round(i.weight * 100) / 100 }));

  // Cluster title
  const topDriver = dominantDrivers[0]?.theme ?? "General news";
  const clusterTitle = `${company.ticker} · ${newsItems.length}-item cluster · ${topDriver} theme · ${timeWindow} window`;

  // Future watch items
  const futureWatchItems = buildWatchItems(company.ticker, dominantDrivers, overallSentiment, timeWindow);

  // Reasoning
  const reasoning = buildReasoning({
    ticker: company.ticker,
    timeWindow,
    count: newsItems.length,
    headlineScore: headlineImpactScore,
    adjustedScore: adjustedImpactScore,
    confidence,
    dominantDrivers,
    effects: interactionEffects,
  });

  // Risks
  const risks: string[] = [
    "This synthesis is produced from mock/illustrative data — not from a live news feed.",
    "Weighting news items by individual signal strength may overrepresent high-magnitude items.",
    "The time window may capture unrelated events that coincidentally fall within the same period.",
  ];
  if (spread > 0.5) {
    risks.push("High spread between individual signals — the cluster contains strongly conflicting directional information.");
  }
  if (newsItems.length < 3) {
    risks.push("Small sample size: fewer than 3 news items in the window reduces synthesis reliability.");
  }
  if (confidence < 0.5) {
    risks.push("Low overall confidence — treat this synthesis as a weak directional hypothesis.");
  }

  // Priced-in assessment for the cluster
  const pricedIn = assessPricedIn({
    seed: clusterSeed + ":priced-in",
    surpriseMagnitude: Math.abs(headlineImpactScore),
    confidenceScore: confidence,
  });

  return prisma.newsClusterAnalysis.create({
    data: {
      companyId,
      timeWindow,
      clusterTitle,
      overallSentiment,
      headlineImpactScore,
      adjustedImpactScore,
      confidence,
      selectedNewsItemIds: j(newsItems.map((n) => n.id)),
      dominantDrivers: j(dominantDrivers),
      interactionEffects: j(interactionEffects),
      mostImportantNews: j(mostImportantNews),
      futureWatchItems: j(futureWatchItems),
      pricedInStatus: pricedIn.status,
      surpriseLevel: pricedIn.surprise_level,
      expectationGap: pricedIn.expectation_gap,
      pricedInReasoning: pricedIn.reasoning,
      reasoning,
      risks: j(risks),
    },
  });
}
