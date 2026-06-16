import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await prisma.macroEvent.findMany({
    include: {
      source: true,
      sectorImpacts: {
        include: {
          companyImpacts: { include: { company: true } },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  return NextResponse.json(events);
}
