import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface Props { onFile: (file: File) => void; }

export default function FileUploader({ onFile }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Input ref={ref} type="file" accept=".csv,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <Button variant="default" onClick={() => ref.current?.click()} className="flex items-center gap-2">
        <Upload className="w-4 h-4" /> Importer CSV/XLSX
      </Button>
    </div>
  );
}
