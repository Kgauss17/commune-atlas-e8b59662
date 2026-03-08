import { useState, useMemo } from 'react';
import { History, Trash2, ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getImportHistory, clearImportHistory, type ImportRecord } from '@/lib/storage';
import { toast } from 'sonner';

interface ImportHistoryProps {
  onClearHistory?: () => void;
}

const PAGE_SIZES = [5, 10, 25, 50];

const ImportHistory = ({ onClearHistory }: ImportHistoryProps) => {
  const [history, setHistory] = useState<ImportRecord[]>(getImportHistory);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        new Date(r.date).toLocaleString('fr-FR').includes(q) ||
        String(r.voterCount).includes(q)
    );
  }, [history, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [filtered, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleClear = () => {
    clearImportHistory();
    setHistory([]);
    onClearHistory?.();
    toast.success('Historique effacé');
  };

  const refresh = () => setHistory(getImportHistory());

  if (history.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Card Header - AdminLTE style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Historique des importations</h3>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
          <Trash2 className="h-3 w-3" /> Effacer
        </Button>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Top controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Afficher
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            entrées
          </div>
          <div className="relative max-w-[200px]">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-7 text-xs pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                >
                  <span className="inline-flex items-center gap-1">
                    Date d'import
                    <ChevronDown className={`h-3 w-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  </span>
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Fichier</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Nb. Électeurs</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((record, i) => (
                <tr key={record.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-2 text-xs">
                    {new Date(record.date).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium truncate max-w-[200px]">{record.fileName}</td>
                  <td className="px-4 py-2 text-xs text-right font-semibold text-primary">
                    {record.voterCount.toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Affichage de {Math.min((page - 1) * pageSize + 1, sorted.length)} à {Math.min(page * pageSize, sorted.length)} sur {sorted.length} entrées
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="px-1">…</span>}
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportHistory;
