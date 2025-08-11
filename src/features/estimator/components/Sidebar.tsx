import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_COHORTS } from "../../estimator/constants";
import { ColumnMapping, CohortRule, CTRBuckets, EngineMode, ScoreWeights, SettingsState } from "../../estimator/types";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping | null;
  onChange: (m: ColumnMapping) => void;
}

export function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  const opts = headers.length ? headers : ["Keyword", "Position", "Search Volume", "URL", "Country", "Device", "Intent", "KD", "SERP Features"]; // hints

  const set = (k: keyof ColumnMapping, v: string) => {
    onChange({ ...(mapping ?? { keyword: "", position: "", volume: "" }), [k]: v });
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Column Mapper</h3>
      <div className="grid grid-cols-2 gap-3">
        {( ["keyword","position","volume","url","country","device","intent","kd","serpFeatures"] as (keyof ColumnMapping)[] ).map((key) => (
          <div key={key} className="space-y-1">
            <Label className="capitalize">{key}</Label>
            <Select value={(mapping as any)?.[key] ?? ""} onValueChange={(v) => set(key, v)}>
              <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
              <SelectContent>
                {opts.map((h) => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface SidebarProps {
  settings: SettingsState;
  setSettings: (s: SettingsState) => void;
  onReset: () => void;
  ctrError?: string | null;
  headers: string[];
  mapping: ColumnMapping | null;
  onMappingChange: (m: ColumnMapping) => void;
  filters: { brandOn: boolean; brandMode: "include" | "exclude"; brandTerms: string; minVolume: number; countryIn: string[]; deviceIn: string[] };
  setFilters: (f: SidebarProps["filters"]) => void;
}

export default function Sidebar({ settings, setSettings, onReset, ctrError, headers, mapping, onMappingChange, filters, setFilters }: SidebarProps) {
  const sumErr = useMemo(() => validateCohorts(settings.cohorts), [settings.cohorts]);

  const setCTR = (k: keyof CTRBuckets, v: number) => setSettings({ ...settings, ctr: { ...settings.ctr, [k]: clamp(v, 0, 100) } });
  const setWeights = (patch: Partial<ScoreWeights>) => setSettings({ ...settings, weights: { ...settings.weights, ...patch } });
  const setCohort = (i: number, patch: Partial<CohortRule>) => {
    const list = settings.cohorts.slice();
    list[i] = { ...list[i], ...patch } as CohortRule;
    setSettings({ ...settings, cohorts: list });
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[400px] shrink-0 p-4 space-y-4 bg-card/60 backdrop-blur rounded-lg border" aria-label="Controls sidebar">
      <h2 className="text-lg font-semibold">Settings</h2>

      <ColumnMapper headers={headers} mapping={mapping} onChange={onMappingChange} />

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label>Brand filter</Label>
          <Switch checked={filters.brandOn} onCheckedChange={(v) => setFilters({ ...filters, brandOn: !!v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filters.brandMode} onValueChange={(v) => setFilters({ ...filters, brandMode: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Include only</SelectItem>
              <SelectItem value="exclude">Exclude</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="brand1, brand2" value={filters.brandTerms} onChange={(e) => setFilters({ ...filters, brandTerms: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Min Volume</Label>
          <Input type="number" value={filters.minVolume} onChange={(e) => setFilters({ ...filters, minVolume: Number(e.target.value || 0) })} />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-medium">CTR by Bucket (%)</h3>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {(["B13","B46","B710","B1120","B21P"] as (keyof CTRBuckets)[]).map((k) => (
            <div key={k} className="space-y-1">
              <Label>{k}</Label>
              <Input type="number" value={(settings.ctr as any)[k]} onChange={(e) => setCTR(k, Number(e.target.value || 0))} />
            </div>
          ))}
        </div>
        {ctrError ? <p className="text-xs text-destructive">{ctrError}</p> : null}
      </Card>

      <Tabs value={settings.engine} onValueChange={(v) => setSettings({ ...settings, engine: v as EngineMode })}>
        <TabsList className="grid grid-cols-2"><TabsTrigger value="heuristic">Heuristic</TabsTrigger><TabsTrigger value="score">Score</TabsTrigger></TabsList>
        <TabsContent value="heuristic">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-medium">Cohorts</h3>
            {settings.cohorts.map((c, i) => {
              const sum = c.probs.B13 + c.probs.B46 + c.probs.B710 + c.probs.stay;
              const leftover = Math.max(0, 1 - sum);
              const over = sum > 1 + 1e-6;
              return (
                <div key={i} className={`p-3 rounded-md border ${over ? 'border-destructive' : ''}`}>
                  <div className="text-sm font-medium mb-2">{c.name}</div>
                  <div className="grid grid-cols-4 gap-2 items-end text-xs">
                    {(["B13","B46","B710","stay"] as const).map((k) => (
                      <div key={k} className="space-y-1">
                        <Label>{k}</Label>
                        <Input type="number" step="0.01" value={(c.probs as any)[k]} onChange={(e) => setCohort(i, { probs: { ...c.probs, [k]: Number(e.target.value || 0) } as any })} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] mt-2">Sum={(sum).toFixed(2)} | Leftover→B1120={(leftover).toFixed(2)}</p>
                </div>
              );
            })}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSettings({ ...settings, cohorts: DEFAULT_COHORTS })}>Reset cohorts</Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="score">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-medium">Weights</h3>
            {(["w1","w2","w3","w4","w5"] as (keyof ScoreWeights)[]).map((k) => (
              <div key={k} className="space-y-1">
                <div className="flex justify-between text-xs"><Label>{k}</Label><span>{settings.weights[k].toFixed(2)}</span></div>
                <Slider value={[settings.weights[k]]} onValueChange={(v) => setWeights({ [k]: v[0] } as any)} min={0} max={1} step={0.01} />
              </div>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-xs"><Label>base_stay</Label><span>{settings.weights.base_stay.toFixed(2)}</span></div>
              <Slider value={[settings.weights.base_stay]} onValueChange={(v) => setWeights({ base_stay: v[0] })} min={0} max={0.6} step={0.01} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm"><Label>Capacity Cap (%)</Label><span>{settings.capacityCapPct}%</span></div>
          <Slider value={[settings.capacityCapPct]} onValueChange={(v) => setSettings({ ...settings, capacityCapPct: v[0] })} min={0} max={100} step={1} />
        </div>
        <div className="space-y-1">
          <Label>Effort</Label>
          <Select value={settings.effort} onValueChange={(v) => setSettings({ ...settings, effort: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>CTR uplift (pp)</Label>
          <Input type="number" value={settings.upliftPP} onChange={(e) => setSettings({ ...settings, upliftPP: Number(e.target.value || 0) })} />
        </div>
        <div className="space-y-1">
          <Label>Click → Session factor</Label>
          <Input type="number" step="0.01" value={settings.clickToSession} onChange={(e) => setSettings({ ...settings, clickToSession: Number(e.target.value || 0) })} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Monte Carlo</Label>
            <p className="text-[11px] text-muted-foreground">Randomized simulation</p>
          </div>
          <Switch checked={settings.monteCarlo} onCheckedChange={(v) => setSettings({ ...settings, monteCarlo: !!v })} />
        </div>
        <div className="space-y-1">
          <Label>Iterations</Label>
          <Input type="number" value={settings.iterations} onChange={(e) => setSettings({ ...settings, iterations: Number(e.target.value || 0) })} />
        </div>
        <Button variant="secondary" onClick={onReset}>Reset to Defaults</Button>
      </Card>
    </aside>
  );
}

function validateCohorts(list: CohortRule[]) {
  const over = list.find((c) => c.probs.B13 + c.probs.B46 + c.probs.B710 + c.probs.stay > 1 + 1e-6);
  return over ? `Probabilities in "${over.name}" exceed 1.0` : null;
}

function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }
