import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAnalysisDTO } from "@/lib/serializers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const analysis = await prisma.impactAnalysis.findUnique({
    where: { id: params.id },
    include: {
      sources: { include: { source: true } },
      company: true,
      newsItem: true,
      macroEvent: { include: { sectorImpacts: true } },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...toAnalysisDTO(analysis),
    company: analysis.company,
    newsItem: analysis.newsItem,
    macroEvent: analysis.macroEvent,
  });
}
