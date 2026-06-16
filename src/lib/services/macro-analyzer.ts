import { classifyDirection, pickTimeHorizon, seededFraction, clamp } from "./classification";
import { assessPricedIn } from "./priced-in-engine";
import type { ImpactDirection, TimeHorizon } from "../schemas/enums";
import type { PricedInAssessmentDTO } from "../schemas/entities";
import type { SectorMappingRule } from "../mock/sector-mapping";

export interface MacroAnalysisInput {
  id: string; // seed, e.g. `${macroEventId}:${ticker}`
  ticker: string;
  eventTitle: string;
  rawSignal: number; // -1..1 from the mock macro collector
  sectorRule: SectorMappingRule;
  exposureReasoning: string;
}

export interface MacroAnalysisResult {
  classification: ImpactDirection;
  headlineImpactScore: number;
  adjustedImpactScore: number;
  confidenceScore: number;
  timeHorizon: TimeHorizon;
  reasoning: string;
  risks: string[];
  pricedInAssessment: PricedInAssessmentDTO;
}

const directionBias: Record<ImpactDirection, number> = {
  BULLISH: 0.5,
  BEARISH: -0.5,
  NEUTRAL: 0,
  MIXED: 0,
  UNKNOWN: 0,
};

const GENERIC_RISKS = [
  "Sector-to-company mapping is illustrative and may not reflect this company's actual revenue exposure mix.",
  "Mock/illustrative data — not based on live market or filings data in this MVP.",
  "Second-order effects (competitor response, currency moves, policy reversal) are not modeled.",
];

/** Mock Macro/Country Event analyzer — derives a per-company research signal from a sector-level event mapping. */
export function analyzeMacroEventForCompany(input: MacroAnalysisInput): MacroAnalysisResult {
  const seed = input.id;
  const sectorBias = directionBias[input.sectorRule.direction];
  const headlineImpactScore = clamp(input.rawSignal * 0.6 + sectorBias * 0.4, -1, 1);

  const jitter = (seededFraction(seed + ":confidence") - 0.5) * 0.15;
  const exposureConfidenceBonus = input.sectorRule.effectType === "direct" ? 0.15 : 0;
  const confidenceScore = clamp(0.4 + Math.abs(headlineImpactScore) * 0.3 + exposureConfidenceBonus + jitter, 0.1, 0.95);

  const adjustedImpactScore = clamp(headlineImpactScore * (0.5 + 0.5 * confidenceScore), -1, 1);
  const isMixedSector = input.sectorRule.direction === "MIXED" ? 1 : 0;
  const classification = classifyDirection(adjustedImpactScore, isMixedSector);

  const timeHorizon = pickTimeHorizon(seed);

  const reasoning =
    `"${input.eventTitle}" maps to the "${input.sectorRule.sector}" sector with a ${input.sectorRule.effectType} ` +
    `effect type. ${input.sectorRule.explanation} For ${input.ticker} specifically: ${input.exposureReasoning} ` +
    `Combining the sector-level direction with company-specific exposure yields an adjusted research signal of ` +
    `${adjustedImpactScore.toFixed(2)} with ${(confidenceScore * 100).toFixed(0)}% estimated confidence. This is a ` +
    `directional research signal only, not a price forecast or recommendation.`;

  const risks = [...GENERIC_RISKS];
  if (input.sectorRule.direction === "MIXED") {
    risks.unshift("Sector-level effect is itself assessed as mixed/two-sided — directional outcome is uncertain.");
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
