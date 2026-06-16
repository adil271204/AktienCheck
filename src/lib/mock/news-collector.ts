import { makeMockSource } from "./sources";

// Each template carries a rough "raw signal" in [-1, 1] that the News Analyzer
// service will use as the basis for its headline impact score. This is mock
// data standing in for a future real news ingestion pipeline.
export interface MockNewsTemplate {
  ticker: string;
  headline: string;
  body: string;
  rawSignal: number;
  hoursAgo: number;
}

export const MOCK_NEWS_TEMPLATES: MockNewsTemplate[] = [
  {
    ticker: "AAPL",
    headline: "Apple reports record services revenue, iPhone sales miss estimates",
    body: "Apple's quarterly services revenue hit an all-time high, driven by App Store and subscription growth. However, iPhone unit sales came in below analyst estimates amid soft demand in China.",
    rawSignal: 0.1,
    hoursAgo: 6,
  },
  {
    ticker: "NVDA",
    headline: "NVIDIA unveils next-gen AI accelerator, claims 2x performance gain",
    body: "NVIDIA announced its next-generation data center GPU architecture, claiming roughly double the inference throughput of the prior generation. Several cloud providers confirmed early access programs.",
    rawSignal: 0.6,
    hoursAgo: 3,
  },
  {
    ticker: "NVDA",
    headline: "Reports suggest delays in NVIDIA's upcoming chip shipments",
    body: "Supply chain sources indicate that packaging capacity constraints may push back shipment timelines for NVIDIA's flagship AI chips by several weeks.",
    rawSignal: -0.4,
    hoursAgo: 30,
  },
  {
    ticker: "TSLA",
    headline: "Tesla delivery numbers fall short of consensus for second straight quarter",
    body: "Tesla reported vehicle deliveries below Wall Street consensus, citing increased competition in the EV market and softer demand in Europe.",
    rawSignal: -0.5,
    hoursAgo: 12,
  },
  {
    ticker: "TSLA",
    headline: "Tesla announces expanded energy storage deployment in Texas",
    body: "Tesla's energy division signed a new utility-scale battery storage agreement, expanding its footprint in the Texas grid services market.",
    rawSignal: 0.3,
    hoursAgo: 50,
  },
  {
    ticker: "MSFT",
    headline: "Microsoft Azure growth accelerates on AI workload demand",
    body: "Microsoft's cloud segment posted accelerating growth, with management attributing a meaningful contribution to AI-related compute workloads.",
    rawSignal: 0.5,
    hoursAgo: 8,
  },
  {
    ticker: "ASML",
    headline: "ASML order backlog narrows as chipmakers delay equipment purchases",
    body: "ASML disclosed a smaller-than-expected order backlog for advanced lithography systems, as several large chipmakers pushed out capacity expansion plans.",
    rawSignal: -0.3,
    hoursAgo: 20,
  },
  {
    ticker: "RHM",
    headline: "Rheinmetall secures multi-year armored vehicle contract",
    body: "Rheinmetall announced a new multi-year contract to supply armored vehicles to a European defense ministry, adding to its order backlog.",
    rawSignal: 0.55,
    hoursAgo: 5,
  },
  {
    ticker: "AIR",
    headline: "Airbus flags supply chain bottleneck affecting narrow-body output",
    body: "Airbus said engine and fuselage component shortages continue to constrain its ability to ramp narrow-body aircraft production toward stated targets.",
    rawSignal: -0.35,
    hoursAgo: 16,
  },
  {
    ticker: "JPM",
    headline: "JPMorgan posts in-line earnings, raises net interest income outlook",
    body: "JPMorgan's quarterly results matched analyst expectations, while management modestly raised its full-year net interest income guidance.",
    rawSignal: 0.15,
    hoursAgo: 40,
  },
  {
    ticker: "XOM",
    headline: "Exxon Mobil expands upstream investment amid steady crude prices",
    body: "Exxon Mobil announced incremental upstream capital investment, citing stable long-term demand assumptions for crude oil and natural gas.",
    rawSignal: 0.05,
    hoursAgo: 28,
  },
  {
    ticker: "DLR",
    headline: "Digital Realty signs large hyperscale leasing agreement",
    body: "Digital Realty announced a major new data center leasing agreement with a hyperscale cloud customer, adding to its development pipeline.",
    rawSignal: 0.4,
    hoursAgo: 14,
  },
];

export interface CollectedMockNews extends MockNewsTemplate {
  publishedAt: Date;
  source: ReturnType<typeof makeMockSource>;
}

/** Mock company news collector — stands in for a future real-time news ingestion job. */
export function collectMockNews(): CollectedMockNews[] {
  const now = Date.now();
  return MOCK_NEWS_TEMPLATES.map((tpl) => ({
    ...tpl,
    publishedAt: new Date(now - tpl.hoursAgo * 60 * 60 * 1000),
    source: makeMockSource(tpl.headline),
  }));
}
