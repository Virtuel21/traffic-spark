import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ColumnMapping, KeywordRow, RawRow } from "./types";

export async function parseFile(file: File): Promise<{ rows: RawRow[]; headers: string[] }>{
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "csv") {
    const text = await file.text();
    const res = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
    const rows = (res.data as any[]).map((r) => normalizeRow(r));
    return { rows, headers: res.meta.fields ?? Object.keys(rows[0] ?? {}) };
  }
  // xlsx
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
  const rows = json.map((r) => normalizeRow(r));
  const headers = Object.keys(json[0] ?? {});
  return { rows, headers };
}

function normalizeRow(r: any): RawRow {
  const out: RawRow = {};
  Object.keys(r).forEach((k) => {
    const key = String(k).trim();
    let v: any = r[k];
    if (typeof v === "string") v = v.trim();
    out[key] = v;
  });
  return out;
}

export function mapAndClean(rows: RawRow[], map: ColumnMapping): KeywordRow[] {
  const list: KeywordRow[] = [];
  const seen = new Map<string, KeywordRow>();

  for (const r of rows) {
    const keyword = String(r[map.keyword] ?? "").trim();
    if (!keyword) continue;

    const rawPos = String(r[map.position] ?? "").replace(",", ".");
    const rawVol = String(r[map.volume] ?? "").replace(",", ".");
    const position = clamp(Number(rawPos), 1, 100);
    const volume = Number(rawVol);
    if (!(volume > 0)) continue;

    const url = map.url ? String(r[map.url] ?? "").trim() : undefined;
    const country = map.country ? String(r[map.country] ?? "").trim() : undefined;
    const device = map.device ? String(r[map.device] ?? "").trim() : undefined;
    const intent = map.intent ? String(r[map.intent] ?? "").trim() : undefined;
    const kd = map.kd ? numOrUndefined(r[map.kd]) : undefined;
    const serpFeatures = map.serpFeatures ? String(r[map.serpFeatures] ?? "").trim() : undefined;

    const row: KeywordRow = { keyword, position, volume, url, country, device, intent, kd, serpFeatures };

    const key = `${keyword}||${url ?? ""}`.toLowerCase();
    const existing = seen.get(key);
    if (!existing || position < existing.position) {
      seen.set(key, row);
    }
  }

  seen.forEach((v) => list.push(v));
  return list;
}

function numOrUndefined(v: any): number | undefined {
  const n = Number(String(v ?? "").replace(",", "."));
  return isFinite(n) ? n : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
