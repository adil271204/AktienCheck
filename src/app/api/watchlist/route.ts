import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AddWatchlistItemSchema } from "@/lib/schemas";
import { analyzeCompanyOnWatchlistAdd } from "@/lib/services/analyze-company";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

export async function GET() {
  const items = await prisma.watchlistItem.findMany({
    where: { userId: USER_ID },
    include: { company: true },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json(items.map((i) => ({ id: i.id, addedAt: i.addedAt, company: i.company })));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AddWatchlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const ticker = parsed.data.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) {
    return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: { userId_companyId: { userId: USER_ID, companyId: company.id } },
    update: {},
    create: { userId: USER_ID, companyId: company.id },
    include: { company: true },
  });

  // Fire analysis in the background — do not await so the 201 response returns immediately.
  // The analysis is idempotent: if the company already has analyses it exits early.
  analyzeCompanyOnWatchlistAdd(company.id).catch((err) =>
    console.error(`[analyze-on-add] failed for ${ticker}:`, err)
  );

  return NextResponse.json({ ...item, analysisTriggered: true }, { status: 201 });
}
