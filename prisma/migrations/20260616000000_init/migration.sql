-- CreateEnum
CREATE TYPE "MacroEventType" AS ENUM ('CENTRAL_BANK_RATE_DECISION', 'TARIFF', 'EXPORT_RESTRICTION', 'DEFENSE_SPENDING_INCREASE', 'AI_REGULATION', 'ENERGY_POLICY_CHANGE', 'SEMICONDUCTOR_SUBSIDY', 'TRADE_AGREEMENT', 'SANCTIONS', 'GEOPOLITICAL_CONFLICT', 'INFLATION_REPORT', 'ELECTION_OUTCOME', 'OTHER');

-- CreateEnum
CREATE TYPE "ImpactDirection" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ExposureType" AS ENUM ('DIRECT', 'INDIRECT', 'SUPPLY_CHAIN', 'REGULATORY', 'DEMAND', 'COST');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('COMPANY_NEWS', 'MACRO_EVENT');

-- CreateEnum
CREATE TYPE "TimeHorizon" AS ENUM ('INTRADAY', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PricedInStatus" AS ENUM ('NOT_PRICED_IN', 'PARTIALLY_PRICED_IN', 'MOSTLY_PRICED_IN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SurpriseLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ExpectationGap" AS ENUM ('BETTER_THAN_EXPECTED', 'IN_LINE', 'WORSE_THAN_EXPECTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'demo-user',
    "companyId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroEvent" (
    "id" TEXT NOT NULL,
    "type" "MacroEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorImpact" (
    "id" TEXT NOT NULL,
    "macroEventId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT,
    "direction" "ImpactDirection" NOT NULL,
    "effectType" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectorImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyImpact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectorImpactId" TEXT NOT NULL,
    "exposureType" "ExposureType" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAnalysis" (
    "id" TEXT NOT NULL,
    "type" "AnalysisType" NOT NULL,
    "newsItemId" TEXT,
    "macroEventId" TEXT,
    "companyId" TEXT,
    "classification" "ImpactDirection" NOT NULL,
    "headlineImpactScore" DOUBLE PRECISION NOT NULL,
    "adjustedImpactScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "timeHorizon" "TimeHorizon" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "risks" TEXT[],
    "pricedInStatus" "PricedInStatus" NOT NULL,
    "pricedInSurpriseLevel" "SurpriseLevel" NOT NULL,
    "pricedInExpectationGap" "ExpectationGap" NOT NULL,
    "pricedInReasoning" TEXT NOT NULL,
    "pricedInConfidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSource" (
    "id" TEXT NOT NULL,
    "impactAnalysisId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "AnalysisSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "impactAnalysisId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "eventSummary" TEXT NOT NULL,
    "affectedSectors" TEXT[],
    "possibleImpact" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ticker_key" ON "Company"("ticker");

-- CreateIndex
CREATE INDEX "Company_sector_idx" ON "Company"("sector");

-- CreateIndex
CREATE INDEX "Company_industry_idx" ON "Company"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_companyId_key" ON "WatchlistItem"("userId", "companyId");

-- CreateIndex
CREATE INDEX "NewsItem_companyId_idx" ON "NewsItem"("companyId");

-- CreateIndex
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");

-- CreateIndex
CREATE INDEX "MacroEvent_type_idx" ON "MacroEvent"("type");

-- CreateIndex
CREATE INDEX "MacroEvent_occurredAt_idx" ON "MacroEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "SectorImpact_sector_idx" ON "SectorImpact"("sector");

-- CreateIndex
CREATE INDEX "SectorImpact_macroEventId_idx" ON "SectorImpact"("macroEventId");

-- CreateIndex
CREATE INDEX "CompanyImpact_companyId_idx" ON "CompanyImpact"("companyId");

-- CreateIndex
CREATE INDEX "CompanyImpact_sectorImpactId_idx" ON "CompanyImpact"("sectorImpactId");

-- CreateIndex
CREATE INDEX "ImpactAnalysis_newsItemId_idx" ON "ImpactAnalysis"("newsItemId");

-- CreateIndex
CREATE INDEX "ImpactAnalysis_macroEventId_idx" ON "ImpactAnalysis"("macroEventId");

-- CreateIndex
CREATE INDEX "ImpactAnalysis_companyId_idx" ON "ImpactAnalysis"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisSource_impactAnalysisId_sourceId_key" ON "AnalysisSource"("impactAnalysisId", "sourceId");

-- CreateIndex
CREATE INDEX "Alert_companyId_idx" ON "Alert"("companyId");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacroEvent" ADD CONSTRAINT "MacroEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorImpact" ADD CONSTRAINT "SectorImpact_macroEventId_fkey" FOREIGN KEY ("macroEventId") REFERENCES "MacroEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyImpact" ADD CONSTRAINT "CompanyImpact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyImpact" ADD CONSTRAINT "CompanyImpact_sectorImpactId_fkey" FOREIGN KEY ("sectorImpactId") REFERENCES "SectorImpact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysis" ADD CONSTRAINT "ImpactAnalysis_newsItemId_fkey" FOREIGN KEY ("newsItemId") REFERENCES "NewsItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysis" ADD CONSTRAINT "ImpactAnalysis_macroEventId_fkey" FOREIGN KEY ("macroEventId") REFERENCES "MacroEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysis" ADD CONSTRAINT "ImpactAnalysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisSource" ADD CONSTRAINT "AnalysisSource_impactAnalysisId_fkey" FOREIGN KEY ("impactAnalysisId") REFERENCES "ImpactAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisSource" ADD CONSTRAINT "AnalysisSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_impactAnalysisId_fkey" FOREIGN KEY ("impactAnalysisId") REFERENCES "ImpactAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

