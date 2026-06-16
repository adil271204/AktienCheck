import { makeMockSource } from "./sources";
import type { MacroEventType } from "../schemas/enums";

export interface MockMacroEventTemplate {
  type: MacroEventType;
  title: string;
  description: string;
  country: string;
  rawSignal: number; // rough directional signal in [-1, 1] for the overall market narrative
  hoursAgo: number;
}

export const MOCK_MACRO_EVENT_TEMPLATES: MockMacroEventTemplate[] = [
  {
    type: "CENTRAL_BANK_RATE_DECISION",
    title: "Federal Reserve holds rates steady, signals cautious outlook",
    description:
      "The Federal Reserve kept its benchmark rate unchanged, citing mixed inflation data and a resilient labor market. Officials signaled no urgency to cut rates in the near term.",
    country: "United States",
    rawSignal: -0.1,
    hoursAgo: 10,
  },
  {
    type: "EXPORT_RESTRICTION",
    title: "New export controls announced on advanced semiconductor equipment",
    description:
      "Regulators announced expanded export restrictions on advanced lithography and chip-design tools to certain destination countries, citing national security concerns.",
    country: "United States",
    rawSignal: -0.4,
    hoursAgo: 18,
  },
  {
    type: "DEFENSE_SPENDING_INCREASE",
    title: "European bloc agrees to multi-year defense spending increase",
    description:
      "Member states agreed to raise collective defense spending targets over the next several years, citing regional security concerns.",
    country: "Germany",
    rawSignal: 0.5,
    hoursAgo: 22,
  },
  {
    type: "AI_REGULATION",
    title: "Regulators propose new compliance requirements for frontier AI models",
    description:
      "A proposed regulatory framework would require additional safety testing and disclosure for large-scale AI model deployments above a compute threshold.",
    country: "European Union",
    rawSignal: -0.2,
    hoursAgo: 9,
  },
  {
    type: "SEMICONDUCTOR_SUBSIDY",
    title: "Government unveils expanded semiconductor manufacturing subsidy program",
    description:
      "A new subsidy package aims to incentivize domestic semiconductor fabrication capacity, including grants and tax credits for equipment purchases.",
    country: "United States",
    rawSignal: 0.45,
    hoursAgo: 33,
  },
  {
    type: "ENERGY_POLICY_CHANGE",
    title: "Energy ministry announces accelerated renewable permitting rules",
    description:
      "New permitting rules aim to shorten approval timelines for renewable energy projects, while signaling tighter emissions requirements for legacy generation.",
    country: "Germany",
    rawSignal: 0.15,
    hoursAgo: 26,
  },
  {
    type: "TARIFF",
    title: "New tariffs proposed on imported steel and aluminum",
    description:
      "Trade officials proposed new tariffs on select imported metals, citing concerns about domestic industry competitiveness.",
    country: "United States",
    rawSignal: -0.25,
    hoursAgo: 14,
  },
];

export interface CollectedMockMacroEvent extends MockMacroEventTemplate {
  occurredAt: Date;
  source: ReturnType<typeof makeMockSource>;
}

/** Mock macro / country event collector — stands in for a future real-time macro data feed. */
export function collectMockMacroEvents(): CollectedMockMacroEvent[] {
  const now = Date.now();
  return MOCK_MACRO_EVENT_TEMPLATES.map((tpl) => ({
    ...tpl,
    occurredAt: new Date(now - tpl.hoursAgo * 60 * 60 * 1000),
    source: makeMockSource(tpl.title),
  }));
}
