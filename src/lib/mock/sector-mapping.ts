import type { MacroEventType, ImpactDirection } from "../schemas/enums";

export interface SectorMappingRule {
  sector: string;
  industry?: string;
  direction: ImpactDirection;
  effectType: "direct" | "indirect";
  explanation: string;
}

/**
 * Mock sector mapping table — maps a macro event type to the sectors/industries
 * it is hypothesized to affect, with a research-style explanation. A real system
 * would derive this dynamically; this MVP starts from a curated rule set.
 */
export const SECTOR_MAPPING: Record<MacroEventType, SectorMappingRule[]> = {
  CENTRAL_BANK_RATE_DECISION: [
    {
      sector: "Financials",
      industry: "Banking",
      direction: "MIXED",
      effectType: "direct",
      explanation:
        "Rate policy directly affects net interest margins for banks; the direction depends on the yield curve shape.",
    },
    {
      sector: "Real Estate",
      direction: "BEARISH",
      effectType: "direct",
      explanation:
        "Higher-for-longer rates raise financing costs for REITs and pressure property valuations.",
    },
    {
      sector: "Technology",
      industry: "Growth Tech",
      direction: "BEARISH",
      effectType: "indirect",
      explanation:
        "Higher discount rates disproportionately reduce present-value estimates of long-duration growth cash flows.",
    },
    {
      sector: "Consumer Discretionary",
      direction: "MIXED",
      effectType: "indirect",
      explanation:
        "Borrowing-sensitive consumer spending (autos, housing-linked goods) may soften as financing costs stay elevated.",
    },
  ],
  TARIFF: [
    {
      sector: "Industrials",
      direction: "MIXED",
      effectType: "direct",
      explanation:
        "Domestic producers of the tariffed goods may benefit from reduced import competition, while downstream manufacturers face higher input costs.",
    },
    {
      sector: "Consumer Discretionary",
      direction: "BEARISH",
      effectType: "indirect",
      explanation: "Higher input costs may be passed through to consumer prices, pressuring demand.",
    },
    {
      sector: "Materials",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Domestic producers of the tariffed raw material may see reduced foreign competition.",
    },
  ],
  EXPORT_RESTRICTION: [
    {
      sector: "Technology",
      industry: "Semiconductors",
      direction: "BEARISH",
      effectType: "direct",
      explanation:
        "Restrictions on equipment or chip exports directly limit addressable market and revenue for affected suppliers.",
    },
    {
      sector: "Technology",
      industry: "AI Hardware",
      direction: "BEARISH",
      effectType: "indirect",
      explanation:
        "AI hardware makers reliant on restricted components or markets may face supply or demand disruption.",
    },
    {
      sector: "Technology",
      industry: "Cloud Infrastructure",
      direction: "MIXED",
      effectType: "indirect",
      explanation:
        "Cloud providers may face higher hardware costs or slower capacity expansion, but reduced competition in some markets.",
    },
    {
      sector: "Industrials",
      industry: "Defense Tech",
      direction: "BULLISH",
      effectType: "indirect",
      explanation:
        "Restrictions framed around national security can correlate with increased domestic defense-tech investment.",
    },
  ],
  DEFENSE_SPENDING_INCREASE: [
    {
      sector: "Industrials",
      industry: "Defense & Aerospace",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Higher government defense budgets directly expand the order pipeline for defense contractors.",
    },
    {
      sector: "Industrials",
      industry: "Aerospace",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Aerospace suppliers may see indirect benefit through expanded military aircraft and component demand.",
    },
    {
      sector: "Technology",
      industry: "Cybersecurity",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Defense budgets increasingly allocate to cyber-defense capabilities.",
    },
    {
      sector: "Industrials",
      industry: "Industrial Manufacturing",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Broader industrial supply chains supporting defense production may see incremental demand.",
    },
  ],
  AI_REGULATION: [
    {
      sector: "Technology",
      industry: "AI / Software",
      direction: "MIXED",
      effectType: "direct",
      explanation:
        "Compliance costs may rise for frontier model developers, while incumbents with compliance infrastructure could gain relative advantage.",
    },
    {
      sector: "Technology",
      industry: "Cloud Infrastructure",
      direction: "NEUTRAL",
      effectType: "indirect",
      explanation: "Cloud providers hosting AI workloads face limited direct impact but may need to support compliance tooling.",
    },
  ],
  ENERGY_POLICY_CHANGE: [
    {
      sector: "Energy",
      industry: "Renewables",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Faster permitting and supportive policy directly benefit renewable project developers.",
    },
    {
      sector: "Energy",
      industry: "Oil & Gas",
      direction: "MIXED",
      effectType: "indirect",
      explanation: "Tighter emissions rules may raise compliance costs for legacy generation and fossil fuel producers.",
    },
    {
      sector: "Utilities",
      direction: "MIXED",
      effectType: "indirect",
      explanation: "Utilities may face both new investment opportunities and transition compliance costs.",
    },
  ],
  SEMICONDUCTOR_SUBSIDY: [
    {
      sector: "Technology",
      industry: "Semiconductor Equipment",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Subsidies for fab construction directly increase capital equipment demand.",
    },
    {
      sector: "Technology",
      industry: "Semiconductors",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Chipmakers expanding domestic capacity may benefit from grants and tax incentives.",
    },
    {
      sector: "Industrials",
      industry: "Industrial Manufacturing",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Construction and supply of fab facilities can benefit industrial suppliers indirectly.",
    },
  ],
  TRADE_AGREEMENT: [
    {
      sector: "Industrials",
      direction: "BULLISH",
      effectType: "direct",
      explanation: "Reduced trade barriers can directly expand addressable export markets for industrial goods.",
    },
    {
      sector: "Consumer Discretionary",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Lower input tariffs may reduce costs passed through the consumer goods supply chain.",
    },
  ],
  SANCTIONS: [
    {
      sector: "Energy",
      direction: "MIXED",
      effectType: "direct",
      explanation: "Sanctions on energy-producing nations can tighten global supply, with mixed effects across producers and consumers.",
    },
    {
      sector: "Financials",
      industry: "Banking",
      direction: "BEARISH",
      effectType: "indirect",
      explanation: "Banks with cross-border exposure may face compliance costs and counterparty risk.",
    },
  ],
  GEOPOLITICAL_CONFLICT: [
    {
      sector: "Energy",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Regional conflict risk can raise energy commodity price premiums via supply-disruption concerns.",
    },
    {
      sector: "Industrials",
      industry: "Defense & Aerospace",
      direction: "BULLISH",
      effectType: "indirect",
      explanation: "Escalating geopolitical tension often correlates with accelerated defense procurement.",
    },
    {
      sector: "Consumer Discretionary",
      direction: "BEARISH",
      effectType: "indirect",
      explanation: "Risk-off sentiment and higher energy costs can dampen discretionary consumer spending.",
    },
  ],
  INFLATION_REPORT: [
    {
      sector: "Financials",
      direction: "MIXED",
      effectType: "indirect",
      explanation: "Inflation surprises shift rate expectations, indirectly affecting bank margin outlooks.",
    },
    {
      sector: "Consumer Staples",
      direction: "NEUTRAL",
      effectType: "indirect",
      explanation: "Staples demand is relatively inelastic, limiting direct sensitivity to inflation prints.",
    },
  ],
  ELECTION_OUTCOME: [
    {
      sector: "Industrials",
      direction: "UNKNOWN",
      effectType: "indirect",
      explanation: "Policy direction following elections is uncertain until concrete legislative proposals emerge.",
    },
  ],
  OTHER: [],
};
