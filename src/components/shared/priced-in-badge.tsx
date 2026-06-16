import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "@/lib/utils";

export function PricedInBadge({ status }: { status: string }) {
  const variant =
    status === "NOT_PRICED_IN" ? "bearish" : status === "MOSTLY_PRICED_IN" ? "neutral" : status === "PARTIALLY_PRICED_IN" ? "mixed" : "unknown";
  return <Badge variant={variant}>Priced-in: {formatEnumLabel(status)}</Badge>;
}
