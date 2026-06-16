import { AlertTriangle } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/schemas/entities";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-300/20 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p className={compact ? "text-xs leading-snug" : "text-sm leading-relaxed"}>
        <span className="font-semibold">Not financial advice. </span>
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
