import { EXPOSURE_OVERRIDES } from "../mock/exposure-overrides";
import type { ExposureType } from "../schemas/enums";

export interface ExposureCandidate {
  ticker: string;
  exposureType: ExposureType;
  reasoning: string;
}

interface CompanyLike {
  ticker: string;
  sector: string;
  industry: string;
}

/**
 * Company Exposure Engine — given a sector impact rule (sector/industry string)
 * and the known company universe, determines which companies are exposed and how.
 * Combines a direct sector/industry match with curated cross-sector overrides
 * (e.g. supply-chain dependency on an affected industry).
 */
export function findExposedCompanies(
  companies: CompanyLike[],
  targetSector: string,
  targetIndustry: string | null | undefined
): ExposureCandidate[] {
  const results: ExposureCandidate[] = [];
  const seen = new Set<string>();

  for (const company of companies) {
    const sectorMatch = company.sector.toLowerCase() === targetSector.toLowerCase();
    const industryMatch =
      !!targetIndustry && company.industry.toLowerCase().includes(targetIndustry.toLowerCase());

    if (sectorMatch || industryMatch) {
      results.push({
        ticker: company.ticker,
        exposureType: "DIRECT",
        reasoning: industryMatch
          ? `${company.ticker} operates directly within the "${company.industry}" industry, which is named as affected.`
          : `${company.ticker} operates in the "${company.sector}" sector, which is directly named as affected.`,
      });
      seen.add(company.ticker);
    }
  }

  const keyword = (targetIndustry ?? targetSector).toLowerCase();
  for (const override of EXPOSURE_OVERRIDES) {
    if (seen.has(override.ticker)) continue;
    if (override.sectorKeyword.toLowerCase().includes(keyword) || keyword.includes(override.sectorKeyword.toLowerCase())) {
      results.push({
        ticker: override.ticker,
        exposureType: override.exposureType,
        reasoning: override.reasoning,
      });
      seen.add(override.ticker);
    }
  }

  return results;
}
