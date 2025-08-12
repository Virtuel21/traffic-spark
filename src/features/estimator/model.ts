import { DEFAULT_CTR } from "./constants";
import { Bucket, CTRBuckets, CohortRule, KeywordRow, ScoreWeights, SettingsState, TableRow, Totals } from "./types";

export const BUCKET_CENTERS: Record<Exclude<Bucket, "B21P">, number> = { B13: 2, B46: 5, B710: 8, B1120: 15 };

export function bucketForPosition(pos: number): Bucket {
  if (pos <= 3) return "B13";
  if (pos <= 6) return "B46";
  if (pos <= 10) return "B710";
  if (pos <= 20) return "B1120";
  return "B21P";
}

export function baselineCTRForBucket(bucket: Bucket, ctr: CTRBuckets = DEFAULT_CTR) {
  return ctr[bucket] ?? ctr.B21P;
}

export function assignCohort(row: KeywordRow, cohorts: CohortRule[]): { cohort: string; rule?: CohortRule } {
  for (const c of cohorts) {
    const cond = c.conditions;
    let ok = true;
    if (cond.positionRange) ok &&= row.position >= cond.positionRange[0] && row.position <= cond.positionRange[1];
    if (cond.kdRange && row.kd != null) ok &&= row.kd >= cond.kdRange[0] && row.kd <= cond.kdRange[1];
    if (cond.intentEqualsAny && cond.intentEqualsAny.length) ok &&= cond.intentEqualsAny.some((v) => eq(row.intent, v));
    if (cond.countryIn && cond.countryIn.length) ok &&= cond.countryIn.includes(String(row.country ?? ""));
    if (cond.deviceIn && cond.deviceIn.length) ok &&= cond.deviceIn.includes(String(row.device ?? ""));
    if (cond.serpIncludesAny && cond.serpIncludesAny.length) {
      const sf = (row.serpFeatures ?? "").toLowerCase();
      ok &&= cond.serpIncludesAny.some((s) =>
        s.startsWith("!") ? !sf.includes(s.slice(1).toLowerCase()) : sf.includes(s.toLowerCase())
      );
    }
    if (ok) return { cohort: c.name, rule: c };
  }
  return { cohort: "Cohort B — mid" };
}

export function heuristicProbs(rule?: CohortRule) {
  const p = rule?.probs ?? { B13: 0.1, B46: 0.35, B710: 0.35, stay: 0.2 };
  const sum = p.B13 + p.B46 + p.B710 + p.stay;
  const B1120 = Math.max(0, 1 - sum);
  return { ...p, B1120 };
}

export function scoreProbs(row: KeywordRow, weights: ScoreWeights) {
  const centers = BUCKET_CENTERS;
  const gap = (c: number) => Math.max(0, Math.abs((row.position ?? 100) - c));
  const kd = (row.kd ?? 50);
  const kdStd = (kd - 50) / 50; // ~[-1,1]
  const serpDiff = serpDifficulty(row);
  const serpStd = (serpDiff - 2) / 3; // heuristic scale
  const contentMatch = 0; // placeholder, not available
  const linkGapStd = 0; // placeholder, not available
  const s13 = weights.positionGap * (-gap(centers.B13))
    + weights.contentMatch * contentMatch
    + weights.linkGap * (-linkGapStd);
  const s46 = weights.positionGap * (-gap(centers.B46))
    + weights.contentMatch * contentMatch
    + weights.linkGap * (-linkGapStd);
  const s710 = weights.positionGap * (-gap(centers.B710))
    + weights.contentMatch * contentMatch
    + weights.linkGap * (-linkGapStd);
  const s1120 = weights.positionGap * (-gap(centers.B1120))
    + weights.contentMatch * contentMatch
    + weights.linkGap * (-linkGapStd);

  const exps = softmax([s13, s46, s710, s1120]);
  const [B13, B46, B710, B1120] = exps;

  let stay = weights.base_stay
    + Math.max(0, (row.position - 25) / 100)
    + weights.keywordDifficulty * kdStd * 0.5
    + weights.serpComplexity * serpStd * 0.5;
  stay = Math.min(0.8, Math.max(0, stay));

  // renormalize with stay so total <=1
  const improve = B13 + B46 + B710 + B1120;
  const scale = improve + stay > 1 ? (1 - stay) / Math.max(improve, 1e-6) : 1;
  return { B13: B13 * scale, B46: B46 * scale, B710: B710 * scale, B1120: B1120 * scale, stay };
}

function serpDifficulty(row: KeywordRow): number {
  const s = (row.serpFeatures ?? "").toLowerCase();
  let score = 0;
  ["shopping", "map", "maps", "faq", "video", "images", "image"].forEach((k) => { if (s.includes(k)) score++; });
  if (row.keyword.match(/\bbrand\b/i)) score++;
  return score; // 0..N
}

function softmax(v: number[]) {
  const m = Math.max(...v);
  const exps = v.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

export function applyCapacityEffort(p: { B13: number; B46: number; B710: number; B1120: number; stay: number }, capPct: number, effort: "low" | "medium" | "high") {
  const factor = effort === "low" ? 0.85 : effort === "high" ? 1.15 : 1.0;
  let B13 = p.B13 * factor; let B46 = p.B46 * factor; let B710 = p.B710 * factor; let B1120 = p.B1120 * factor; let stay = p.stay;
  const improve = B13 + B46 + B710 + B1120;
  const cap = Math.min(1, Math.max(0, capPct / 100));
  const cappedImprove = Math.min(improve, cap);
  const scale = improve > 0 ? cappedImprove / improve : 1;
  B13 *= scale; B46 *= scale; B710 *= scale; B1120 *= scale;
  // renormalize with stay so total <=1
  const total = B13 + B46 + B710 + B1120 + stay;
  if (total > 1) {
    const overflow = total - 1;
    stay = Math.max(0, stay - overflow);
  }
  return { B13, B46, B710, B1120, stay };
}

export function expectedCTR(row: KeywordRow, p: { B13: number; B46: number; B710: number; B1120: number; stay: number }, ctr: CTRBuckets, upliftPP: number) {
  const baseBucket = bucketForPosition(row.position);
  const baseCTR = baselineCTRForBucket(baseBucket, ctr);

  const target = (bucket: Bucket) => {
    const val = bucket === "B21P" ? ctr.B21P : ctr[bucket];
    const improved = bucket !== baseBucket; // uplift only for improved buckets; "stay" handled outside
    const withUplift = improved ? Math.min(100, val + upliftPP) : val;
    return withUplift;
  };

  const exp = p.B13 * target("B13") + p.B46 * target("B46") + p.B710 * target("B710") + p.B1120 * target("B1120") + p.stay * baseCTR;
  return { baseBucket, baseCTR, expected: exp };
}

export function computeTable(rows: KeywordRow[], settings: SettingsState) : { table: TableRow[]; totals: Totals } {
  const table: TableRow[] = [];
  let improvingSum = 0;

  for (const row of rows) {
    const { cohort, rule } = assignCohort(row, settings.cohorts);
    const probs0 = settings.engine === "heuristic" ? heuristicProbs(rule) : scoreProbs(row, settings.weights);
    const probs = applyCapacityEffort(probs0, settings.capacityCapPct, settings.effort);

    const { baseBucket, baseCTR, expected } = expectedCTR(row, probs, settings.ctr, settings.upliftPP);

    const baselineClicks = row.volume * (baseCTR / 100) * settings.clickToSession;
    const estimatedClicks = row.volume * (expected / 100) * settings.clickToSession;
    const incrementalClicks = Math.max(0, estimatedClicks - baselineClicks);

    const expectedBucket = maxBucketByProb(probs);
    const expectedPosition = expectedBucket === "B21P" ? row.position : BUCKET_CENTERS[expectedBucket as keyof typeof BUCKET_CENTERS];

    const out: TableRow = { ...row, cohort, baselineBucket: baseBucket, baselineCTR: baseCTR, probs, expectedCTR: expected, baselineClicks, estimatedClicks, incrementalClicks, expectedBucket, expectedPosition };
    table.push(out);

    const improve = 1 - probs.stay;
    improvingSum += improve;
  }

  table.sort((a, b) => b.incrementalClicks - a.incrementalClicks);

  const totals: Totals = {
    baselineClicks: sum(table.map((r) => r.baselineClicks)),
    estimatedClicks: sum(table.map((r) => r.estimatedClicks)),
    incrementalClicks: sum(table.map((r) => r.incrementalClicks)),
    keywords: table.length,
    improvingShare: table.length ? improvingSum / table.length : 0,
  };

  return { table, totals };
}

export function maxBucketByProb(p: { B13: number; B46: number; B710: number; B1120: number; stay: number }): Bucket {
  const entries: [Bucket, number][] = [["B13", p.B13], ["B46", p.B46], ["B710", p.B710], ["B1120", p.B1120], ["B21P", p.stay]];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function sum(a: number[]) { return a.reduce((acc, v) => acc + v, 0); }

function eq(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}
