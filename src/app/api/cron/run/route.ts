import { NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/services/pipeline";

export const dynamic = "force-dynamic";

/** Manually triggers the mock collector + analysis pipeline (same job node-cron runs on a schedule). */
export async function POST() {
  const result = await runFullPipeline();
  return NextResponse.json({ ok: true, result });
}
