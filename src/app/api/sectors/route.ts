import { NextResponse } from "next/server";
import { getAllEventTypes, getSectorImpactsForEventType } from "@/lib/services/sector-impact-engine";

/** Sector Impact Map — static event-type-to-sector mapping rules (Sector Impact Map page). */
export async function GET() {
  const eventTypes = getAllEventTypes();
  const map = eventTypes
    .map((type) => ({ eventType: type, sectorImpacts: getSectorImpactsForEventType(type) }))
    .filter((m) => m.sectorImpacts.length > 0);

  return NextResponse.json(map);
}
