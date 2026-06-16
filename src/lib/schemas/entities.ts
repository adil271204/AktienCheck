import { z } from "zod";
import {
  AnalysisTypeSchema,
  ExposureTypeSchema,
  ImpactDirectionSchema,
  MacroEventTypeSchema,
  TimeHorizonSchema,
  PricedInStatusSchema,
  SurpriseLevelSchema,
  ExpectationGapSchema,
  AlertSeveritySchema,
} from "./enums";

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string(),
  publishedAt: z.coerce.date(),
});
export type SourceDTO = z.infer<typeof SourceSchema>;

export const CompanySchema = z.object({
  id: z.string(),
  ticker: z.string(),
  name: z.string(),
  sector: z.string(),
  industry: z.string(),
  country: z.string(),
  description: z.string().nullable().optional(),
});
export type CompanyDTO = z.infer<typeof CompanySchema>;

export const AddWatchlistItemSchema = z.object({
  ticker: z.string().min(1).max(12),
});
export type AddWatchlistItemInput = z.infer<typeof AddWatchlistItemSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  headline: z.string(),
  body: z.string(),
  publishedAt: z.coerce.date(),
});
export type NewsItemDTO = z.infer<typeof NewsItemSchema>;

export const MacroEventSchema = z.object({
  id: z.string(),
  type: MacroEventTypeSchema,
  title: z.string(),
  description: z.string(),
  country: z.string(),
  occurredAt: z.coerce.date(),
});
export type MacroEventDTO = z.infer<typeof MacroEventSchema>;

export const SectorImpactSchema = z.object({
  id: z.string(),
  macroEventId: z.string(),
  sector: z.string(),
  industry: z.string().nullable().optional(),
  direction: ImpactDirectionSchema,
  effectType: z.enum(["direct", "indirect"]),
  explanation: z.string(),
});
export type SectorImpactDTO = z.infer<typeof SectorImpactSchema>;

export const CompanyImpactSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  sectorImpactId: z.string(),
  exposureType: ExposureTypeSchema,
  reasoning: z.string(),
});
export type CompanyImpactDTO = z.infer<typeof CompanyImpactSchema>;

// Priced-in assessment — required on every ImpactAnalysis
export const PricedInAssessmentSchema = z.object({
  status: PricedInStatusSchema,
  surprise_level: SurpriseLevelSchema,
  expectation_gap: ExpectationGapSchema,
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});
export type PricedInAssessmentDTO = z.infer<typeof PricedInAssessmentSchema>;

export const ImpactAnalysisSchema = z.object({
  id: z.string(),
  type: AnalysisTypeSchema,
  newsItemId: z.string().nullable().optional(),
  macroEventId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  classification: ImpactDirectionSchema,
  headline_impact_score: z.number().min(-1).max(1),
  adjusted_impact_score: z.number().min(-1).max(1),
  confidence_score: z.number().min(0).max(1),
  time_horizon: TimeHorizonSchema,
  reasoning: z.string(),
  risks: z.array(z.string()),
  priced_in_assessment: PricedInAssessmentSchema,
  sources: z.array(SourceSchema),
  createdAt: z.coerce.date(),
});
export type ImpactAnalysisDTO = z.infer<typeof ImpactAnalysisSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  impactAnalysisId: z.string(),
  companyId: z.string(),
  eventSummary: z.string(),
  affectedSectors: z.array(z.string()),
  possibleImpact: z.string(),
  severity: AlertSeveritySchema,
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
});
export type AlertDTO = z.infer<typeof AlertSchema>;

export const DISCLAIMER_TEXT =
  "This dashboard provides research-style impact analysis only. It is not financial advice, " +
  "not a trading recommendation, and does not predict future prices. Scores reflect a model's " +
  "estimate of directional research signal under uncertainty, not certainty of outcome. Always " +
  "verify against primary sources and consult a licensed financial advisor before making " +
  "investment decisions.";
