import { Card } from "@/components/ui/card";
import { HelpTooltip } from "@/components/HelpTooltip";

interface KPIProps {
  baseline: number;
  estimated: number;
  incremental: number;
  keywords: number;
  improvingShare: number;
  mcActive: boolean;
  mcStats?: { median: number; p25: number; p75: number } | null;
}

export default function KPIs({ baseline, estimated, incremental, keywords, improvingShare, mcActive, mcStats }: KPIProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KPICard title="Sessions de base" help="Sessions aux positions actuelles : Volume × CTR du groupe actuel." value={fmt(baseline)} />
      <KPICard
        title={mcActive ? "Sessions estimées (médiane MC)" : "Sessions estimées"}
        help={mcActive ? "Médiane Monte Carlo des sessions estimées." : "Attendu déterministe du modèle."}
        value={fmt(mcActive ? (baseline + (mcStats?.median ?? 0)) : estimated)}
        sub={mcActive ? `P25 ${fmt(baseline + (mcStats?.p25 ?? 0))} • P75 ${fmt(baseline + (mcStats?.p75 ?? 0))}` : undefined}
      />
      <KPICard title="Incrémental" help="Estimé − Base (≥ 0); le gain des améliorations." value={fmt(incremental)} />
      <KPICard title="#Mots-clés" help="Nombre de lignes considérées après filtres (volume min., marque, etc.)." value={keywords.toLocaleString()} />
      <KPICard title="% en amélioration" help="Part des mots-clés attendus en progression (après capacité et effort)." value={(improvingShare * 100).toFixed(1) + "%"} />
    </section>
  );
}

function KPICard({ title, value, sub, help }: { title: string; value: string; sub?: string; help?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <span>{title}</span>
        {help ? <HelpTooltip content={help} /> : null}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-[11px] text-muted-foreground mt-1">{sub}</div> : null}
    </Card>
  );
}

function fmt(n: number) { return Math.round(n).toLocaleString(); }

