import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { TableRow as RowType } from "../../estimator/types";

interface Props { rows: RowType[]; height?: number; }

const COLS: { key: keyof RowType | "baselineBucket" | "expectedBucket" | "baselineCTR" | "incrementalClicks" | "estimatedClicks" | "baselineClicks"; label: string; width: number; help?: string }[] = [
  { key: "keyword", label: "Keyword", width: 320, help: "The search query term." },
  { key: "position", label: "Pos", width: 60, help: "Current Google rank (1–100)." },
  { key: "volume", label: "Vol", width: 90, help: "Monthly search volume." },
  { key: "cohort", label: "Cohort", width: 160, help: "Assigned improvement cohort." },
  { key: "baselineBucket", label: "Base Bucket", width: 110, help: "Bucket of the current position (1–3, 4–6, …)." },
  { key: "baselineCTR", label: "Base CTR%", width: 100, help: "CTR of the current bucket." },
  { key: "expectedBucket", label: "Exp Bucket", width: 110, help: "Expected destination bucket from the model." },
  { key: "baselineClicks", label: "Base Clicks", width: 120, help: "Volume × Base CTR." },
  { key: "estimatedClicks", label: "Est Clicks", width: 120, help: "Volume × Expected CTR." },
  { key: "incrementalClicks", label: "Incr", width: 110, help: "Estimated − Baseline (≥ 0)." },
  { key: "url", label: "URL", width: 260 },
  { key: "country", label: "Country", width: 100 },
  { key: "device", label: "Device", width: 100 },
  { key: "intent", label: "Intent", width: 100 },
  { key: "kd", label: "KD", width: 80, help: "Keyword difficulty." },
];

export default function DataTable({ rows, height = 520 }: Props) {
  const columnTemplate = COLS.map((c) => `${c.width}px`).join(" ");
  const totalWidth = COLS.reduce((a, c) => a + c.width, 0);

  const Row = ({ index, style }: ListChildComponentProps) => {
    const r = rows[index];
    return (
      <div
        style={{ ...style, display: "grid", gridTemplateColumns: columnTemplate, width: totalWidth }}
        className="hover:bg-accent/40 border-b"
        role="row"
      >
        {COLS.map((c) => (
          <div key={String(c.key)} style={{ width: c.width }} className="px-4 py-2 text-sm truncate" role="cell">
            {formatCell(r, c.key)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="w-full overflow-auto">
        {/* Header */}
        <div
          className="border-b bg-muted/40 sticky top-0 z-[1]"
          style={{ display: "grid", gridTemplateColumns: columnTemplate, minWidth: totalWidth }}
          role="row"
        >
          {COLS.map((c) => (
            <div key={String(c.key)} style={{ width: c.width }} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground flex items-center gap-2" role="columnheader">
              <span>{c.label}</span>
              {c.help ? <HelpTooltip content={c.help} /> : null}
            </div>
          ))}
        </div>

        {/* Rows */}
        <List height={height} width={totalWidth} itemCount={rows.length} itemSize={44} className="rounded-b-md">
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

