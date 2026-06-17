import { prisma } from "@/lib/prisma";
import { Disclaimer } from "@/components/shared/disclaimer";
import { CompaniesClient } from "@/components/companies/companies-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Companies — Market Event Impact Intelligence" };

const USER_ID = "demo-user";

export default async function CompaniesPage() {
  const [companies, watchlistItems, analyses] = await Promise.all([
    prisma.company.findMany({ orderBy: { ticker: "asc" } }),
    prisma.watchlistItem.findMany({ where: { userId: USER_ID }, select: { companyId: true } }),
    prisma.impactAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      distinct: ["companyId"],
      select: {
        companyId: true,
        classification: true,
        headlineImpactScore: true,
        adjustedImpactScore: true,
        confidenceScore: true,
        pricedInStatus: true,
      },
    }),
  ]);

  const watchlistedIds = new Set(watchlistItems.map((w) => w.companyId));
  const analysisMap = new Map(analyses.map((a) => [a.companyId, a]));

  const initialCompanies = companies.map((c) => {
    const analysis = analysisMap.get(c.id);
    return {
      id: c.id,
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      industry: c.industry,
      country: c.country,
      description: c.description ?? null,
      isInWatchlist: watchlistedIds.has(c.id),
      latestAnalysis: analysis
        ? {
            sentiment: analysis.classification,
            headlineImpactScore: analysis.headlineImpactScore,
            adjustedImpactScore: analysis.adjustedImpactScore,
            confidence: analysis.confidenceScore,
            pricedInStatus: analysis.pricedInStatus,
          }
        : null,
    };
  });

  // Unique sorted lists for filter dropdowns
  const sectors = [...new Set(companies.map((c) => c.sector))].sort();
  const countries = [...new Set(companies.map((c) => c.country))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and filter the company universe. Add companies to your watchlist to receive impact alerts.
        </p>
      </div>

      <Disclaimer compact />

      <CompaniesClient
        initialCompanies={initialCompanies}
        sectors={sectors}
        countries={countries}
      />
    </div>
  );
}
