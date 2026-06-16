import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "@/lib/utils";

const VARIANT_MAP: Record<string, "bullish" | "bearish" | "neutral" | "mixed" | "unknown"> = {
  BULLISH: "bullish",
  BEARISH: "bearish",
  NEUTRAL: "neutral",
  MIXED: "mixed",
  UNKNOWN: "unknown",
};

export function ImpactBadge({ classification }: { classification: string }) {
  const variant = VARIANT_MAP[classification] ?? "unknown";
  return (
    <Badge variant={variant}>
      {formatEnumLabel(classification)} research signal
    </Badge>
  );
}
