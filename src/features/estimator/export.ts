import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Bucket, TableRow } from "./types";
import { BUCKET_LABELS } from "./constants";

export function exportTableCSV(rows: TableRow[], filename = "estimator-table.csv") {
  const csv = Papa.unparse(rows.map(r => ({
    Keyword: r.keyword,
    Position: r.position,
    Volume: r.volume,
    Cohort: r.cohort,
    BaselineBucket: BUCKET_LABELS[r.baselineBucket],
    BaselineCTR: r.baselineCTR,
    ExpectedBucket: r.expectedBucket ? BUCKET_LABELS[r.expectedBucket as Bucket] : "",
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
    BaselineBucket: BUCKET_LABELS[r.baselineBucket],
    BaselineCTR: r.baselineCTR,
    ExpectedBucket: r.expectedBucket ? BUCKET_LABELS[r.expectedBucket as Bucket] : "",
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
