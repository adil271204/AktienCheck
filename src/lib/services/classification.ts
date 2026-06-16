import type { ImpactDirection, TimeHorizon } from "../schemas/enums";

/** Converts a continuous signal score in [-1, 1] into a discrete research classification. */
export function classifyDirection(score: number, mixedSpread = 0): ImpactDirection {
  if (mixedSpread > 0.5) return "MIXED";
  if (Number.isNaN(score)) return "UNKNOWN";
  if (score > 0.15) return "BULLISH";
  if (score < -0.15) return "BEARISH";
  return "NEUTRAL";
}

/** Deterministic pseudo-randomness from a string seed, so re-running mock collectors is stable per item. */
export function seededFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

export function pickTimeHorizon(seed: string): TimeHorizon {
  const f = seededFraction(seed + ":horizon");
  if (f < 0.2) return "INTRADAY";
  if (f < 0.55) return "SHORT_TERM";
  if (f < 0.85) return "MEDIUM_TERM";
  return "LONG_TERM";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
