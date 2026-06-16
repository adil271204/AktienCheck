import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactBadge } from "@/components/shared/impact-badge";
import { PricedInBadge } from "@/components/shared/priced-in-badge";
import { formatDate, formatEnumLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) notFound();

  const [news, analyses, companyImpacts] = await Promise.all([
    prisma.newsItem.findMany({ where: { companyId: company.id }, include: { source: true }, orderBy: { publishedAt: "desc" } }),
    prisma.impactAnalysis.findMany({
      where: { companyId: company.id },
      include: { macroEvent: true, newsItem: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.companyImpact.findMany({
      where: { companyId: company.id },
      include: { sectorImpact: { include: { macroEvent: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {company.name} ({company.ticker})
              </CardTitle>
              <CardDescription>
                {company.sector} · {company.industry} · {company.country}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{company.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact analyses</CardTitle>
          <CardDescription>Research signals derived from company news and macro events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analyses.length === 0 && <p className="text-sm text-muted-foreground">No analyses yet.</p>}
          {analyses.map((a) => (
            <Link key={a.id} href={`/analysis/${a.id}`} className="block rounded-md border border-border p-3 hover:bg-muted/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{a.newsItem?.headline ?? a.macroEvent?.title}</span>
                <div className="flex items-center gap-2">
                  <ImpactBadge classification={a.classification} />
                  <PricedInBadge status={a.pricedInStatus} />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent news</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {news.length === 0 && <p className="text-sm text-muted-foreground">No mock news collected yet.</p>}
          {news.map((n) => (
            <div key={n.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">{n.headline}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(n.publishedAt)}</span>
                {n.source && (
                  <a href={n.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {n.source.publisher} source
                  </a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exposure mapping</CardTitle>
          <CardDescription>How macro events translate into exposure for this company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyImpacts.length === 0 && <p className="text-sm text-muted-foreground">No exposure mappings yet.</p>}
          {companyImpacts.map((ci) => (
            <div key={ci.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{ci.sectorImpact.macroEvent.title}</span>
                <Badge variant="outline">{formatEnumLabel(ci.exposureType)} exposure</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{ci.reasoning}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
