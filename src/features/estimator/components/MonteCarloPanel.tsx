import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from "recharts";
import { IterResult } from "../simulation";

interface Props { stats: { median: number; p25: number; p75: number }; series: IterResult[]; }

export default function MonteCarloPanel({ stats, series }: Props) {
  const data = series.map((s, i) => ({ i: i + 1, inc: s.incrementalClicks }));
  const avgShare = series.reduce((a, s) => a + s.improvingShare, 0) / series.length;
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Simulation Monte Carlo</h3>
      <p className="text-xs text-muted-foreground">
        {`Volume incrémental médian ${fmt(stats.median)} (P25 ${fmt(stats.p25)} • P75 ${fmt(stats.p75)}). En moyenne ${Math.round(avgShare * 100)}% des mots-clés s'améliorent.`}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="i" tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={(l) => `Itération ${l}`} />
          <Line type="monotone" dataKey="inc" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function fmt(n: number) { return Math.round(n).toLocaleString(); }
