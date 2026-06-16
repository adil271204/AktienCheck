import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for Render (and uptime monitors). Checks DB connectivity. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "connected", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
