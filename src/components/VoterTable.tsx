import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface VoterTableProps {
  voters: Voter[];
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 48;
const PAGE_SIZE_OPTIONS = [50, 100, 500, 1000, 5000];

const VoterTable = ({ voters }: VoterTableProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
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

  const totalPages = Math.ceil(voters.length / pageSize);
  const start = page * pageSize;
  const paged = voters.slice(start, start + pageSize);

  const virtualizer = useVirtualizer({
    count: paged.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  if (voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun résultat</p>
        <p className="text-sm">Modifiez vos filtres ou importez un fichier</p>
      </div>
    );
  }

  const safePage = (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1)));

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center data-table-header border-b border-border" style={{ height: HEADER_HEIGHT }}>
          <div className="w-12 px-3 font-medium text-muted-foreground text-sm shrink-0">#</div>
          <div className="w-28 px-3 font-medium text-muted-foreground text-sm shrink-0">CIN</div>
          <div className="w-32 px-3 font-medium text-muted-foreground text-sm shrink-0">Nom</div>
          <div className="w-32 px-3 font-medium text-muted-foreground text-sm shrink-0">Prénom</div>
          <div className="w-16 px-3 font-medium text-muted-foreground text-sm shrink-0">Genre</div>
          <div className="w-32 px-3 font-medium text-muted-foreground text-sm shrink-0">Commune</div>
          <div className="w-20 px-3 font-medium text-muted-foreground text-sm shrink-0">Circ.</div>
          <div className="w-28 px-3 font-medium text-muted-foreground text-sm shrink-0">BV</div>
          <div className="flex-1 min-w-[200px] px-3 font-medium text-muted-foreground text-sm">Adresse BV</div>
          <div className="w-28 px-3 font-medium text-muted-foreground text-sm shrink-0">Province</div>
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
                      v.gender === 'm' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
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
          <span>{start + 1}–{Math.min(start + pageSize, voters.length)} sur {voters.length}</span>
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
