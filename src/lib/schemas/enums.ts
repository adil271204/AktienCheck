import { z } from "zod";

export const MacroEventTypeSchema = z.enum([
  "CENTRAL_BANK_RATE_DECISION",
  "TARIFF",
  "EXPORT_RESTRICTION",
  "DEFENSE_SPENDING_INCREASE",
  "AI_REGULATION",
  "ENERGY_POLICY_CHANGE",
  "SEMICONDUCTOR_SUBSIDY",
  "TRADE_AGREEMENT",
  "SANCTIONS",
  "GEOPOLITICAL_CONFLICT",
  "INFLATION_REPORT",
  "ELECTION_OUTCOME",
  "OTHER",
]);
export type MacroEventType = z.infer<typeof MacroEventTypeSchema>;

export const ImpactDirectionSchema = z.enum([
  "BULLISH",
  "BEARISH",
  "NEUTRAL",
  "MIXED",
  "UNKNOWN",
]);
export type ImpactDirection = z.infer<typeof ImpactDirectionSchema>;

export const ExposureTypeSchema = z.enum([
  "DIRECT",
  "INDIRECT",
  "SUPPLY_CHAIN",
  "REGULATORY",
  "DEMAND",
  "COST",
]);
export type ExposureType = z.infer<typeof ExposureTypeSchema>;

export const AnalysisTypeSchema = z.enum(["COMPANY_NEWS", "MACRO_EVENT"]);
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

export const TimeHorizonSchema = z.enum([
  "INTRADAY",
  "SHORT_TERM",
  "MEDIUM_TERM",
  "LONG_TERM",
  "UNKNOWN",
]);
export type TimeHorizon = z.infer<typeof TimeHorizonSchema>;

export const PricedInStatusSchema = z.enum([
  "NOT_PRICED_IN",
  "PARTIALLY_PRICED_IN",
  "MOSTLY_PRICED_IN",
  "UNKNOWN",
]);
export type PricedInStatus = z.infer<typeof PricedInStatusSchema>;

export const SurpriseLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type SurpriseLevel = z.infer<typeof SurpriseLevelSchema>;

export const ExpectationGapSchema = z.enum([
  "BETTER_THAN_EXPECTED",
  "IN_LINE",
  "WORSE_THAN_EXPECTED",
  "UNKNOWN",
]);
export type ExpectationGap = z.infer<typeof ExpectationGapSchema>;

export const AlertSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
