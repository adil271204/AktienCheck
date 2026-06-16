import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAnalysisDTO } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) {
    return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });
  }

  const [news, analyses, companyImpacts, isWatchlisted] = await Promise.all([
    prisma.newsItem.findMany({
      where: { companyId: company.id },
      include: { source: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.impactAnalysis.findMany({
      where: { companyId: company.id },
      include: { sources: { include: { source: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.companyImpact.findMany({
      where: { companyId: company.id },
      include: { sectorImpact: { include: { macroEvent: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.watchlistItem.findFirst({ where: { userId: "demo-user", companyId: company.id } }),
  ]);

  return NextResponse.json({
    company,
    isWatchlisted: !!isWatchlisted,
    news,
    analyses: analyses.map(toAnalysisDTO),
    companyImpacts,
  });
}
