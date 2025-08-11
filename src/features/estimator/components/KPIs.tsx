import { Card } from "@/components/ui/card";

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
      <KPICard title="Baseline Clicks" value={fmt(baseline)} />
      <KPICard title={mcActive ? "Estimated (MC median)" : "Estimated Clicks"} value={fmt(mcActive ? (mcStats?.median ?? estimated) : estimated)} sub={mcActive ? `P25 ${fmt(mcStats?.p25 ?? 0)} • P75 ${fmt(mcStats?.p75 ?? 0)}` : undefined} />
      <KPICard title="Incremental" value={fmt(incremental)} />
      <KPICard title="#Keywords" value={keywords.toLocaleString()} />
      <KPICard title="% Improving" value={(improvingShare * 100).toFixed(1) + "%"} />
    </section>
  );
}

function KPICard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-[11px] text-muted-foreground mt-1">{sub}</div> : null}
    </Card>
  );
}

function fmt(n: number) { return Math.round(n).toLocaleString(); }
