import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAnalysisDTO } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await prisma.newsItem.findMany({
    include: {
      company: true,
      source: true,
      impactAnalyses: { include: { sources: { include: { source: true } } } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    news.map((n) => ({
      id: n.id,
      headline: n.headline,
      body: n.body,
      publishedAt: n.publishedAt,
      company: n.company,
      source: n.source,
      analysis: n.impactAnalyses[0] ? toAnalysisDTO(n.impactAnalyses[0]) : null,
    }))
  );
}
