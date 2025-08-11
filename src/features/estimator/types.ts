export type Bucket = "B13" | "B46" | "B710" | "B1120" | "B21P";

export interface RawRow {
  [key: string]: any;
}

export interface KeywordRow {
  keyword: string;
  position: number; // 1-100
  volume: number; // > 0
  url?: string;
  country?: string;
  device?: string;
  intent?: string;
  kd?: number; // keyword difficulty
  serpFeatures?: string; // raw string
  cohort?: string; // assigned later
}

export interface ColumnMapping {
  keyword: string;
  position: string;
  volume: string;
  url?: string;
  country?: string;
  device?: string;
  intent?: string;
  kd?: string;
  serpFeatures?: string;
}

export interface CTRBuckets {
  B13: number; B46: number; B710: number; B1120: number; B21P: number;
}

export type EngineMode = "heuristic" | "score";

export interface CohortRule {
  name: string;
  color: string;
  conditions: {
    positionRange?: [number, number];
    kdRange?: [number, number];
    serpIncludesAny?: string[]; // if starts with '!' means NOT contains
    intentEqualsAny?: string[];
    countryIn?: string[];
    deviceIn?: string[];
  };
  probs: { B13: number; B46: number; B710: number; stay: number };
}

export interface ScoreWeights {
  positionGap: number;
  keywordDifficulty: number;
  serpComplexity: number;
  contentMatch: number;
  linkGap: number;
  base_stay: number;
}

export interface FiltersState {
    brandOn: boolean;
    brandMode: "include" | "exclude";
    brandTerms: string;
    minVolume: number;
    countryIn: string[];
    deviceIn: string[];
    urlMode: "contains" | "exact";
    urlValue: string;
  }

export interface SettingsState {
  ctr: CTRBuckets;
  upliftPP: number;
  engine: EngineMode;
  cohorts: CohortRule[];
  weights: ScoreWeights;
  capacityCapPct: number; // 0-100
  effort: "low" | "medium" | "high";
  monteCarlo: boolean;
  iterations: number;
  clickToSession: number;
}

export interface RowDerived {
  baselineBucket: Bucket;
  baselineCTR: number;
  probs: { B13: number; B46: number; B710: number; B1120: number; stay: number };
  expectedCTR: number;
  baselineClicks: number;
  estimatedClicks: number;
  incrementalClicks: number;
  expectedBucket?: Bucket;
  expectedPosition?: number;
}

export interface TableRow extends KeywordRow, RowDerived {}

export interface Totals {
  baselineClicks: number;
  estimatedClicks: number;
  incrementalClicks: number;
  keywords: number;
  improvingShare: number; // 0-1
}

export interface MCStats {
  median: number; p25: number; p75: number;
}
