import { classifyDirection, pickTimeHorizon, seededFraction, clamp } from "./classification";
import { assessPricedIn } from "./priced-in-engine";
import type { ImpactDirection, TimeHorizon } from "../schemas/enums";
import type { PricedInAssessmentDTO } from "../schemas/entities";

export interface NewsAnalysisInput {
  id: string;
  ticker: string;
  headline: string;
  body: string;
  rawSignal: number; // -1..1, from the mock collector — stands in for an NLP sentiment model
}

export interface NewsAnalysisResult {
  classification: ImpactDirection;
  headlineImpactScore: number;
  adjustedImpactScore: number;
  confidenceScore: number;
  timeHorizon: TimeHorizon;
  reasoning: string;
  risks: string[];
  pricedInAssessment: PricedInAssessmentDTO;
}

const GENERIC_RISKS = [
  "Headline-level sentiment may not reflect the full content or nuance of the underlying report.",
  "Mock/illustrative data — not based on a live news feed in this MVP.",
  "Market reaction can diverge from the directional research signal due to unrelated factors.",
];

/**
 * Mock Company News Analyzer. Derives a headline impact score directly from the
 * raw collector signal, then an adjusted score that discounts for estimated
 * noise/confidence, mirroring how a real NLP+context pipeline would behave.
 */
export function analyzeNews(input: NewsAnalysisInput): NewsAnalysisResult {
  const seed = input.id;
  const headlineImpactScore = clamp(input.rawSignal, -1, 1);

  // Confidence is higher for clearly worded, stronger-signal headlines (mocked via magnitude + seed jitter)
  const jitter = (seededFraction(seed + ":confidence") - 0.5) * 0.2;
  const confidenceScore = clamp(0.45 + Math.abs(headlineImpactScore) * 0.4 + jitter, 0.1, 0.97);

  // Adjusted score discounts the headline score by (1 - confidence), reflecting uncertainty
  const adjustedImpactScore = clamp(headlineImpactScore * (0.5 + 0.5 * confidenceScore), -1, 1);

  const mixedSpread = Math.abs(headlineImpactScore - adjustedImpactScore) > 0.6 ? 1 : 0;
  const classification = classifyDirection(adjustedImpactScore, mixedSpread);

  const timeHorizon = pickTimeHorizon(seed);

  const direction = classification.toLowerCase();
  const reasoning =
    `The headline for ${input.ticker} reads as ${direction} on a -1.0..+1.0 scale ` +
    `(headline score ${headlineImpactScore.toFixed(2)}). After adjusting for estimated reliability and ` +
    `lack of corroborating detail, the research signal is tempered to ${adjustedImpactScore.toFixed(2)} ` +
    `with ${(confidenceScore * 100).toFixed(0)}% estimated confidence. This is a directional research ` +
    `signal only, not a price forecast.`;

  const risks = [...GENERIC_RISKS];
  if (confidenceScore < 0.5) {
    risks.unshift("Low estimated confidence — treat this signal as highly uncertain.");
  }

  const pricedInAssessment = assessPricedIn({
    seed,
    surpriseMagnitude: Math.abs(headlineImpactScore),
    confidenceScore,
  });

  return {
    classification,
    headlineImpactScore,
    adjustedImpactScore,
    confidenceScore,
    timeHorizon,
    reasoning,
    risks,
    pricedInAssessment,
  };
}
