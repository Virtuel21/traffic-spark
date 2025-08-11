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
import { HelpTooltip } from "@/components/HelpTooltip";
import { DEFAULT_COHORTS } from "../../estimator/constants";
import { ColumnMapping, CohortRule, CTRBuckets, EngineMode, ScoreWeights, SettingsState, FiltersState } from "../../estimator/types";

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
      <h3 className="text-sm font-medium flex items-center gap-2">Correspondance des colonnes <HelpTooltip content="Associez les colonnes de votre fichier aux champs requis. Obligatoires : Mot-clé, Position, Volume." /></h3>
      <div className="grid grid-cols-2 gap-3">
        {( ["keyword","position","volume","url","country","device","intent","kd","serpFeatures"] as (keyof ColumnMapping)[] ).map((key) => (
          <div key={key} className="space-y-1">
            <Label className="capitalize">{key}</Label>
            <Select value={(mapping as any)?.[key] ?? ""} onValueChange={(v) => set(key, v)}>
              <SelectTrigger><SelectValue placeholder="Choisir colonne" /></SelectTrigger>
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
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  urls: string[];
  countries: string[];
  devices: string[];
}

export default function Sidebar({ settings, setSettings, onReset, ctrError, headers, mapping, onMappingChange, filters, setFilters, urls, countries, devices }: SidebarProps) {
  const sumErr = useMemo(() => validateCohorts(settings.cohorts), [settings.cohorts]);

  const setCTR = (k: keyof CTRBuckets, v: number) => setSettings({ ...settings, ctr: { ...settings.ctr, [k]: clamp(v, 0, 100) } });
  const setWeights = (patch: Partial<ScoreWeights>) => setSettings({ ...settings, weights: { ...settings.weights, ...patch } });
  const setCohort = (i: number, patch: Partial<CohortRule>) => {
    const list = settings.cohorts.slice();
    list[i] = { ...list[i], ...patch } as CohortRule;
    setSettings({ ...settings, cohorts: list });
  };

  const weightLabels: Record<keyof ScoreWeights, string> = {
    positionGap: "Écart de position",
    keywordDifficulty: "Difficulté du mot-clé",
    serpComplexity: "Complexité SERP",
    contentMatch: "Pertinence du contenu",
    linkGap: "Écart de liens",
    base_stay: "Probabilité de rester",
  };

  const weightHelp: Record<keyof ScoreWeights, string> = {
    positionGap: "Plus l'écart est grand avec le top, plus le potentiel de croissance est élevé.",
    keywordDifficulty: "Difficulté à se positionner sur le mot-clé.",
    serpComplexity: "La présence de nombreuses fonctionnalités SERP complique le classement.",
    contentMatch: "Pertinence de votre page vis-à-vis de la requête.",
    linkGap: "Différence de backlinks par rapport aux concurrents.",
    base_stay: "Probabilité de ne pas bouger.",
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[400px] shrink-0 p-4 space-y-4 bg-card/60 backdrop-blur rounded-lg border" aria-label="Controls sidebar">
      <h2 className="text-lg font-semibold">Paramètres</h2>

      <ColumnMapper headers={headers} mapping={mapping} onChange={onMappingChange} />

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Filtre de marque</Label>
            <HelpTooltip content="Filtrer les mots-clés par marques. 'Inclure uniquement' garde les lignes correspondantes, 'Exclure' les retire." />
          </div>
          <Switch checked={filters.brandOn} onCheckedChange={(v) => setFilters({ ...filters, brandOn: !!v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filters.brandMode} onValueChange={(v) => setFilters({ ...filters, brandMode: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Inclure uniquement</SelectItem>
              <SelectItem value="exclude">Exclure</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="marque1, marque2" value={filters.brandTerms} onChange={(e) => setFilters({ ...filters, brandTerms: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Volume min. <HelpTooltip content="Ignorer les mots-clés dont le volume mensuel est inférieur au seuil." /></Label>
          <Input type="number" value={filters.minVolume} onChange={(e) => setFilters({ ...filters, minVolume: Number(e.target.value || 0) })} />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Pays <HelpTooltip content="Ne montrer que les lignes dont le pays correspond." /></Label>
          <Input list="country-options" placeholder="FR,US" value={filters.countryIn.join(",")}
            onChange={(e) => setFilters({ ...filters, countryIn: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })} />
          <datalist id="country-options">
            {countries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Appareil <HelpTooltip content="Filtrer selon le type d'appareil." /></Label>
          <Input list="device-options" placeholder="mobile,desktop" value={filters.deviceIn.join(",")}
            onChange={(e) => setFilters({ ...filters, deviceIn: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })} />
          <datalist id="device-options">
            {devices.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Filtre URL <HelpTooltip content="Afficher uniquement les lignes dont l'URL contient ou correspond à ce texte." /></Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={filters.urlMode} onValueChange={(v) => setFilters({ ...filters, urlMode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contient</SelectItem>
                <SelectItem value="exact">Exacte</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input list="url-options" placeholder="Coller ou choisir" value={filters.urlValue} onChange={(e) => setFilters({ ...filters, urlValue: e.target.value })} />
              <datalist id="url-options">
                {urls.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">CTR par groupe (%) <HelpTooltip content="CTR de base pour chaque groupe de positions. Valeurs entre 0 et 100. L'uplift s'applique seulement aux groupes améliorés." /></h3>
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
        <TabsList className="grid grid-cols-2"><TabsTrigger value="heuristic">Heuristique</TabsTrigger><TabsTrigger value="score">Score</TabsTrigger></TabsList>
        <TabsContent value="heuristic">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">Cohortes <HelpTooltip content="Les cohortes heuristiques attribuent des probabilités d'amélioration selon des règles simples. La probabilité restante va vers B1120; si la somme dépasse 1, une erreur apparaît." /></h3>
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
                  <p className="text-[11px] mt-2">Somme={(sum).toFixed(2)} | Reste→B1120={(leftover).toFixed(2)}</p>
                </div>
              );
            })}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSettings({ ...settings, cohorts: DEFAULT_COHORTS })}>Réinitialiser</Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="score">
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">Poids <HelpTooltip content="Ajustez l'influence de chaque critère; les probabilités sont calculées via softmax. base_stay contrôle p(rester)." /></h3>
              {(["positionGap","keywordDifficulty","serpComplexity","contentMatch","linkGap"] as (keyof ScoreWeights)[]).map((k) => (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-xs"><Label className="flex items-center gap-1">{weightLabels[k]} <HelpTooltip content={weightHelp[k]} /></Label><span>{settings.weights[k].toFixed(2)}</span></div>
                  <Slider value={[settings.weights[k]]} onValueChange={(v) => setWeights({ [k]: v[0] } as any)} min={0} max={1} step={0.01} />
                </div>
              ))}
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><Label className="flex items-center gap-1">base_stay <HelpTooltip content={weightHelp.base_stay} /></Label><span>{settings.weights.base_stay.toFixed(2)}</span></div>
                <Slider value={[settings.weights.base_stay]} onValueChange={(v) => setWeights({ base_stay: v[0] })} min={0} max={0.6} step={0.01} />
              </div>
          </Card>
      </TabsContent>
      </Tabs>

      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm"><Label className="flex items-center gap-2">Limite de capacité (%) <HelpTooltip content="Part maximale de mots-clés pouvant s'améliorer sur la période. Appliqué après les probabilités." /></Label><span>{settings.capacityCapPct}%</span></div>
          <Slider value={[settings.capacityCapPct]} onValueChange={(v) => setSettings({ ...settings, capacityCapPct: v[0] })} min={0} max={100} step={1} />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Effort <HelpTooltip content="Intensité globale d'exécution. Faible réduit les probabilités d'amélioration; Élevé les augmente (puis renormalisation)." /></Label>
          <Select value={settings.effort} onValueChange={(v) => setSettings({ ...settings, effort: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="high">Élevé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Uplift CTR (pp) <HelpTooltip content="Points de pourcentage ajoutés aux groupes améliorés uniquement (jamais pour 'rester')." /></Label>
          <Input type="number" value={settings.upliftPP} onChange={(e) => setSettings({ ...settings, upliftPP: Number(e.target.value || 0) })} />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Facteur Clic → Session <HelpTooltip content="Multiplicateur pour convertir les clics en sessions; appliqué aux totaux de base et estimés." /></Label>
          <Input type="number" step="0.01" value={settings.clickToSession} onChange={(e) => setSettings({ ...settings, clickToSession: Number(e.target.value || 0) })} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">Monte Carlo <HelpTooltip content="Lance des simulations aléatoires et fournit médiane/P25/P75. La limite de capacité est appliquée à chaque itération." /></Label>
            <p className="text-[11px] text-muted-foreground">Simulation aléatoire</p>
          </div>
          <Switch checked={settings.monteCarlo} onCheckedChange={(v) => setSettings({ ...settings, monteCarlo: !!v })} />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">Itérations <HelpTooltip content="Nombre d'exécutions Monte Carlo (plus = résultat plus stable, mais plus lent)." /></Label>
          <Input type="number" value={settings.iterations} onChange={(e) => setSettings({ ...settings, iterations: Number(e.target.value || 0) })} />
        </div>
        <Button variant="secondary" onClick={onReset}>Réinitialiser</Button>
      </Card>
    </aside>
  );
}

function validateCohorts(list: CohortRule[]) {
  const over = list.find((c) => c.probs.B13 + c.probs.B46 + c.probs.B710 + c.probs.stay > 1 + 1e-6);
  return over ? `Probabilities in "${over.name}" exceed 1.0` : null;
}

function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }
