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
      <KPICard title="Baseline Clicks" help="Clicks at current positions: Volume × CTR of current bucket." value={fmt(baseline)} />
      <KPICard title={mcActive ? "Estimated (MC median)" : "Estimated Clicks"} help={mcActive ? "Monte Carlo median of estimated clicks across iterations." : "Deterministic expected clicks from the model."} value={fmt(mcActive ? (mcStats?.median ?? estimated) : estimated)} sub={mcActive ? `P25 ${fmt(mcStats?.p25 ?? 0)} • P75 ${fmt(mcStats?.p75 ?? 0)}` : undefined} />
      <KPICard title="Incremental" help="Estimated − Baseline (≥ 0); the uplift from improvements." value={fmt(incremental)} />
      <KPICard title="#Keywords" help="Number of rows considered after filters (e.g., min volume, brand filter)." value={keywords.toLocaleString()} />
      <KPICard title="% Improving" help="Share of keywords expected to improve (after capacity and effort)." value={(improvingShare * 100).toFixed(1) + "%"} />
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

