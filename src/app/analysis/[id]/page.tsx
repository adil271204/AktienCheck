import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactBadge } from "@/components/shared/impact-badge";
import { PricedInBadge } from "@/components/shared/priced-in-badge";
import { ScoreBar } from "@/components/shared/score-bar";
import { Disclaimer } from "@/components/shared/disclaimer";
import { formatDate, formatEnumLabel, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({ params }: { params: { id: string } }) {
  const analysis = await prisma.impactAnalysis.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      newsItem: { include: { source: true } },
      macroEvent: { include: { source: true } },
      sources: { include: { source: true } },
    },
  });
  if (!analysis) notFound();

  const title = analysis.newsItem?.headline ?? analysis.macroEvent?.title ?? "Untitled event";
  const description = analysis.newsItem?.body ?? analysis.macroEvent?.description;

  return (
    <div className="space-y-6">
      <Disclaimer />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <ImpactBadge classification={analysis.classification} />
              <PricedInBadge status={analysis.pricedInStatus} />
            </div>
          </div>
          <CardDescription>
            {analysis.company && (
              <>
                <Link href={`/company/${analysis.company.ticker}`} className="text-primary hover:underline">
                  {analysis.company.ticker}
                </Link>{" "}
                ·{" "}
              </>
            )}
            {formatEnumLabel(analysis.type)} · {formatDate(analysis.createdAt)} · Time horizon:{" "}
            {formatEnumLabel(analysis.timeHorizon)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Research signal scores</CardTitle>
          <CardDescription>
            Scores range -1.0 (strongly bearish) to +1.0 (strongly bullish). These are directional research
            estimates, not price predictions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar label="Headline impact score" score={analysis.headlineImpactScore} />
          <ScoreBar label="Adjusted impact score" score={analysis.adjustedImpactScore} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-mono font-medium">{formatPercent(analysis.confidenceScore)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reasoning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.reasoning}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk factors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {analysis.risks.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priced-in assessment</CardTitle>
          <CardDescription>Is this information already reflected in the market price?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{formatEnumLabel(analysis.pricedInStatus)}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Surprise level</p>
              <p className="text-sm font-medium">{formatEnumLabel(analysis.pricedInSurpriseLevel)}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Expectation gap</p>
              <p className="text-sm font-medium">{formatEnumLabel(analysis.pricedInExpectationGap)}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.pricedInReasoning}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assessment confidence</span>
            <span className="font-mono font-medium">{formatPercent(analysis.pricedInConfidence)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.sources.map((s) => (
            <a
              key={s.id}
              href={s.source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md border border-border p-3 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">{s.source.publisher}</span>
              <span className="ml-2 text-muted-foreground">{s.source.title}</span>
            </a>
          ))}
          {analysis.sources.length === 0 && <p className="text-sm text-muted-foreground">No sources attached.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
