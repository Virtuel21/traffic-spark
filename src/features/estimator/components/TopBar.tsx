import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FileUploader from "./FileUploader";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Link } from "react-router-dom";

interface Props {
  onFile: (file: File) => void;
  loadSample: boolean;
  setLoadSample: (v: boolean) => void;
}

export default function TopBar({ onFile, loadSample, setLoadSample }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Estimateur de Trafic SEO Incrémental</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={loadSample} onCheckedChange={(v) => setLoadSample(!!v)} />
            <span className="text-sm flex items-center gap-2">Charger des données d'exemple <HelpTooltip content="Aperçu rapide avec ~30 lignes de démonstration ; désactivez pour revenir à votre fichier." /></span>
          </div>
          <div className="flex items-center gap-2">
            <FileUploader onFile={onFile} />
            <HelpTooltip content="Téléversez un export CSV/XLSX SEMrush (première feuille). Mappez ensuite les colonnes à gauche." />
          </div>
          <Button asChild variant="secondary"><a href="https://semrush.com" target="_blank" rel="noreferrer">SEMrush</a></Button>
          <Link to="/manual" className="text-sm underline">Mode d'emploi</Link>
        </div>
      </div>
    </header>
  );
}

