import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Voter } from '@/types/voter';

interface VoterTableProps {
  voters: Voter[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const VoterTable = ({ voters }: VoterTableProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  if (voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun résultat</p>
        <p className="text-sm">Modifiez vos filtres ou importez un fichier</p>
      </div>
    );
  }

  const totalPages = Math.ceil(voters.length / pageSize);
  const start = page * pageSize;
  const paged = voters.slice(start, start + pageSize);

  const safePage = (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1)));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="data-table-header">
                <TableHead className="w-12">#</TableHead>
                <TableHead>CIN</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead>Circ.</TableHead>
                <TableHead>BV</TableHead>
                <TableHead>Adresse BV</TableHead>
                <TableHead>Province</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((v, i) => (
                <TableRow key={v.cin + start + i} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{start + i + 1}</TableCell>
                  <TableCell className="font-mono font-medium">{v.cin}</TableCell>
                  <TableCell>{v.lastName}</TableCell>
                  <TableCell>{v.firstName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.gender === 'm' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                    }`}>
                      {v.gender === 'm' ? 'M' : 'F'}
                    </span>
                  </TableCell>
                  <TableCell>{v.commune}</TableCell>
                  <TableCell className="font-mono">{v.circonscription}</TableCell>
                  <TableCell className="font-mono">{v.bvName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.bvAddress}</TableCell>
                  <TableCell>{v.province}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{start + 1}–{Math.min(start + pageSize, voters.length)} sur {voters.length}</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-[75px]">
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
