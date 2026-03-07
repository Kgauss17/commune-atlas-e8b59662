import { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface VoterTableProps {
  voters: Voter[];
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 48;
const PAGE_SIZE_OPTIONS = [50, 100, 500, 1000, 5000];

type SortKey = keyof Voter | null;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: keyof Voter | null; label: string; width: string; mono?: boolean }[] = [
  { key: null, label: '#', width: 'w-12' },
  { key: 'cin', label: 'CIN', width: 'w-28', mono: true },
  { key: 'lastName', label: 'Nom', width: 'w-32' },
  { key: 'firstName', label: 'Prénom', width: 'w-32' },
  { key: 'gender', label: 'Genre', width: 'w-16' },
  { key: 'commune', label: 'Commune', width: 'w-32' },
  { key: 'circonscription', label: 'Circ.', width: 'w-20', mono: true },
  { key: 'bvName', label: 'BV', width: 'w-28', mono: true },
  { key: 'bvAddress', label: 'Adresse BV', width: 'flex-1 min-w-[200px]' },
  { key: 'province', label: 'Province', width: 'w-28' },
];

const VoterTable = ({ voters }: VoterTableProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const available = window.innerHeight - rect.top - 120;
        setListHeight(Math.max(300, Math.min(available, 700)));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey) return voters;
    const k = sortKey;
    return [...voters].sort((a, b) => {
      const av = String(a[k] ?? '');
      const bv = String(b[k] ?? '');
      const cmp = av.localeCompare(bv, 'fr', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [voters, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = page * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const virtualizer = useVirtualizer({
    count: paged.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const handleSort = (key: keyof Voter | null) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun résultat</p>
        <p className="text-sm">Modifiez vos filtres ou importez un fichier</p>
      </div>
    );
  }

  const safePage = (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1)));

  const SortIcon = ({ col }: { col: keyof Voter | null }) => {
    if (!col) return null;
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center data-table-header border-b border-border" style={{ height: HEADER_HEIGHT }}>
          {COLUMNS.map((col, i) => (
            <div
              key={i}
              className={`${col.width} px-3 font-medium text-muted-foreground text-sm shrink-0 ${col.key ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''} flex items-center gap-1`}
              onClick={() => handleSort(col.key)}
            >
              {col.label}
              <SortIcon col={col.key} />
            </div>
          ))}
        </div>
        {/* Virtualized body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: Math.min(listHeight, paged.length * ROW_HEIGHT) }}
        >
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const v = paged[virtualRow.index];
              if (!v) return null;
              const globalIndex = start + virtualRow.index;
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex items-center border-b border-border text-sm ${
                    virtualRow.index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                  } hover:bg-muted/50 transition-colors`}
                >
                  <div className="w-12 px-3 font-mono text-xs text-muted-foreground shrink-0">{globalIndex + 1}</div>
                  <div className="w-28 px-3 font-mono font-medium shrink-0 truncate">{v.cin}</div>
                  <div className="w-32 px-3 shrink-0 truncate">{v.lastName}</div>
                  <div className="w-32 px-3 shrink-0 truncate">{v.firstName}</div>
                  <div className="w-16 px-3 shrink-0 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.gender === 'm' ? 'bg-info/10 text-info' : 'bg-accent text-accent-foreground'
                    }`}>
                      {v.gender === 'm' ? 'M' : 'F'}
                    </span>
                  </div>
                  <div className="w-32 px-3 shrink-0 truncate">{v.commune}</div>
                  <div className="w-20 px-3 font-mono shrink-0 truncate">{v.circonscription}</div>
                  <div className="w-28 px-3 font-mono shrink-0 truncate">{v.bvName}</div>
                  <div className="flex-1 min-w-[200px] px-3 text-muted-foreground truncate">{v.bvAddress}</div>
                  <div className="w-28 px-3 shrink-0 truncate">{v.province}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{start + 1}–{Math.min(start + pageSize, sorted.length)} sur {sorted.length}</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-[85px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>par page</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => safePage(0)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => safePage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => safePage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => safePage(totalPages - 1)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoterTable;
