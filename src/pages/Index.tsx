import { useEffect, useMemo, useState } from "react";
import TopBar from "@/features/estimator/components/TopBar";
import Sidebar from "@/features/estimator/components/Sidebar";
import KPIs from "@/features/estimator/components/KPIs";
import DataTable from "@/features/estimator/components/DataTable";
import TopicTable from "@/features/estimator/components/TopicTable";
import { categorizeKeywords } from "@/lib/gemini";
import PerformanceSummary from "@/features/estimator/components/PerformanceSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFile, mapAndClean } from "@/features/estimator/parser";
import { computeTable } from "@/features/estimator/model";
import { DEFAULT_COHORTS, DEFAULT_CTR, DEFAULT_WEIGHTS } from "@/features/estimator/constants";
import { ColumnMapping, KeywordRow, SettingsState, TableRow, TopicRow } from "@/features/estimator/types";
import { exportTableCSV, exportTableXLSX } from "@/features/estimator/export";
import { generateSampleRows } from "@/features/estimator/sample";
import { BRAND_INDEX } from "@/lib/brandIndex";
import { normalizeText } from "@/lib/utils";

const DEFAULT_SETTINGS: SettingsState = {
  ctr: DEFAULT_CTR,
  upliftPP: 0,
  engine: "heuristic",
  cohorts: DEFAULT_COHORTS,
  weights: DEFAULT_WEIGHTS,
  capacityCapPct: 40,
  effort: "medium",
  clickToSession: 1.0,
};

const DEFAULT_MAPPING: ColumnMapping = { keyword: "Keyword", position: "Position", volume: "Search Volume", url: "URL", country: "Country", device: "Device", intent: "Intent", kd: "KD", serpFeatures: "SERP Features" };

const DEFAULT_FILTERS = {
  brandOn: false,
  brandMode: "exclude",
  brandTerms: "",
  minVolume: 50,
  countryIn: [] as string[],
  deviceIn: [] as string[],
  intentIn: [] as string[],
  positionRange: [1,100] as [number, number],
  urlMode: "contains" as "contains" | "exact",
  urlValue: "",
};

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

  const mapped: KeywordRow[] = useMemo(() => {
    if (!mapping) return [];
    if (rawRows.length && rawRows[0].keyword) return rawRows as KeywordRow[];
    if (!rawRows.length) return [];
    return mapAndClean(rawRows, mapping);
  }, [rawRows, mapping]);

  const urlOptions = useMemo(() => Array.from(new Set(mapped.map((r) => r.url).filter(Boolean))) as string[], [mapped]);
  const countryOptions = useMemo(() => Array.from(new Set(mapped.map((r) => r.country).filter(Boolean))) as string[], [mapped]);
  const deviceOptions = useMemo(() => Array.from(new Set(mapped.map((r) => r.device).filter(Boolean))) as string[], [mapped]);
  const intentOptions = useMemo(() => Array.from(new Set(mapped.map((r) => r.intent).filter(Boolean))) as string[], [mapped]);

  const cleaned: KeywordRow[] = useMemo(() => {
    return mapped
      .filter((r) => r.volume >= (filters.minVolume || 0))
      .filter((r) => filterBrand(r, filters))
      .filter((r) => filterCountry(r, filters))
      .filter((r) => filterDevice(r, filters))
      .filter((r) => filterIntent(r, filters))
      .filter((r) => filterPosition(r, filters))
      .filter((r) => filterUrl(r, filters));
  }, [mapped, filters]);

  const { table, totals } = useMemo(() => computeTable(cleaned, settings), [cleaned, settings]);

  const [topicRows, setTopicRows] = useState<TopicRow[]>([]);

  useEffect(() => {
    async function computeTopics() {
      const mapping = await categorizeKeywords(table.map((r) => r.keyword));
      const m = new Map<string, TopicRow>();
      table.forEach((r) => {
        const topic = mapping[r.keyword] || r.keyword.split(/\s+/)[0]?.toLowerCase() || "";
        if (!topic) return;
        const cur = m.get(topic) || { topic, keywords: 0, baselineClicks: 0, estimatedClicks: 0, incrementalClicks: 0 };
        cur.keywords += 1;
        cur.baselineClicks += r.baselineClicks;
        cur.estimatedClicks += r.estimatedClicks;
        cur.incrementalClicks += r.incrementalClicks;
        m.set(topic, cur);
      });
      setTopicRows(Array.from(m.values()).sort((a, b) => b.incrementalClicks - a.incrementalClicks));
    }
    computeTopics();
  }, [table]);
  const [tableHeight, setTableHeight] = useState(520);
  const [view, setView] = useState("keywords");

  useEffect(() => {
    const calc = () => setTableHeight(Math.max(200, window.innerHeight - 340));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  function onFile(file: File) {
    parseFile(file).then(({ rows, headers }) => { setRawRows(rows); setRawHeaders(headers); });
  }

  function resetDefaults() {
    setSettings(DEFAULT_SETTINGS);
  }

  return (
    <main className="min-h-screen">
      <TopBar onFile={onFile} loadSample={loadSample} setLoadSample={setLoadSample} />

      <section className="max-w-screen-2xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[400px_1fr] lg:h-[calc(100vh-80px)] overflow-hidden">
        <div className="overflow-y-auto pr-2">
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
            urls={urlOptions}
            countries={countryOptions}
            devices={deviceOptions}
            intents={intentOptions}
          />
        </div>

        <div className="space-y-6 overflow-y-auto">
          <KPIs
            baseline={totals.baselineClicks}
            estimated={totals.estimatedClicks}
            incremental={totals.incrementalClicks}
            keywords={totals.keywords}
            improvingShare={totals.improvingShare}
          />

          <PerformanceSummary
            baseline={totals.baselineClicks}
            estimated={totals.estimatedClicks}
            incremental={totals.incrementalClicks}
            engine={settings.engine}
            capacity={settings.capacityCapPct}
            effort={settings.effort}
            uplift={settings.upliftPP}
          />

          <Tabs value={view} onValueChange={setView} className="space-y-4">
            <TabsList className="w-fit">
              <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>
            <TabsContent value="keywords" className="space-y-4">
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-md border" onClick={() => exportTableCSV(table)}>Exporter CSV</button>
                <button className="px-3 py-2 rounded-md border" onClick={() => exportTableXLSX(table)}>Exporter XLSX</button>
              </div>
              <DataTable rows={table as TableRow[]} height={tableHeight} />
            </TabsContent>
            <TabsContent value="topics">
              <TopicTable rows={topicRows} height={tableHeight} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}

  function filterBrand(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    if (!f.brandOn) return true;
    const manual = f.brandTerms.split(",").map((t) => normalizeText(t.trim())).filter(Boolean);
    const terms = Array.from(new Set([...BRAND_INDEX, ...manual]))
      .map((t) => normalizeText(t.trim()))
      .filter(Boolean);

    const hay = normalizeText(`${r.keyword} ${(r.url ?? "")}`)
      .split(/\W+/)
      .filter(Boolean)
      .join(" ");
    const paddedHay = ` ${hay} `;

    const has = terms.some((t) => paddedHay.includes(` ${t} `));
    return f.brandMode === "include" ? has : !has;
  }

  function filterCountry(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    if (!f.countryIn.length) return true;
    const c = String(r.country ?? "");
    return f.countryIn.includes(c);
  }

  function filterDevice(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    if (!f.deviceIn.length) return true;
    const d = String(r.device ?? "");
    return f.deviceIn.includes(d);
  }

  function filterIntent(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    if (!f.intentIn.length) return true;
    const i = String(r.intent ?? "");
    return f.intentIn.includes(i);
  }

  function filterPosition(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    const [min, max] = f.positionRange;
    return r.position >= min && r.position <= max;
  }

  function filterUrl(r: KeywordRow, f: typeof DEFAULT_FILTERS) {
    if (!f.urlValue.trim()) return true;
    const u = r.url ?? "";
    return f.urlMode === "exact" ? u === f.urlValue : u.includes(f.urlValue);
  }
