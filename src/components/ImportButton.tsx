import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseExcelFile } from '@/lib/excelParser';
import type { Voter } from '@/types/voter';
import { toast } from 'sonner';

interface ImportButtonProps {
  onImport: (voters: Voter[]) => void;
}

const ImportButton = ({ onImport }: ImportButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const voters = await parseExcelFile(file);
      onImport(voters);
      toast.success(`${voters.length} électeurs importés avec succès`);
    } catch {
      toast.error("Erreur lors de l'importation du fichier");
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <Button onClick={() => inputRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" />
        Importer
      </Button>
    </>
  );
};

export default ImportButton;
