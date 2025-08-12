import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { TopicRow } from "../../estimator/types";

interface Props { rows: TopicRow[]; height?: number; }

const COLS: { key: keyof TopicRow; label: string; width: number; help?: string }[] = [
  { key: "topic", label: "Topic", width: 200 },
  { key: "keywords", label: "#Mots-clés", width: 100 },
  { key: "baselineClicks", label: "Sessions de base", width: 140 },
  { key: "estimatedClicks", label: "Sessions estimées", width: 140 },
  { key: "incrementalClicks", label: "Gain", width: 120 },
];

export default function TopicTable({ rows, height = 520 }: Props) {
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
          <div key={c.key} style={{ width: c.width }} className="px-4 py-2 text-sm truncate" role="cell">
            {formatCell(r, c.key)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="w-full overflow-auto">
        <div
          className="border-b bg-muted/40 sticky top-0 z-[1]"
          style={{ display: "grid", gridTemplateColumns: columnTemplate, minWidth: totalWidth }}
          role="row"
        >
          {COLS.map((c) => (
            <div key={c.key} style={{ width: c.width }} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground flex items-center gap-2" role="columnheader">
              <span>{c.label}</span>
              {c.help ? <HelpTooltip content={c.help} /> : null}
            </div>
          ))}
        </div>
        <List height={height} width={totalWidth} itemCount={rows.length} itemSize={44} className="rounded-b-md">
          {Row}
        </List>
      </div>
    </Card>
  );
}

function formatCell(r: TopicRow, key: keyof TopicRow) {
  const v = r[key];
  if (typeof v === "number" && key !== "keywords") {
    return Math.round(v).toLocaleString();
  }
  return String(v);
}

