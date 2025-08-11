import { useEffect, useMemo, useState } from "react";
import TopBar from "@/features/estimator/components/TopBar";
import Sidebar from "@/features/estimator/components/Sidebar";
import KPIs from "@/features/estimator/components/KPIs";
import DataTable from "@/features/estimator/components/DataTable";
import { parseFile, mapAndClean } from "@/features/estimator/parser";
import { computeTable } from "@/features/estimator/model";
import { DEFAULT_COHORTS, DEFAULT_CTR, DEFAULT_WEIGHTS } from "@/features/estimator/constants";
import { ColumnMapping, KeywordRow, SettingsState, TableRow, FiltersState } from "@/features/estimator/types";
import { exportTableCSV, exportTableXLSX } from "@/features/estimator/export";
import { generateSampleRows } from "@/features/estimator/sample";

const DEFAULT_SETTINGS: SettingsState = {
  ctr: DEFAULT_CTR,
  upliftPP: 0,
  engine: "heuristic",
  cohorts: DEFAULT_COHORTS,
  weights: DEFAULT_WEIGHTS,
  capacityCapPct: 40,
  effort: "medium",
  monteCarlo: false,
  iterations: 500,
  clickToSession: 1.0,
};

const DEFAULT_MAPPING: ColumnMapping = { keyword: "Keyword", position: "Position", volume: "Search Volume", url: "URL", country: "Country", device: "Device", intent: "Intent", kd: "KD", serpFeatures: "SERP Features" };

const DEFAULT_FILTERS = { brandOn: false, brandMode: "exclude", brandTerms: "", minVolume: 50, countryIn: [] as string[], deviceIn: [] as string[] };

export default function Index() {
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(DEFAULT_MAPPING);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loadSample, setLoadSample] = useState(false);

  useEffect(() => {
    if (loadSample) {
      const rows = generateSampleRows();
      setRawRows(rows as any);
      setRawHeaders(Object.keys(DEFAULT_MAPPING));
    }
  }, [loadSample]);

  const cleaned: KeywordRow[] = useMemo(() => {
    if (!mapping) return [];
    // If rows are already KeywordRow from sample, just ensure structure
    if (rawRows.length && rawRows[0].keyword) return (rawRows as KeywordRow[]).filter((r) => r.volume >= (filters.minVolume || 0)).filter((r) => filterBrand(r, filters));
    if (!rawRows.length) return [];
    const mapped = mapAndClean(rawRows, mapping).filter((r) => r.volume >= (filters.minVolume || 0)).filter((r) => filterBrand(r, filters));
    return mapped;
  }, [rawRows, mapping, filters]);

  const { table, totals } = useMemo(() => computeTable(cleaned, settings), [cleaned, settings]);

  function onFile(file: File) {
    parseFile(file).then(({ rows, headers }) => { setRawRows(rows); setRawHeaders(headers); });
  }

  function resetDefaults() {
    setSettings(DEFAULT_SETTINGS);
  }

  return (
    <main className="min-h-screen">
      <TopBar onFile={onFile} loadSample={loadSample} setLoadSample={setLoadSample} />

      <section className="max-w-screen-2xl mx-auto px-4 py-6 grid lg:grid-cols-[400px_1fr] gap-6">
        <Sidebar
          settings={settings}
          setSettings={setSettings}
          onReset={resetDefaults}
          ctrError={null}
          headers={rawHeaders}
          mapping={mapping}
          onMappingChange={setMapping}
          filters={filters}
          setFilters={setFilters}
        />

        <div className="space-y-6">
          <KPIs baseline={totals.baselineClicks} estimated={totals.estimatedClicks} incremental={totals.incrementalClicks} keywords={totals.keywords} improvingShare={totals.improvingShare} mcActive={settings.monteCarlo} />

          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md border" onClick={() => exportTableCSV(table)}>Export CSV</button>
            <button className="px-3 py-2 rounded-md border" onClick={() => exportTableXLSX(table)}>Export XLSX</button>
          </div>

          <DataTable rows={table as TableRow[]} />
        </div>
      </section>
    </main>
  );
}

function filterBrand(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
  if (!f.brandOn || !f.brandTerms.trim()) return true;
  const terms = f.brandTerms.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const hay = `${r.keyword} ${(r.url ?? "")}`.toLowerCase();
  const has = terms.some((t) => hay.includes(t));
  return f.brandMode === "include" ? has : !has;
}
