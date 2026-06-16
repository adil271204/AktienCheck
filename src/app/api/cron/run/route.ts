import { NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/services/pipeline";

/** Manually triggers the mock collector + analysis pipeline (same job node-cron runs on a schedule). */
export async function POST() {
  const result = await runFullPipeline();
  return NextResponse.json({ ok: true, result });
}
