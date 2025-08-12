import { Card } from "@/components/ui/card";

interface PerformanceSummaryProps {
  baseline: number;
  estimated: number;
  incremental: number;
  engine: "heuristic" | "score";
  capacity: number;
  effort: "low" | "medium" | "high";
  uplift: number;
}

export default function PerformanceSummary({
  baseline,
  estimated,
  incremental,
  engine,
  capacity,
  effort,
  uplift,
}: PerformanceSummaryProps) {
  const modelLabel = engine === "heuristic" ? "modèle heuristique" : "modèle par score";
  const effortLabel = effort === "low" ? "faible" : effort === "high" ? "élevé" : "moyen";
  const percent = baseline > 0 ? (incremental / baseline) * 100 : 0;

  return (
    <Card className="p-4 text-sm leading-relaxed space-y-1">
      <p>
        {`Actuellement ${fmt(baseline)} sessions. Avec ${uplift}pp d'uplift, ${capacity}% de capacité et un effort ${effortLabel}, le ${modelLabel} prévoit ${fmt(estimated)} sessions.`}
      </p>
      <p>
        {`Cela représente ${fmt(incremental)} sessions supplémentaires (~${percent.toFixed(1)}%). Les valeurs se mettent à jour quand vous modifiez les paramètres.`}
      </p>
    </Card>
  );
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

