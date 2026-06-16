import { prisma } from "../src/lib/prisma";
import { ensureCompanies, runFullPipeline } from "../src/lib/services/pipeline";

const DEFAULT_WATCHLIST_TICKERS = ["AAPL", "NVDA", "TSLA", "ASML", "RHM"];

async function main() {
  console.log("Seeding companies...");
  await ensureCompanies();

  console.log("Seeding default watchlist...");
  for (const ticker of DEFAULT_WATCHLIST_TICKERS) {
    const company = await prisma.company.findUnique({ where: { ticker } });
    if (!company) continue;
    await prisma.watchlistItem.upsert({
      where: { userId_companyId: { userId: "demo-user", companyId: company.id } },
      update: {},
      create: { userId: "demo-user", companyId: company.id },
    });
  }

  console.log("Running mock news + macro event pipeline...");
  const result = await runFullPipeline();
  console.log(`Created ${result.news.created} news-based analyses, ${result.macro.created} macro-based analyses.`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
