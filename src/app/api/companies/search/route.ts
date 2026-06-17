import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  q: z.string().max(100).optional().default(""),
  sector: z.string().max(100).optional().default(""),
  country: z.string().max(100).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

const USER_ID = "demo-user";

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 });
  }
  const { q, sector, country, limit } = parsed.data;

  // Build Prisma where clause — all filters are optional and case-insensitive
  const where: Parameters<typeof prisma.company.findMany>[0]["where"] = {};

  if (sector) {
    where.sector = { contains: sector, mode: "insensitive" };
  }
  if (country) {
    where.country = { contains: country, mode: "insensitive" };
  }
  if (q) {
    where.OR = [
      { ticker: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { sector: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [companies, watchlistItems] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { ticker: "asc" },
      take: limit,
    }),
    prisma.watchlistItem.findMany({
      where: { userId: USER_ID },
      select: { companyId: true },
    }),
  ]);

  const watchlistedIds = new Set(watchlistItems.map((w) => w.companyId));

  // Fetch latest analysis per company (one query, then group in JS)
  const companyIds = companies.map((c) => c.id);
  const latestAnalyses = await prisma.impactAnalysis.findMany({
    where: { companyId: { in: companyIds } },
    orderBy: { createdAt: "desc" },
    distinct: ["companyId"],
    select: {
      companyId: true,
      classification: true,
      headlineImpactScore: true,
      adjustedImpactScore: true,
      confidenceScore: true,
      pricedInStatus: true,
    },
  });

  const analysisMap = new Map(latestAnalyses.map((a) => [a.companyId, a]));

  const result = companies.map((c) => {
    const analysis = analysisMap.get(c.id);
    return {
      id: c.id,
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      industry: c.industry,
      country: c.country,
      description: c.description ?? null,
      isInWatchlist: watchlistedIds.has(c.id),
      latestAnalysis: analysis
        ? {
            sentiment: analysis.classification,
            headlineImpactScore: analysis.headlineImpactScore,
            adjustedImpactScore: analysis.adjustedImpactScore,
            confidence: analysis.confidenceScore,
            pricedInStatus: analysis.pricedInStatus,
          }
        : null,
    };
  });

  return NextResponse.json({ companies: result });
}
