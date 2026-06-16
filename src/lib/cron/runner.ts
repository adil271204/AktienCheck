import cron from "node-cron";
import { prisma } from "../prisma";
import { ensureCompanies, runFullPipeline } from "../services/pipeline";

const SCHEDULE = process.env.CRON_SCHEDULE ?? "*/15 * * * *"; // every 15 minutes by default

async function tick() {
  const startedAt = new Date().toISOString();
  try {
    await ensureCompanies();
    const result = await runFullPipeline();
    console.log(
      `[cron ${startedAt}] pipeline run complete — news: ${result.news.created}, macro: ${result.macro.created}`
    );
  } catch (err) {
    console.error(`[cron ${startedAt}] pipeline run failed:`, err);
  }
}

/**
 * Standalone scheduled job process (`npm run cron`). Runs the mock collector +
 * analysis pipeline on a cron schedule, independent of the Next.js web process.
 * Deploy as a separate worker/background service against the same DATABASE_URL.
 */
function main() {
  console.log(`Starting cron runner with schedule "${SCHEDULE}"`);
  // Run once immediately on startup, then on schedule.
  tick();
  cron.schedule(SCHEDULE, tick);
}

main();

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
