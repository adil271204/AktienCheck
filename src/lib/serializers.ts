import type { ImpactAnalysis, Source, AnalysisSource } from "@prisma/client";

type AnalysisWithSources = ImpactAnalysis & {
  sources: (AnalysisSource & { source: Source })[];
};

/** Maps a Prisma ImpactAnalysis row (+ joined sources) into the API DTO shape, with priced_in_assessment nested. */
export function toAnalysisDTO(analysis: AnalysisWithSources) {
  return {
    id: analysis.id,
    type: analysis.type,
    newsItemId: analysis.newsItemId,
    macroEventId: analysis.macroEventId,
    companyId: analysis.companyId,
    classification: analysis.classification,
    headline_impact_score: analysis.headlineImpactScore,
    adjusted_impact_score: analysis.adjustedImpactScore,
    confidence_score: analysis.confidenceScore,
    time_horizon: analysis.timeHorizon,
    reasoning: analysis.reasoning,
    risks: analysis.risks,
    priced_in_assessment: {
      status: analysis.pricedInStatus,
      surprise_level: analysis.pricedInSurpriseLevel,
      expectation_gap: analysis.pricedInExpectationGap,
      reasoning: analysis.pricedInReasoning,
      confidence: analysis.pricedInConfidence,
    },
    sources: analysis.sources.map((s) => ({
      id: s.source.id,
      title: s.source.title,
      url: s.source.url,
      publisher: s.source.publisher,
      publishedAt: s.source.publishedAt,
    })),
    createdAt: analysis.createdAt,
  };
}
