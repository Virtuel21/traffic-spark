import { Card } from "@/components/ui/card";

interface PerformanceSummaryProps {
  baseline: number;
  estimated: number;
  incremental: number;
  engine: "heuristic" | "score";
}

export default function PerformanceSummary({ baseline, estimated, incremental, engine }: PerformanceSummaryProps) {
  const percent = baseline > 0 ? (incremental / baseline) * 100 : 0;
  const modelLabel = engine === "heuristic" ? "modèle heuristique" : "modèle par score";
  return (
    <Card className="p-4 text-sm leading-relaxed">
      <p>
        Avec le {modelLabel}, nous prévoyons <strong>{fmt(estimated)}</strong> sessions au total. Cela correspond à environ <strong>{fmt(incremental)}</strong> sessions supplémentaires par rapport à la situation actuelle, soit une amélioration d'environ {percent.toFixed(1)}%.
      </p>
    </Card>
  );
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

