import { KeywordRow } from "./types";

export function generateSampleRows(): KeywordRow[] {
  const intents = ["informational","commercial","navigational"];
  const devices = ["desktop","mobile"];
  const countries = ["US","FR","DE","UK"];
  const rows: KeywordRow[] = [];
  for (let i = 0; i < 30; i++) {
    const position = 4 + Math.floor(Math.random() * 40);
    const volume = 100 + Math.floor(Math.random() * 5000);
    rows.push({
      keyword: `sample keyword ${i+1}`,
      position,
      volume,
      url: `https://example.com/page-${1 + (i % 6)}`,
      country: countries[i % countries.length],
      device: devices[i % devices.length],
      intent: intents[i % intents.length],
      kd: 20 + Math.floor(Math.random() * 70),
      serpFeatures: i % 5 === 0 ? "Shopping, Video" : i % 3 === 0 ? "Sitelinks, Video" : "",
    });
  }
  return rows;
}
