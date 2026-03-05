import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { parseExcelFile } from '@/lib/excelParser';
import type { Voter } from '@/types/voter';
import { toast } from 'sonner';

interface ImportButtonProps {
  onImport: (voters: Voter[]) => void;
}

const ImportButton = ({ onImport }: ImportButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const voters = await parseExcelFile(file, (pct) => setProgress(pct));
      onImport(voters);
      toast.success(`${voters.length.toLocaleString()} électeurs importés avec succès`);
    } catch {
      toast.error("Erreur lors de l'importation du fichier");
    } finally {
      setLoading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3">
      {loading && (
        <div className="flex items-center gap-2 min-w-[180px]">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <Button onClick={() => inputRef.current?.click()} className="gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? 'Importation…' : 'Importer'}
      </Button>
    </div>
  );
};

export default ImportButton;
