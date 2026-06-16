import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ImpactBadge } from "@/components/shared/impact-badge";
import { PricedInBadge } from "@/components/shared/priced-in-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatEnumLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

export default async function DashboardPage() {
  const [watchlistItems, alerts, recentAnalyses] = await Promise.all([
    prisma.watchlistItem.findMany({ where: { userId: USER_ID }, include: { company: true } }),
    prisma.alert.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.impactAnalysis.findMany({
      include: { company: true, newsItem: true, macroEvent: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const watchlistCompanyIds = new Set(watchlistItems.map((w) => w.companyId));

  return (
    <div className="space-y-6">
      <Disclaimer />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Watchlist size</CardDescription>
            <CardTitle className="text-2xl">{watchlistItems.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Recent alerts</CardDescription>
            <CardTitle className="text-2xl">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Recent analyses</CardDescription>
            <CardTitle className="text-2xl">{recentAnalyses.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alerts affecting your watchlist</CardTitle>
          <CardDescription>Research signals only — not trading recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No alerts yet. Run the mock collectors via the Macro Event Radar or wait for the scheduled job.
            </p>
          )}
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/company/${alert.company.ticker}`}
              className="block rounded-md border border-border p-3 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{alert.company.ticker}</span>
                <Badge variant="outline">{formatEnumLabel(alert.severity)} severity</Badge>
              </div>
              <p className="mt-1 text-sm">{alert.eventSummary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent impact analyses</CardTitle>
          <CardDescription>Latest research signals across all tracked companies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAnalyses.map((a) => (
            <Link
              key={a.id}
              href={`/analysis/${a.id}`}
              className="block rounded-md border border-border p-3 hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {a.company?.ticker ?? "—"}
                  {watchlistCompanyIds.has(a.companyId ?? "") && (
                    <Badge variant="outline" className="ml-2">
                      Watchlist
                    </Badge>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <ImpactBadge classification={a.classification} />
                  <PricedInBadge status={a.pricedInStatus} />
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.newsItem?.headline ?? a.macroEvent?.title ?? "Untitled event"}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
