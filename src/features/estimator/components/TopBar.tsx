import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FileUploader from "./FileUploader";

interface Props {
  onFile: (file: File) => void;
  loadSample: boolean;
  setLoadSample: (v: boolean) => void;
}

export default function TopBar({ onFile, loadSample, setLoadSample }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">SEO Incremental Traffic Estimator</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={loadSample} onCheckedChange={(v) => setLoadSample(!!v)} />
            <span className="text-sm">Load Sample Data</span>
          </div>
          <FileUploader onFile={onFile} />
          <Button asChild variant="secondary"><a href="https://semrush.com" target="_blank" rel="noreferrer">SEMrush</a></Button>
        </div>
      </div>
    </header>
  );
}
