import type { AlertSeverity } from "../schemas/enums";

export interface AlertGenerationInput {
  eventOrHeadline: string;
  ticker: string;
  affectedSectors: string[];
  classification: string;
  adjustedImpactScore: number;
  confidenceScore: number;
  pricedInStatus: string;
}

export interface GeneratedAlert {
  eventSummary: string;
  possibleImpact: string;
  severity: AlertSeverity;
}

/**
 * Mock Alert generator — produces a human-readable summary and severity for a
 * watchlist company impacted by a piece of news or a macro event.
 */
export function generateAlert(input: AlertGenerationInput): GeneratedAlert {
  const magnitude = Math.abs(input.adjustedImpactScore);
  let severity: AlertSeverity = "LOW";
  if (magnitude > 0.5 && input.confidenceScore > 0.5) severity = "HIGH";
  else if (magnitude > 0.25) severity = "MEDIUM";

  const eventSummary = `${input.eventOrHeadline} — flagged as potentially relevant to ${input.ticker}.`;

  const possibleImpact =
    `Research signal: ${input.classification.toLowerCase()} (adjusted score ${input.adjustedImpactScore.toFixed(2)}, ` +
    `confidence ${(input.confidenceScore * 100).toFixed(0)}%). Priced-in status: ` +
    `${input.pricedInStatus.toLowerCase().replace(/_/g, " ")}. Affected sectors: ${input.affectedSectors.join(", ")}. ` +
    `This is a research observation, not a trading recommendation.`;

  return { eventSummary, possibleImpact, severity };
}
