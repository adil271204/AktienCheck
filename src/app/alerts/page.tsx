import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { formatDate, formatEnumLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITY_VARIANT: Record<string, "bearish" | "mixed" | "neutral"> = {
  HIGH: "bearish",
  MEDIUM: "mixed",
  LOW: "neutral",
};

export default async function AlertsPage() {
  const alerts = await prisma.alert.findMany({
    include: { company: true, impactAnalysis: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Disclaimer compact />
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>
            Generated when a macro event or company news item may affect a watchlist company. Research signal only.
          </CardDescription>
        </CardHeader>
      </Card>

      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">
                <Link href={`/company/${alert.company.ticker}`} className="text-primary hover:underline">
                  {alert.company.ticker}
                </Link>
              </CardTitle>
              <Badge variant={SEVERITY_VARIANT[alert.severity] ?? "neutral"}>
                {formatEnumLabel(alert.severity)} severity
              </Badge>
            </div>
            <CardDescription>{formatDate(alert.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium">{alert.eventSummary}</p>
            <p className="text-sm text-muted-foreground">{alert.possibleImpact}</p>
            <div className="flex flex-wrap gap-1.5">
              {alert.affectedSectors.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
            <Link href={`/analysis/${alert.impactAnalysisId}`} className="inline-block text-xs text-primary hover:underline">
              View full analysis →
            </Link>
          </CardContent>
        </Card>
      ))}

      {alerts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No alerts yet. Alerts are generated automatically for watchlisted companies when relevant news or macro
            events are detected.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
