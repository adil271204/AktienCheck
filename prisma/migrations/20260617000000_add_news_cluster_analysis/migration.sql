-- CreateTable
CREATE TABLE "NewsClusterAnalysis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "clusterTitle" TEXT NOT NULL,
    "overallSentiment" TEXT NOT NULL,
    "headlineImpactScore" DOUBLE PRECISION NOT NULL,
    "adjustedImpactScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "selectedNewsItemIds" JSONB NOT NULL,
    "dominantDrivers" JSONB NOT NULL,
    "interactionEffects" JSONB NOT NULL,
    "mostImportantNews" JSONB NOT NULL,
    "futureWatchItems" JSONB NOT NULL,
    "pricedInStatus" TEXT NOT NULL,
    "surpriseLevel" TEXT NOT NULL,
    "expectationGap" TEXT NOT NULL,
    "pricedInReasoning" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "risks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsClusterAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsClusterAnalysis_companyId_idx" ON "NewsClusterAnalysis"("companyId");

-- CreateIndex
CREATE INDEX "NewsClusterAnalysis_companyId_timeWindow_idx" ON "NewsClusterAnalysis"("companyId", "timeWindow");

-- AddForeignKey
ALTER TABLE "NewsClusterAnalysis" ADD CONSTRAINT "NewsClusterAnalysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
