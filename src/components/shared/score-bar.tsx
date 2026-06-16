import { formatScore } from "@/lib/utils";

/** Visualizes a -1.0..+1.0 research score as a centered bar, making uncertainty/direction legible at a glance. */
export function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.max(-1, Math.min(1, score)) * 50; // -50..50
  const isPositive = score >= 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{formatScore(score)}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <div className="absolute left-1/2 top-0 h-2 w-px bg-border" />
        <div
          className={`absolute top-0 h-2 rounded-full ${isPositive ? "bg-bullish" : "bg-bearish"}`}
          style={{
            left: isPositive ? "50%" : `${50 + pct}%`,
            width: `${Math.abs(pct)}%`,
          }}
        />
      </div>
    </div>
  );
}
