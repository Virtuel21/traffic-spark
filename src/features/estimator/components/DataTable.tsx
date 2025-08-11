import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { TableRow as RowType } from "../../estimator/types";

interface Props { rows: RowType[]; height?: number; }

const COLS: { key: keyof RowType | "baselineBucket" | "expectedBucket" | "baselineCTR" | "incrementalClicks" | "estimatedClicks" | "baselineClicks" | "expectedPosition"; label: string; width: number; help?: string }[] = [
  { key: "keyword", label: "Mot-clé", width: 320, help: "La requête recherchée." },
  { key: "position", label: "Pos", width: 60, help: "Position Google actuelle (1–100)." },
  { key: "volume", label: "Volume", width: 90, help: "Volume de recherche mensuel." },
  { key: "cohort", label: "Cohorte", width: 160, help: "Cohorte d'amélioration attribuée." },
  { key: "baselineBucket", label: "Groupe actuel", width: 110, help: "Groupe de la position actuelle (1–3, 4–6, …)." },
  { key: "baselineCTR", label: "CTR base %", width: 100, help: "CTR du groupe actuel." },
  { key: "expectedBucket", label: "Groupe cible", width: 110, help: "Groupe attendu d'après le modèle." },
  { key: "expectedPosition", label: "Pos cible", width: 80, help: "Position estimée associée au groupe cible." },
  { key: "baselineClicks", label: "Sessions de base", width: 120, help: "Volume × CTR de base." },
  { key: "estimatedClicks", label: "Sessions estimées", width: 120, help: "Volume × CTR attendu." },
  { key: "incrementalClicks", label: "Gain", width: 110, help: "Estimé − Base (≥ 0)." },
  { key: "url", label: "URL", width: 260 },
  { key: "country", label: "Pays", width: 100 },
  { key: "device", label: "Appareil", width: 100 },
  { key: "intent", label: "Intention", width: 100 },
  { key: "kd", label: "KD", width: 80, help: "Difficulté du mot-clé." },
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
    if (key === "expectedPosition") return Math.round(v);
  }
  return v ?? "";
}

