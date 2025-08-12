import { Card } from "@/components/ui/card";
import { MCStats } from "../types";

interface PerformanceSummaryProps {
  baseline: number;
  estimated: number;
  incremental: number;
  engine: "heuristic" | "score";
  mcActive: boolean;
  mcStats?: MCStats | null;
  capacity: number;
  effort: "low" | "medium" | "high";
  uplift: number;
}

export default function PerformanceSummary({
  baseline,
  estimated,
  incremental,
  engine,
  mcActive,
  mcStats,
  capacity,
  effort,
  uplift,
}: PerformanceSummaryProps) {
  const modelLabel = engine === "heuristic" ? "modèle heuristique" : "modèle par score";
  const effortLabel = effort === "low" ? "faible" : effort === "high" ? "élevé" : "moyen";
  const total = mcActive && mcStats ? baseline + mcStats.median : estimated;
  const incr = total - baseline;
  const percent = baseline > 0 ? (incr / baseline) * 100 : 0;

  return (
    <Card className="p-4 text-sm leading-relaxed space-y-1">
      <p>
        {`Actuellement ${fmt(baseline)} sessions. Avec ${uplift}pp d'uplift, ${capacity}% de capacité et un effort ${effortLabel}, le ${modelLabel} prévoit ${fmt(total)} sessions.`}
      </p>
      <p>
        {`Cela représente ${fmt(incr)} sessions supplémentaires (~${percent.toFixed(1)}%). Les valeurs se mettent à jour quand vous modifiez les paramètres.`}
      </p>
      {mcActive && mcStats ? (
        <p className="text-xs text-muted-foreground mt-1">
          {`Simulation Monte Carlo : médiane ${fmt(baseline + mcStats.median)} • P25 ${fmt(baseline + mcStats.p25)} • P75 ${fmt(baseline + mcStats.p75)}`}
        </p>
      ) : null}
    </Card>
  );
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

