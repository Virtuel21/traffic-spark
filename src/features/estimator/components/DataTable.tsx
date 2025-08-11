import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableRow as RowType } from "../../estimator/types";

interface Props { rows: RowType[]; height?: number; }

const COLS: { key: keyof RowType | "baselineBucket" | "expectedBucket" | "baselineCTR" | "incrementalClicks" | "estimatedClicks" | "baselineClicks"; label: string; width: number }[] = [
  { key: "keyword", label: "Keyword", width: 320 },
  { key: "position", label: "Pos", width: 60 },
  { key: "volume", label: "Vol", width: 90 },
  { key: "cohort", label: "Cohort", width: 160 },
  { key: "baselineBucket", label: "Base Bucket", width: 110 },
  { key: "baselineCTR", label: "Base CTR%", width: 100 },
  { key: "expectedBucket", label: "Exp Bucket", width: 110 },
  { key: "baselineClicks", label: "Base Clicks", width: 120 },
  { key: "estimatedClicks", label: "Est Clicks", width: 120 },
  { key: "incrementalClicks", label: "Incr", width: 110 },
  { key: "url", label: "URL", width: 260 },
  { key: "country", label: "Country", width: 100 },
  { key: "device", label: "Device", width: 100 },
  { key: "intent", label: "Intent", width: 100 },
  { key: "kd", label: "KD", width: 80 },
];

export default function DataTable({ rows, height = 520 }: Props) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const r = rows[index];
    return (
      <TableRow style={style as any} className="hover:bg-accent/40">
        {COLS.map((c) => (
          <TableCell key={String(c.key)} style={{ width: c.width }}>
            {formatCell(r, c.key)}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const totalWidth = COLS.reduce((a, c) => a + c.width, 0);

  return (
    <Card className="p-2 overflow-hidden">
      <div className="w-full overflow-auto" style={{ maxWidth: "100%" }}>
        <Table style={{ minWidth: totalWidth }}>
          <TableHeader>
            <TableRow>
              {COLS.map((c) => (<TableHead key={String(c.key)} style={{ width: c.width }}>{c.label}</TableHead>))}
            </TableRow>
          </TableHeader>
        </Table>
        <List height={height} width={Math.min(totalWidth, typeof window !== 'undefined' ? window.innerWidth - 420 : totalWidth)} itemCount={rows.length} itemSize={44} className="rounded-b-md">
          {Row}
        </List>
      </div>
    </Card>
  );
}

function formatCell(r: RowType, key: any) {
  const v = (r as any)[key];
  if (typeof v === "number") {
    if (key === "baselineCTR") return v.toFixed(2);
    if (key.toString().includes("Clicks")) return Math.round(v).toLocaleString();
  }
  return v ?? "";
}
