import { seededFraction, clamp } from "./classification";
import type {
  PricedInStatus,
  SurpriseLevel,
  ExpectationGap,
} from "../schemas/enums";
import type { PricedInAssessmentDTO } from "../schemas/entities";

export interface PricedInInput {
  seed: string;
  surpriseMagnitude: number; // 0..1, how strong/unusual the headline or event signal is
  confidenceScore: number; // 0..1, confidence from the upstream analysis step
}

/**
 * Mock Priced-In Assessment Engine.
 *
 * In a production system this would compare pre-event price/volume drift,
 * implied-vol moves, consensus estimates, and post-event reaction to judge
 * whether information was already reflected in the market price. Here we
 * derive a deterministic, illustrative approximation from the surprise
 * magnitude and a stable per-item pseudo-random "prior expectation" signal,
 * so the same item always returns the same assessment.
 */
export function assessPricedIn(input: PricedInInput): PricedInAssessmentDTO {
  const wasExpected = seededFraction(input.seed + ":expected"); // 0 = total surprise, 1 = fully anticipated
  const reactionVisibility = seededFraction(input.seed + ":reaction");

  // Combine surprise magnitude with how "expected" the underlying event was
  const surpriseScore = clamp(input.surpriseMagnitude * (1 - wasExpected * 0.7), 0, 1);

  let surprise_level: SurpriseLevel;
  if (surpriseScore < 0.33) surprise_level = "LOW";
  else if (surpriseScore < 0.66) surprise_level = "MEDIUM";
  else surprise_level = "HIGH";

  let status: PricedInStatus;
  if (wasExpected > 0.7 && surpriseScore < 0.4) status = "MOSTLY_PRICED_IN";
  else if (wasExpected > 0.4) status = "PARTIALLY_PRICED_IN";
  else if (input.confidenceScore < 0.35) status = "UNKNOWN";
  else status = "NOT_PRICED_IN";

  let expectation_gap: ExpectationGap;
  if (input.confidenceScore < 0.3) expectation_gap = "UNKNOWN";
  else if (surpriseScore > 0.55) {
    expectation_gap = wasExpected < 0.5 ? "WORSE_THAN_EXPECTED" : "BETTER_THAN_EXPECTED";
  } else {
    expectation_gap = "IN_LINE";
  }

  const confidence = clamp(0.3 + reactionVisibility * 0.4 + input.confidenceScore * 0.2, 0.15, 0.9);

  const reasoning = buildReasoning({ wasExpected, surprise_level, status, expectation_gap, reactionVisibility });

  return {
    status,
    surprise_level,
    expectation_gap,
    reasoning,
    confidence,
  };
}

function buildReasoning(args: {
  wasExpected: number;
  surprise_level: SurpriseLevel;
  status: PricedInStatus;
  expectation_gap: ExpectationGap;
  reactionVisibility: number;
}): string {
  const expectedPhrase =
    args.wasExpected > 0.7
      ? "widely anticipated by market participants ahead of the news"
      : args.wasExpected > 0.4
        ? "partially anticipated, with some prior signaling"
        : "not clearly anticipated based on available information";

  const reactionPhrase =
    args.reactionVisibility > 0.6
      ? "a visible market reaction would typically be expected"
      : "a muted or unclear market reaction would be plausible";

  return (
    `This information appears ${expectedPhrase}. Combined with a "${args.surprise_level.toLowerCase()}" ` +
    `surprise level and an expectation gap assessed as "${args.expectation_gap.toLowerCase().replace(/_/g, " ")}", ` +
    `the research view is that the event is "${args.status.toLowerCase().replace(/_/g, " ")}." Under this scenario, ` +
    `${reactionPhrase}. This assessment is illustrative (mock heuristic), not derived from live price/volume data, ` +
    `and should not be treated as a certainty about market behavior.`
  );
}
