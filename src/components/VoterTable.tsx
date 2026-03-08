import { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Users } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface VoterTableProps {
  voters: Voter[];
}

const ROW_HEIGHT = 42;
const HEADER_HEIGHT = 44;
const PAGE_SIZE_OPTIONS = [50, 100, 500, 1000, 5000];

type SortKey = keyof Voter | null;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: keyof Voter; label: string; width: string; mono?: boolean }[] = [
  { key: 'orderNumber', label: 'الرقم الترتيبي', width: 'w-16', mono: true },
  { key: 'cin', label: 'رقم بطاقة التعريف', width: 'w-28', mono: true },
  { key: 'address', label: 'العنوان بدقة', width: 'w-36' },
  { key: 'birthDate', label: 'تاريخ الازدياد', width: 'w-28' },
  { key: 'firstName', label: 'الاسم الشخصي للناخب', width: 'w-32' },
  { key: 'lastName', label: 'الاسم العائلي للناخب', width: 'w-32' },
  { key: 'gender', label: 'الجنس', width: 'w-20' },
  { key: 'circonscription', label: 'الدائرة الانتخابية', width: 'w-24', mono: true },
  { key: 'commune', label: 'الجماعة', width: 'w-36' },
  { key: 'bvName', label: 'اسم مكتب التصويت', width: 'w-28', mono: true },
  { key: 'bvAddress', label: 'عنوان مكتب التصويت', width: 'w-36' },
  { key: 'bvLocation', label: 'مكان مكتب التصويت', width: 'w-32' },
  { key: 'province', label: 'العمالة او الاقليم', width: 'w-32' },
];

// Color hash for commune badges
const COMMUNE_COLORS = [
  'bg-primary/15 text-primary',
  'bg-info/15 text-info',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-accent text-accent-foreground',
  'bg-destructive/15 text-destructive',
];

const CIRCONS_COLORS = [
  'bg-info/20 text-info',
  'bg-primary/20 text-primary',
  'bg-success/20 text-success',
  'bg-warning/20 text-warning',
];

function hashColor(str: string, colors: string[]): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

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

  // Default sort: commune > circonscription > orderNumber
  const sorted = useMemo(() => {
    if (sortKey) {
      const k = sortKey;
      return [...voters].sort((a, b) => {
        const av = String(a[k] ?? '');
        const bv = String(b[k] ?? '');
        const cmp = av.localeCompare(bv, 'ar', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    // Default multi-level sort
    return [...voters].sort((a, b) => {
      const c1 = String(a.commune ?? '').localeCompare(String(b.commune ?? ''), 'ar');
      if (c1 !== 0) return c1;
      const c2 = String(a.circonscription ?? '').localeCompare(String(b.circonscription ?? ''), 'ar', { numeric: true });
      if (c2 !== 0) return c2;
      return (a.orderNumber ?? 0) - (b.orderNumber ?? 0);
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
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Card - AdminLTE v4 style */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Liste Électorale</h3>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              {voters.length.toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Afficher
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-7 w-[75px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            entrées
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center bg-muted/40 border-b border-border" style={{ height: HEADER_HEIGHT }}>
          {COLUMNS.map((col, i) => (
            <div
              key={i}
              className={`${col.width} px-3 font-semibold text-xs text-muted-foreground shrink-0 ${col.key ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''} flex items-center gap-1 uppercase tracking-wide`}
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
                  className={`flex items-center border-b border-border/50 text-sm ${
                    virtualRow.index % 2 === 0 ? 'bg-card' : 'bg-muted/15'
                  } hover:bg-primary/5 transition-colors`}
                >
                  {/* # */}
                  <div className="w-12 px-3 font-mono text-xs text-muted-foreground shrink-0">
                    {globalIndex + 1}
                  </div>
                  {/* CIN */}
                  <div className="w-28 px-3 shrink-0 truncate">
                    <span className="font-mono text-xs font-semibold bg-muted/30 px-1.5 py-0.5 rounded">
                      {v.cin}
                    </span>
                  </div>
                  {/* Nom */}
                  <div className="w-32 px-3 shrink-0 truncate font-medium text-card-foreground">{v.lastName}</div>
                  {/* Prénom */}
                  <div className="w-32 px-3 shrink-0 truncate">{v.firstName}</div>
                  {/* Genre */}
                  <div className="w-20 px-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.gender === 'ذ' || v.gender === 'm' || v.gender === 'M'
                        ? 'bg-info/15 text-info'
                        : 'bg-destructive/15 text-destructive'
                    }`}>
                      {v.gender === 'ذ' || v.gender === 'm' || v.gender === 'M' ? '♂ ذكر' : '♀ أنثى'}
                    </span>
                  </div>
                  {/* Commune */}
                  <div className="w-36 px-3 shrink-0 truncate">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${hashColor(v.commune, COMMUNE_COLORS)}`}>
                      {v.commune}
                    </span>
                  </div>
                  {/* Circonscription */}
                  <div className="w-24 px-3 shrink-0 truncate">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-medium ${hashColor(v.circonscription, CIRCONS_COLORS)}`}>
                      {v.circonscription}
                    </span>
                  </div>
                  {/* BV */}
                  <div className="w-28 px-3 font-mono text-xs shrink-0 truncate">{v.bvName}</div>
                  {/* Adresse BV */}
                  <div className="flex-1 min-w-[180px] px-3 text-xs text-muted-foreground truncate">{v.bvAddress}</div>
                  {/* Province */}
                  <div className="w-32 px-3 shrink-0 truncate">
                    <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded">
                      {v.province}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer - Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Affichage de <strong>{start + 1}</strong> à <strong>{Math.min(start + pageSize, sorted.length)}</strong> sur <strong>{sorted.length.toLocaleString('fr-FR')}</strong> entrées
          </span>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page === 0} onClick={() => safePage(0)}>
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page === 0} onClick={() => safePage(page - 1)}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i;
              } else if (page < 3) {
                p = i;
              } else if (page > totalPages - 4) {
                p = totalPages - 5 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => safePage(p)}
                >
                  {p + 1}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => safePage(page + 1)}>
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => safePage(totalPages - 1)}>
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterTable;
