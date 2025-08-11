import * as XLSX from "xlsx";
import Papa from "papaparse";
import { TableRow } from "./types";

export function exportTableCSV(rows: TableRow[], filename = "estimator-table.csv") {
  const csv = Papa.unparse(rows.map(r => ({
    Keyword: r.keyword,
    Position: r.position,
    Volume: r.volume,
    Cohort: r.cohort,
    BaselineBucket: r.baselineBucket,
    BaselineCTR: r.baselineCTR,
    ExpectedBucket: r.expectedBucket,
    ExpectedPosition: r.expectedPosition,
    BaselineSessions: r.baselineClicks,
    EstimatedSessions: r.estimatedClicks,
    IncrementalSessions: r.incrementalClicks,
    URL: r.url ?? "",
    Country: r.country ?? "",
    Device: r.device ?? "",
    Intent: r.intent ?? "",
    KD: r.kd ?? "",
  })));
  download(csv, filename, "text/csv;charset=utf-8;");
}

export function exportTableXLSX(rows: TableRow[], filename = "estimator-table.xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
    Keyword: r.keyword,
    Position: r.position,
    Volume: r.volume,
    Cohort: r.cohort,
    BaselineBucket: r.baselineBucket,
    BaselineCTR: r.baselineCTR,
    ExpectedBucket: r.expectedBucket,
    ExpectedPosition: r.expectedPosition,
    BaselineSessions: r.baselineClicks,
    EstimatedSessions: r.estimatedClicks,
    IncrementalSessions: r.incrementalClicks,
    URL: r.url ?? "",
    Country: r.country ?? "",
    Device: r.device ?? "",
    Intent: r.intent ?? "",
    KD: r.kd ?? "",
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Table");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(new Blob([out], { type: "application/octet-stream" }), filename);
}

function download(data: any, filename: string, type?: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: type ?? "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
