// Mock company universe — seeds the Company table.
export interface MockCompany {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  description: string;
}

export const MOCK_COMPANIES: MockCompany[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    country: "United States",
    description: "Designs and sells consumer hardware, software, and services.",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    industry: "Cloud Infrastructure & Software",
    country: "United States",
    description: "Cloud computing, enterprise software, and AI platforms.",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors / AI Hardware",
    country: "United States",
    description: "Designs GPUs and AI accelerator chips.",
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Consumer Discretionary",
    industry: "Electric Vehicles",
    country: "United States",
    description: "Electric vehicles, energy storage, and autonomy systems.",
  },
  {
    ticker: "ASML",
    name: "ASML Holding N.V.",
    sector: "Technology",
    industry: "Semiconductor Equipment",
    country: "Netherlands",
    description: "Manufactures photolithography systems for chip fabrication.",
  },
  {
    ticker: "RHM",
    name: "Rheinmetall AG",
    sector: "Industrials",
    industry: "Defense & Aerospace",
    country: "Germany",
    description: "Defense technology, munitions, and military vehicle systems.",
  },
  {
    ticker: "AIR",
    name: "Airbus SE",
    sector: "Industrials",
    industry: "Aerospace & Defense",
    country: "France",
    description: "Commercial aircraft, defense, and space systems manufacturer.",
  },
  {
    ticker: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financials",
    industry: "Banking",
    country: "United States",
    description: "Global investment bank and financial services firm.",
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil Corporation",
    sector: "Energy",
    industry: "Oil & Gas",
    country: "United States",
    description: "Integrated oil and gas exploration, production, and refining.",
  },
  {
    ticker: "DLR",
    name: "Digital Realty Trust, Inc.",
    sector: "Real Estate",
    industry: "Data Center REIT",
    country: "United States",
    description: "Owns and operates data center infrastructure globally.",
  },
];
