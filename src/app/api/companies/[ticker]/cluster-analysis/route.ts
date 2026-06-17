import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNewsClusterAnalysis, type TimeWindow } from "@/lib/services/news-cluster-analysis";

export const dynamic = "force-dynamic";

const TimeWindowSchema = z.enum(["24h", "3d", "7d", "30d"]);

/** GET /api/companies/[ticker]/cluster-analysis?window=7d
 *  Returns the most recent stored cluster analysis for this company + window. */
export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });

  const rawWindow = req.nextUrl.searchParams.get("window") ?? "7d";
  const parsedWindow = TimeWindowSchema.safeParse(rawWindow);
  if (!parsedWindow.success) {
    return NextResponse.json({ error: "Invalid window. Use one of: 24h, 3d, 7d, 30d" }, { status: 400 });
  }
  const timeWindow = parsedWindow.data as TimeWindow;

  const analysis = await prisma.newsClusterAnalysis.findFirst({
    where: { companyId: company.id, timeWindow },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ analysis: analysis ?? null });
}

/** POST /api/companies/[ticker]/cluster-analysis
 *  Generates a fresh cluster analysis and persists it.
 *  Body: { window: "24h" | "3d" | "7d" | "30d" } */
export async function POST(
  req: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsedWindow = TimeWindowSchema.safeParse(body?.window ?? "7d");
  if (!parsedWindow.success) {
    return NextResponse.json({ error: "Invalid window. Use one of: 24h, 3d, 7d, 30d" }, { status: 400 });
  }
  const timeWindow = parsedWindow.data as TimeWindow;

  const analysis = await generateNewsClusterAnalysis({ companyId: company.id, timeWindow });
  return NextResponse.json({ analysis }, { status: 201 });
}
