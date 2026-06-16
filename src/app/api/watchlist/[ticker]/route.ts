import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

export async function DELETE(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) {
    return NextResponse.json({ error: `Unknown ticker "${ticker}"` }, { status: 404 });
  }

  await prisma.watchlistItem.deleteMany({ where: { userId: USER_ID, companyId: company.id } });
  return NextResponse.json({ ok: true });
}
