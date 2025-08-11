import { CTRBuckets, CohortRule, ScoreWeights } from "./types";

export const DEFAULT_CTR: CTRBuckets = {
  B13: 22,
  B46: 8,
  B710: 4,
  B1120: 1.2,
  B21P: 0.5,
};

export const DEFAULT_COHORTS: CohortRule[] = [
  {
    name: "Cohort A — quick wins",
    color: "violet",
    conditions: {
      positionRange: [4, 10],
      kdRange: [0, 40],
      serpIncludesAny: ["!Shopping", "!Map"],
    },
    probs: { B13: 0.25, B46: 0.5, B710: 0.2, stay: 0.05 },
  },
  {
    name: "Cohort B — mid",
    color: "sky",
    conditions: {
      positionRange: [11, 20],
    },
    probs: { B13: 0.1, B46: 0.35, B710: 0.35, stay: 0.2 },
  },
  {
    name: "Cohort C — long shot",
    color: "amber",
    conditions: {
      positionRange: [21, 100],
      kdRange: [61, 100],
      serpIncludesAny: ["Shopping"],
    },
    probs: { B13: 0.03, B46: 0.12, B710: 0.25, stay: 0.6 },
  },
];

export const DEFAULT_WEIGHTS: ScoreWeights = {
  w1: 0.35,
  w2: 0.25,
  w3: 0.3,
  w4: 0.2,
  w5: 0.25,
  base_stay: 0.15,
};
