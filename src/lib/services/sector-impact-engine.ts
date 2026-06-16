import { SECTOR_MAPPING, type SectorMappingRule } from "../mock/sector-mapping";
import type { MacroEventType } from "../schemas/enums";

/** Sector Impact Map service — maps an event type to its hypothesized affected sectors. */
export function getSectorImpactsForEventType(type: MacroEventType): SectorMappingRule[] {
  return SECTOR_MAPPING[type] ?? [];
}

export function getAllEventTypes(): MacroEventType[] {
  return Object.keys(SECTOR_MAPPING) as MacroEventType[];
}
