import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const alerts = await prisma.alert.findMany({
    include: { company: true, impactAnalysis: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(alerts);
}
