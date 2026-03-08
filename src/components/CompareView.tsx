import { useRef, useState, useMemo } from 'react';
import { Upload, Loader2, Plus, Minus, RefreshCw, FileText, ChevronLeft, ChevronRight, ArrowRightLeft, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  newMap.forEach((nv, cin) => {
    const ov = oldMap.get(cin);
    if (!ov) {
      added.push(nv);
    } else {
      const changes: string[] = [];
      const fields: (keyof Voter)[] = ['firstName', 'lastName', 'gender', 'commune', 'circonscription', 'bvName', 'bvAddress', 'address', 'province', 'birthDate'];
      fields.forEach(f => {
        if (String(ov[f] ?? '') !== String(nv[f] ?? '')) changes.push(f);
      });
      if (changes.length > 0) modified.push({ old: ov, new: nv, changes });
    }
  });

  oldMap.forEach((ov, cin) => {
    if (!newMap.has(cin)) removed.push(ov);
  });

  return { added, removed, modified };
}

const FIELD_LABELS: Record<string, { fr: string; ar: string }> = {
  firstName: { fr: 'Prénom', ar: 'الاسم' },
  lastName: { fr: 'Nom', ar: 'النسب' },
  gender: { fr: 'Genre', ar: 'الجنس' },
  commune: { fr: 'Commune', ar: 'الجماعة' },
  circonscription: { fr: 'Circonscription', ar: 'الدائرة الانتخابية' },
  bvName: { fr: 'Bureau de vote', ar: 'مكتب التصويت' },
  bvAddress: { fr: 'Adresse BV', ar: 'عنوان مكتب التصويت' },
  address: { fr: 'Adresse', ar: 'العنوان' },
  province: { fr: 'Province', ar: 'الإقليم' },
  birthDate: { fr: 'Date naissance', ar: 'تاريخ الازدياد' },
};

const PAGE_SIZES = [10, 25, 50, 100];

// Pagination hook
function usePagination<T>(items: T[], defaultPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.ceil(items.length / pageSize);
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return { currentPage, pageSize, totalPages, paginatedItems, goToPage, setPageSize: (s: number) => { setPageSize(s); setCurrentPage(1); }, getPageNumbers, setCurrentPage };
}

// Pagination bar component
function PaginationBar({ currentPage, totalPages, pageSize, totalItems, goToPage, setPageSize, getPageNumbers }: {
  currentPage: number; totalPages: number; pageSize: number; totalItems: number;
  goToPage: (p: number) => void; setPageSize: (s: number) => void; getPageNumbers: () => (number | string)[];
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-t bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Afficher</span>
        <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span>sur {totalItems.toLocaleString()} résultats</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => goToPage(1)}>
          <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => goToPage(p)}>
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => goToPage(totalPages)}>
          <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Stats summary of modifications by field
function ModificationSummary({ items }: { items: { old: Voter; new: Voter; changes: string[] }[] }) {
  const fieldCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      item.changes.forEach(field => {
        counts[field] = (counts[field] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);

  if (fieldCounts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
      {fieldCounts.map(([field, count]) => (
        <div key={field} className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{count}</p>
          <p className="text-xs text-muted-foreground">{FIELD_LABELS[field]?.fr || field}</p>
          <p className="text-xs text-muted-foreground/70 font-arabic" dir="rtl">{FIELD_LABELS[field]?.ar || ''}</p>
        </div>
      ))}
    </div>
  );
}

// Geographic summary - commune/circons breakdown
function GeographicBreakdown({ label, voters }: { label: string; voters: Voter[] }) {
  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    voters.forEach(v => {
      const key = `${v.commune} / ${v.circonscription}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [voters]);

  if (breakdown.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Répartition géographique — {label}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {breakdown.slice(0, 9).map(([key, count]) => (
          <div key={key} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs truncate flex-1">{key}</span>
            <Badge variant="secondary" className="ml-2 text-xs">{count}</Badge>
          </div>
        ))}
        {breakdown.length > 9 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            +{breakdown.length - 9} autres zones
          </div>
        )}
      </div>
    </div>
  );
}

const CompareView = ({ currentVoters }: CompareViewProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareVoters2, setCompareVoters] = useState<Voter[] | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const diff = useMemo<DiffResult | null>(() => {
    if (!compareVoters2) return null;
    return compareVoters(currentVoters, compareVoters2);
  }, [currentVoters, compareVoters2]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setNewFileName(file.name);
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
          <ArrowRightLeft className="h-10 w-10" />
        </div>
        <p className="text-lg font-medium">Comparaison de deux fichiers Excel</p>
        <p className="text-sm text-center max-w-lg">
          Le fichier <strong>original</strong> est celui actuellement chargé dans l'application ({currentVoters.length.toLocaleString()} électeurs).
          <br />
          Importez un <strong>nouveau fichier</strong> pour détecter automatiquement toutes les différences :
          ajouts, suppressions et modifications champ par champ (identifié par CIN).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 max-w-lg w-full">
          <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
            <Plus className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-medium">Nouveaux électeurs</span>
            <span className="text-[10px] text-muted-foreground">CIN absents de l'original</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
            <Minus className="h-5 w-5 text-destructive" />
            <span className="text-xs font-medium">Électeurs supprimés</span>
            <span className="text-[10px] text-muted-foreground">CIN absents du nouveau</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
            <RefreshCw className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-medium">Champs modifiés</span>
            <span className="text-[10px] text-muted-foreground">Nom, commune, BV…</span>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 w-48">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs">{progress}%</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <Button onClick={() => inputRef.current?.click()} className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer le nouveau fichier
        </Button>
      </div>
    );
  }

  const unchanged = currentVoters.length - diff.removed.length - diff.modified.length;
  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Résumé de la comparaison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            <div className="rounded-lg border bg-card p-3 text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{currentVoters.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Fichier original</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{compareVoters2!.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground truncate" title={newFileName}>Nouveau fichier</p>
            </div>
            <div className="rounded-lg border bg-emerald-500/10 p-3 text-center">
              <Plus className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600">{diff.added.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Ajoutés</p>
            </div>
            <div className="rounded-lg border bg-destructive/10 p-3 text-center">
              <Minus className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold text-destructive">{diff.removed.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Supprimés</p>
            </div>
            <div className="rounded-lg border bg-amber-500/10 p-3 text-center">
              <RefreshCw className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{diff.modified.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Modifiés</p>
            </div>
          </div>

          {/* Progress bar visual */}
          {currentVoters.length > 0 && (
            <div className="space-y-1">
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {unchanged > 0 && (
                  <div className="bg-muted-foreground/30 h-full" style={{ width: `${(unchanged / currentVoters.length) * 100}%` }} title={`${unchanged} inchangés`} />
                )}
                {diff.added.length > 0 && (
                  <div className="bg-emerald-500 h-full" style={{ width: `${(diff.added.length / (currentVoters.length + diff.added.length)) * 100}%` }} title={`${diff.added.length} ajoutés`} />
                )}
                {diff.removed.length > 0 && (
                  <div className="bg-destructive h-full" style={{ width: `${(diff.removed.length / currentVoters.length) * 100}%` }} title={`${diff.removed.length} supprimés`} />
                )}
                {diff.modified.length > 0 && (
                  <div className="bg-amber-500 h-full" style={{ width: `${(diff.modified.length / currentVoters.length) * 100}%` }} title={`${diff.modified.length} modifiés`} />
                )}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Inchangés ({unchanged.toLocaleString()})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Ajoutés</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Supprimés</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Modifiés</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {totalChanges === 0 && (
            <Badge variant="outline" className="gap-1 text-emerald-600">
              ✓ Les deux fichiers sont identiques
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button variant="outline" size="sm" onClick={() => { setCompareVoters(null); setNewFileName(''); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Comparer un autre fichier
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={diff.added.length > 0 ? 'added' : diff.removed.length > 0 ? 'removed' : 'modified'}>
        <TabsList>
          <TabsTrigger value="added" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Ajoutés ({diff.added.length.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-1.5">
            <Minus className="h-3.5 w-3.5" /> Supprimés ({diff.removed.length.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="modified" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Modifiés ({diff.modified.length.toLocaleString()})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="added" className="mt-4 space-y-4">
          <GeographicBreakdown label="Ajouts" voters={diff.added} />
          <VoterDiffTable voters={diff.added} type="added" />
        </TabsContent>
        <TabsContent value="removed" className="mt-4 space-y-4">
          <GeographicBreakdown label="Suppressions" voters={diff.removed} />
          <VoterDiffTable voters={diff.removed} type="removed" />
        </TabsContent>
        <TabsContent value="modified" className="mt-4 space-y-4">
          <ModificationSummary items={diff.modified} />
          <ModifiedTable items={diff.modified} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function VoterDiffTable({ voters, type }: { voters: Voter[]; type: 'added' | 'removed' }) {
  const { currentPage, pageSize, totalPages, paginatedItems, goToPage, setPageSize, getPageNumbers } = usePagination(voters);

  if (voters.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Aucun électeur {type === 'added' ? 'ajouté' : 'supprimé'}
      </div>
    );
  }

  const bgClass = type === 'added' ? 'bg-emerald-500/5' : 'bg-destructive/5';
  const globalStart = (currentPage - 1) * pageSize;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead className="w-10">#</TableHead>
              <TableHead>CIN</TableHead>
              <TableHead>النسب</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الجنس</TableHead>
              <TableHead>الجماعة</TableHead>
              <TableHead>الدائرة</TableHead>
              <TableHead>مكتب التصويت</TableHead>
              <TableHead>العنوان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((v, i) => (
              <TableRow key={`${v.cin}-${i}`} className={bgClass}>
                <TableCell className="font-mono text-xs">{globalStart + i + 1}</TableCell>
                <TableCell className="font-mono font-medium">{v.cin}</TableCell>
                <TableCell dir="rtl">{v.lastName}</TableCell>
                <TableCell dir="rtl">{v.firstName}</TableCell>
                <TableCell dir="rtl">{v.gender}</TableCell>
                <TableCell dir="rtl">{v.commune}</TableCell>
                <TableCell dir="rtl">{v.circonscription}</TableCell>
                <TableCell dir="rtl">{v.bvName}</TableCell>
                <TableCell dir="rtl" className="max-w-[200px] truncate">{v.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        currentPage={currentPage} totalPages={totalPages} pageSize={pageSize}
        totalItems={voters.length} goToPage={goToPage} setPageSize={setPageSize} getPageNumbers={getPageNumbers}
      />
    </div>
  );
}

function ModifiedTable({ items }: { items: { old: Voter; new: Voter; changes: string[] }[] }) {
  const { currentPage, pageSize, totalPages, paginatedItems, goToPage, setPageSize, getPageNumbers } = usePagination(items);

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Aucune modification détectée
      </div>
    );
  }

  const globalStart = (currentPage - 1) * pageSize;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead className="w-10">#</TableHead>
              <TableHead>CIN</TableHead>
              <TableHead>النسب / الاسم</TableHead>
              <TableHead>الحقل المعدّل</TableHead>
              <TableHead className="text-destructive">القيمة القديمة</TableHead>
              <TableHead className="text-emerald-600">القيمة الجديدة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item, i) => (
              item.changes.map((field, fi) => (
                <TableRow key={`${item.old.cin}-${field}`} className="bg-amber-500/5 hover:bg-amber-500/10">
                  {fi === 0 && (
                    <>
                      <TableCell rowSpan={item.changes.length} className="font-mono text-xs align-top font-bold">
                        {globalStart + i + 1}
                      </TableCell>
                      <TableCell rowSpan={item.changes.length} className="font-mono font-medium align-top">
                        {item.old.cin}
                      </TableCell>
                      <TableCell rowSpan={item.changes.length} className="align-top" dir="rtl">
                        <div className="font-medium">{item.old.lastName}</div>
                        <div className="text-xs text-muted-foreground">{item.old.firstName}</div>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge variant="outline" className="text-xs w-fit">{FIELD_LABELS[field]?.fr || field}</Badge>
                      <span className="text-[10px] text-muted-foreground mt-0.5" dir="rtl">{FIELD_LABELS[field]?.ar || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-destructive" dir="rtl">
                    <span className="line-through">{String(item.old[field as keyof Voter] ?? '-')}</span>
                  </TableCell>
                  <TableCell className="text-emerald-600 font-medium" dir="rtl">
                    {String(item.new[field as keyof Voter] ?? '-')}
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        currentPage={currentPage} totalPages={totalPages} pageSize={pageSize}
        totalItems={items.length} goToPage={goToPage} setPageSize={setPageSize} getPageNumbers={getPageNumbers}
      />
    </div>
  );
}

export default CompareView;
