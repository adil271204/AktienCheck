import type { ExposureType } from "../schemas/enums";

/**
 * Mock company exposure overrides — captures exposure that isn't a simple
 * sector/industry string match (e.g. a company sourcing critical inputs from
 * an affected industry). Keyed by ticker. The Exposure Engine combines these
 * with direct sector matches from the Company table.
 */
export interface ExposureOverride {
  ticker: string;
  sectorKeyword: string; // matches against SectorImpact.sector or .industry (case-insensitive substring)
  exposureType: ExposureType;
  reasoning: string;
}

export const EXPOSURE_OVERRIDES: ExposureOverride[] = [
  {
    ticker: "NVDA",
    sectorKeyword: "Semiconductor Equipment",
    exposureType: "SUPPLY_CHAIN",
    reasoning:
      "NVIDIA depends on advanced lithography equipment suppliers to produce next-generation chips; equipment-side disruption can delay NVIDIA's own roadmap.",
  },
  {
    ticker: "AAPL",
    sectorKeyword: "Semiconductors",
    exposureType: "SUPPLY_CHAIN",
    reasoning:
      "Apple sources advanced chips from contract foundries; semiconductor supply or export disruption can affect device production schedules.",
  },
  {
    ticker: "MSFT",
    sectorKeyword: "AI Hardware",
    exposureType: "COST",
    reasoning:
      "Microsoft's data center buildout depends on AI accelerator supply; hardware cost or availability changes affect Azure capex efficiency.",
  },
  {
    ticker: "AIR",
    sectorKeyword: "Defense & Aerospace",
    exposureType: "DEMAND",
    reasoning:
      "Airbus's defense unit can see demand effects from shifts in European defense procurement priorities.",
  },
  {
    ticker: "XOM",
    sectorKeyword: "Oil & Gas",
    exposureType: "REGULATORY",
    reasoning:
      "Exxon Mobil's upstream and refining operations are directly subject to energy and emissions policy changes.",
  },
  {
    ticker: "DLR",
    sectorKeyword: "Cloud Infrastructure",
    exposureType: "DEMAND",
    reasoning:
      "Digital Realty's data center leasing demand is tied to hyperscaler and AI infrastructure capacity expansion plans.",
  },
];
