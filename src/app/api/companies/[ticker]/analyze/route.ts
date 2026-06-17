import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeCompanyOnWatchlistAdd } from "@/lib/services/analyze-company";

export const dynamic = "force-dynamic";

/**
 * POST /api/companies/[ticker]/analyze
 * Manually triggers an initial impact analysis for a company.
 * Idempotent — if analyses already exist the service returns { skipped: true }.
 */
export async function POST(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) {
    return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });
  }

  const result = await analyzeCompanyOnWatchlistAdd(company.id);
  return NextResponse.json({ ok: true, ticker, ...result });
}
