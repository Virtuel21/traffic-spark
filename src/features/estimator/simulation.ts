import { Bucket, KeywordRow, SettingsState } from "./types";
import { applyCapacityEffort, baselineCTRForBucket, bucketForPosition, maxBucketByProb, scoreProbs, heuristicProbs } from "./model";

export interface IterResult {
  baselineClicks: number;
  estimatedClicks: number;
  incrementalClicks: number;
  improvingShare: number; // fraction improved this iteration
}

export function monteCarlo(rows: KeywordRow[], settings: SettingsState, iterations: number): { stats: { median: number; p25: number; p75: number }, series: IterResult[] } {
  const iters: IterResult[] = [];
  for (let i = 0; i < iterations; i++) {
    let baseline = 0, estimated = 0, improved = 0;

    // Precompute raw probs
    const raw = rows.map((row) => {
      const probs0 = settings.engine === "heuristic" ? heuristicProbs(assignRule(row, settings)) : scoreProbs(row, settings.weights);
      const probs = applyCapacityEffort(probs0, 100, settings.effort); // apply effort only, cap globally later
      return { row, probs };
    });

    const capCount = Math.floor((settings.capacityCapPct / 100) * rows.length);
    const picks: number[] = [];
    const improveFlags = new Array(rows.length).fill(false);

    // First draw destination for each row ignoring cap
    const draws: Bucket[] = raw.map(({ row, probs }) => drawBucket(row, probs));

    // Determine how many are improved (not stay)
    const improvedIdx = draws.map((b, idx) => ({ b, idx })).filter((x) => x.b !== "B21P").map((x) => x.idx);

    // Enforce cap by randomly selecting a subset
    if (improvedIdx.length > capCount) {
      shuffle(improvedIdx);
      improvedIdx.slice(0, capCount).forEach((i2) => improveFlags[i2] = true);
    } else {
      improvedIdx.forEach((i2) => improveFlags[i2] = true);
    }

    raw.forEach(({ row }, idx) => {
      const baseBucket = bucketForPosition(row.position);
      const baseCTR = baselineCTRForBucket(baseBucket, settings.ctr);
      baseline += row.volume * (baseCTR / 100) * settings.clickToSession;

      let dest = draws[idx];
      if (!improveFlags[idx]) dest = "B21P"; // stay

      const targetCTR = dest === "B21P" ? baseCTR : Math.min(100, (settings.ctr[dest as keyof typeof settings.ctr] ?? baseCTR) + settings.upliftPP);
      estimated += row.volume * (targetCTR / 100) * settings.clickToSession;
      if (dest !== "B21P") improved += 1;
    });

    iters.push({ baselineClicks: baseline, estimatedClicks: estimated, incrementalClicks: Math.max(0, estimated - baseline), improvingShare: improved / rows.length });
  }

  const incs = iters.map((i) => i.incrementalClicks).sort((a, b) => a - b);
  const stats = { median: quantile(incs, 0.5), p25: quantile(incs, 0.25), p75: quantile(incs, 0.75) };
  return { stats, series: iters };
}

function drawBucket(row: KeywordRow, probs: { B13: number; B46: number; B710: number; B1120: number; stay: number }): Bucket {
  const r = Math.random();
  const cum = [probs.B13, probs.B13 + probs.B46, probs.B13 + probs.B46 + probs.B710, probs.B13 + probs.B46 + probs.B710 + probs.B1120];
  if (r < cum[0]) return "B13";
  if (r < cum[1]) return "B46";
  if (r < cum[2]) return "B710";
  if (r < cum[3]) return "B1120";
  return "B21P";
}

function assignRule(row: KeywordRow, settings: SettingsState) {
  const { cohorts } = settings;
  for (const c of cohorts) {
    const pr = c.conditions.positionRange;
    const kr = c.conditions.kdRange;
    const s = (row.serpFeatures ?? "").toLowerCase();
    if (pr && (row.position < pr[0] || row.position > pr[1])) continue;
    if (kr && (row.kd ?? 999) > kr[1]) continue;
    if (c.conditions.serpIncludesAny && c.conditions.serpIncludesAny.length) {
      const ok = c.conditions.serpIncludesAny.some((w) => w.startsWith("!") ? !s.includes(w.slice(1).toLowerCase()) : s.includes(w.toLowerCase()));
      if (!ok) continue;
    }
    return c;
  }
  return undefined;
}

function shuffle<T>(arr: T[]) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } }
function quantile(arr: number[], q: number) { const idx = Math.floor((arr.length - 1) * q); return arr[idx] ?? 0; }
