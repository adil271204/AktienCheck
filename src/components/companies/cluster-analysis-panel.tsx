"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Loader2, RefreshCw, Layers, TrendingUp, TrendingDown,
  ArrowLeftRight, Eye, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/shared/score-bar";
import { cn, formatDate, formatEnumLabel, formatPercent } from "@/lib/utils";

// ── Types (mirrors DB JSON fields) ─────────────────────────────────────────

interface DominantDriver {
  theme: string;
  weight: number;
  direction: string;
}

interface InteractionEffect {
  type: "reinforcing" | "offsetting" | "neutral";
  description: string;
}

interface MostImportantNewsItem {
  newsItemId: string;
  headline: string;
  weight: number;
}

interface ClusterAnalysis {
  id: string;
  companyId: string;
  timeWindow: string;
  clusterTitle: string;
  overallSentiment: string;
  headlineImpactScore: number;
  adjustedImpactScore: number;
  confidence: number;
  selectedNewsItemIds: string[];
  dominantDrivers: DominantDriver[];
  interactionEffects: InteractionEffect[];
  mostImportantNews: MostImportantNewsItem[];
  futureWatchItems: string[];
  pricedInStatus: string;
  surpriseLevel: string;
  expectationGap: string;
  pricedInReasoning: string;
  reasoning: string;
  risks: string[];
  createdAt: string;
}

type TimeWindow = "24h" | "3d" | "7d" | "30d";

// ── Sub-components ──────────────────────────────────────────────────────────

const DIRECTION_ICON: Record<string, React.ElementType> = {
  BULLISH: TrendingUp,
  BEARISH: TrendingDown,
  MIXED: ArrowLeftRight,
  NEUTRAL: ArrowLeftRight,
  UNKNOWN: ArrowLeftRight,
};

const DIRECTION_COLOR: Record<string, string> = {
  BULLISH: "text-bullish",
  BEARISH: "text-bearish",
  MIXED: "text-mixed",
  NEUTRAL: "text-muted-foreground",
  UNKNOWN: "text-muted-foreground",
};

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const Icon = DIRECTION_ICON[sentiment] ?? ArrowLeftRight;
  const color = DIRECTION_COLOR[sentiment] ?? "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", color)}>
      <Icon className="h-4 w-4" />
      {formatEnumLabel(sentiment)}
    </span>
  );
}

function InteractionBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    reinforcing: { label: "Reinforcing", cls: "border-bullish/40 text-bullish" },
    offsetting:  { label: "Offsetting",  cls: "border-bearish/40 text-bearish" },
    neutral:     { label: "Neutral",     cls: "border-border text-muted-foreground" },
  };
  const config = map[type] ?? map.neutral;
  return <Badge variant="outline" className={cn("text-xs", config.cls)}>{config.label}</Badge>;
}

// ── Main panel ──────────────────────────────────────────────────────────────

interface Props {
  ticker: string;
  initialAnalysis: ClusterAnalysis | null;
  initialWindow?: TimeWindow;
}

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: "24h", label: "24 h" },
  { value: "3d",  label: "3 d"  },
  { value: "7d",  label: "7 d"  },
  { value: "30d", label: "30 d" },
];

export function ClusterAnalysisPanel({ ticker, initialAnalysis, initialWindow = "7d" }: Props) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(initialWindow);
  const [analysis, setAnalysis] = useState<ClusterAnalysis | null>(initialAnalysis);
  const [status, setStatus] = useState<"idle" | "loading" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRisks, setShowRisks] = useState(false);
  const [, startTransition] = useTransition();

  async function loadExisting(window: TimeWindow) {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/companies/${ticker}/cluster-analysis?window=${window}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAnalysis(data.analysis ?? null);
    } catch {
      setErrorMsg("Failed to load cluster analysis.");
    } finally {
      setStatus("idle");
    }
  }

  async function generate(window: TimeWindow) {
    setStatus("generating");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/companies/${ticker}/cluster-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ window }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch {
      setErrorMsg("Failed to generate synthesis. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  function handleWindowChange(w: TimeWindow) {
    setTimeWindow(w);
    startTransition(() => loadExisting(w));
  }

  const busy = status === "loading" || status === "generating";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Multi-News Impact Synthesis
            </CardTitle>
            <CardDescription className="mt-1">
              Combined research signal across multiple news items in the selected window.
              Not financial advice — directional research estimate only.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => generate(timeWindow)}
            disabled={busy}
          >
            {busy ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{status === "generating" ? "Synthesizing…" : "Loading…"}</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" />Generate synthesis</>
            )}
          </Button>
        </div>

        {/* Time window selector */}
        <div className="flex items-center gap-1 pt-1">
          <span className="text-xs text-muted-foreground mr-1">Window:</span>
          {WINDOWS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleWindowChange(value)}
              disabled={busy}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                timeWindow === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMsg && (
          <div className="rounded-md border border-bearish/30 bg-bearish/10 px-4 py-3 text-sm text-bearish">
            {errorMsg}
          </div>
        )}

        {!analysis && !busy && !errorMsg && (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-10 text-center text-muted-foreground">
            <Layers className="h-7 w-7 opacity-40" />
            <p className="text-sm">No synthesis generated yet for this window.</p>
            <p className="text-xs">Click &ldquo;Generate synthesis&rdquo; to analyse all news in the {timeWindow} window.</p>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border py-10 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{status === "generating" ? "Synthesizing news cluster…" : "Loading…"}</span>
          </div>
        )}

        {analysis && !busy && (
          <>
            {/* Cluster header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-mono">{analysis.clusterTitle}</p>
                <div className="flex items-center gap-3">
                  <SentimentBadge sentiment={analysis.overallSentiment} />
                  <span className="text-xs text-muted-foreground">{formatDate(analysis.createdAt)}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {(analysis.selectedNewsItemIds as string[]).length} news item{(analysis.selectedNewsItemIds as string[]).length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Scores */}
            <div className="space-y-3">
              <ScoreBar label="Headline cluster score" score={analysis.headlineImpactScore} />
              <ScoreBar label="Adjusted cluster score" score={analysis.adjustedImpactScore} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cluster confidence</span>
                <span className="font-mono font-medium">{formatPercent(analysis.confidence)}</span>
              </div>
            </div>

            {/* Dominant drivers */}
            {(analysis.dominantDrivers as DominantDriver[]).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Dominant thematic drivers</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(analysis.dominantDrivers as DominantDriver[]).map((d) => (
                    <div key={d.theme} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm">{d.theme}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", DIRECTION_COLOR[d.direction] ?? "text-muted-foreground")}>
                          {formatEnumLabel(d.direction)}
                        </span>
                        <span className="text-xs text-muted-foreground">{Math.round(d.weight * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction effects */}
            {(analysis.interactionEffects as InteractionEffect[]).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Interaction effects</p>
                <div className="space-y-2">
                  {(analysis.interactionEffects as InteractionEffect[]).map((e, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-border p-3">
                      <InteractionBadge type={e.type} />
                      <p className="text-xs text-muted-foreground">{e.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most important news */}
            {(analysis.mostImportantNews as MostImportantNewsItem[]).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Most influential news items</p>
                <div className="space-y-2">
                  {(analysis.mostImportantNews as MostImportantNewsItem[]).map((n) => (
                    <Link
                      key={n.newsItemId}
                      href={`/analysis/${n.newsItemId}`}
                      className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 gap-3"
                    >
                      <p className="text-sm min-w-0 truncate">{n.headline}</p>
                      <span className="shrink-0 text-xs text-muted-foreground font-mono">
                        w={n.weight.toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Synthesis reasoning</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{analysis.reasoning}</p>
            </div>

            {/* Priced-in assessment */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Priced-in assessment</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Status", value: analysis.pricedInStatus },
                  { label: "Surprise level", value: analysis.surpriseLevel },
                  { label: "Expectation gap", value: analysis.expectationGap },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{formatEnumLabel(value)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{analysis.pricedInReasoning}</p>
            </div>

            {/* Future watch items */}
            {(analysis.futureWatchItems as string[]).length > 0 && (
              <div className="space-y-2 rounded-md border border-border p-3 bg-muted/30">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Future watch items
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  {(analysis.futureWatchItems as string[]).map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks collapsible */}
            <div className="space-y-1">
              <button
                onClick={() => setShowRisks((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk factors &amp; caveats
                {showRisks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showRisks && (
                <ul className="list-inside list-disc space-y-1 pl-1">
                  {(analysis.risks as string[]).map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
