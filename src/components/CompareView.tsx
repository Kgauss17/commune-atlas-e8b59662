import { useRef, useState, useMemo } from 'react';
import { Upload, Loader2, Plus, Minus, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { parseExcelFile } from '@/lib/excelParser';
import type { Voter } from '@/types/voter';
import { toast } from 'sonner';

interface CompareViewProps {
  currentVoters: Voter[];
}

interface DiffResult {
  added: Voter[];
  removed: Voter[];
  modified: { old: Voter; new: Voter; changes: string[] }[];
}

function compareVoters(oldVoters: Voter[], newVoters: Voter[]): DiffResult {
  const oldMap = new Map<string, Voter>();
  oldVoters.forEach(v => { if (v.cin) oldMap.set(v.cin.trim(), v); });

  const newMap = new Map<string, Voter>();
  newVoters.forEach(v => { if (v.cin) newMap.set(v.cin.trim(), v); });

  const added: Voter[] = [];
  const removed: Voter[] = [];
  const modified: { old: Voter; new: Voter; changes: string[] }[] = [];

  // Find added and modified
  newMap.forEach((nv, cin) => {
    const ov = oldMap.get(cin);
    if (!ov) {
      added.push(nv);
    } else {
      const changes: string[] = [];
      const fields: (keyof Voter)[] = ['firstName', 'lastName', 'gender', 'commune', 'circonscription', 'bvName', 'bvAddress', 'address', 'province'];
      fields.forEach(f => {
        if (String(ov[f] ?? '') !== String(nv[f] ?? '')) changes.push(f);
      });
      if (changes.length > 0) modified.push({ old: ov, new: nv, changes });
    }
  });

  // Find removed
  oldMap.forEach((ov, cin) => {
    if (!newMap.has(cin)) removed.push(ov);
  });

  return { added, removed, modified };
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  gender: 'Genre',
  commune: 'Commune',
  circonscription: 'Circ.',
  bvName: 'BV',
  bvAddress: 'Adresse BV',
  address: 'Adresse',
  province: 'Province',
};

const CompareView = ({ currentVoters }: CompareViewProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareVoters2, setCompareVoters] = useState<Voter[] | null>(null);

  const diff = useMemo<DiffResult | null>(() => {
    if (!compareVoters2) return null;
    return compareVoters(currentVoters, compareVoters2);
  }, [currentVoters, compareVoters2]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const voters = await parseExcelFile(file, (pct) => setProgress(pct));
      setCompareVoters(voters);
      toast.success(`Fichier de comparaison chargé: ${voters.length.toLocaleString()} électeurs`);
    } catch {
      toast.error("Erreur lors de l'importation du fichier de comparaison");
    } finally {
      setLoading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!diff) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <RefreshCw className="h-10 w-10" />
        </div>
        <p className="text-lg font-medium">Comparer deux fichiers</p>
        <p className="text-sm text-center max-w-md">
          Importez un second fichier Excel pour le comparer avec les données actuelles.
          Les ajouts, suppressions et modifications seront identifiés automatiquement.
        </p>
        {loading && (
          <div className="flex items-center gap-2 w-48">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs">{progress}%</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <Button onClick={() => inputRef.current?.click()} className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer le fichier à comparer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="gap-1 bg-success/10 text-success border-success/20">
            <Plus className="h-3 w-3" /> {diff.added.length} ajoutés
          </Badge>
          <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
            <Minus className="h-3 w-3" /> {diff.removed.length} supprimés
          </Badge>
          <Badge className="gap-1 bg-warning/10 text-warning border-warning/20">
            <RefreshCw className="h-3 w-3" /> {diff.modified.length} modifiés
          </Badge>
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button variant="outline" size="sm" onClick={() => setCompareVoters(null)} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Nouveau fichier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="added">
        <TabsList>
          <TabsTrigger value="added" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Ajoutés ({diff.added.length})
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-1.5">
            <Minus className="h-3.5 w-3.5" /> Supprimés ({diff.removed.length})
          </TabsTrigger>
          <TabsTrigger value="modified" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Modifiés ({diff.modified.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="added" className="mt-4">
          <VoterDiffTable voters={diff.added} type="added" />
        </TabsContent>
        <TabsContent value="removed" className="mt-4">
          <VoterDiffTable voters={diff.removed} type="removed" />
        </TabsContent>
        <TabsContent value="modified" className="mt-4">
          <ModifiedTable items={diff.modified} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function VoterDiffTable({ voters, type }: { voters: Voter[]; type: 'added' | 'removed' }) {
  if (voters.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Aucun électeur {type === 'added' ? 'ajouté' : 'supprimé'}
      </div>
    );
  }

  const bgClass = type === 'added' ? 'bg-success/5' : 'bg-destructive/5';

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead>#</TableHead>
              <TableHead>CIN</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Commune</TableHead>
              <TableHead>Circ.</TableHead>
              <TableHead>BV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.slice(0, 200).map((v, i) => (
              <TableRow key={`${v.cin}-${i}`} className={bgClass}>
                <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                <TableCell className="font-mono font-medium">{v.cin}</TableCell>
                <TableCell>{v.lastName}</TableCell>
                <TableCell>{v.firstName}</TableCell>
                <TableCell>{v.commune}</TableCell>
                <TableCell className="font-mono">{v.circonscription}</TableCell>
                <TableCell className="font-mono">{v.bvName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {voters.length > 200 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t">
          Affichage limité à 200 / {voters.length} résultats
        </div>
      )}
    </div>
  );
}

function ModifiedTable({ items }: { items: { old: Voter; new: Voter; changes: string[] }[] }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Aucune modification détectée
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead>#</TableHead>
              <TableHead>CIN</TableHead>
              <TableHead>Champs modifiés</TableHead>
              <TableHead>Ancienne valeur</TableHead>
              <TableHead>Nouvelle valeur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 200).map((item, i) => (
              item.changes.map((field, fi) => (
                <TableRow key={`${item.old.cin}-${field}`} className="bg-warning/5">
                  {fi === 0 && (
                    <>
                      <TableCell rowSpan={item.changes.length} className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell rowSpan={item.changes.length} className="font-mono font-medium">{item.old.cin}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{FIELD_LABELS[field] || field}</Badge>
                  </TableCell>
                  <TableCell className="text-destructive line-through">
                    {String(item.old[field as keyof Voter] ?? '')}
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    {String(item.new[field as keyof Voter] ?? '')}
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>
      {items.length > 200 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t">
          Affichage limité à 200 / {items.length} résultats
        </div>
      )}
    </div>
  );
}

export default CompareView;
