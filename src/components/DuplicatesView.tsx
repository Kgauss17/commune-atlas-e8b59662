import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { generateDuplicatesPDF } from '@/lib/pdfGenerator';
import type { Voter } from '@/types/voter';

interface DuplicatesViewProps {
  voters: Voter[];
}

const COMMUNE_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
];

const DuplicatesView = ({ voters }: DuplicatesViewProps) => {
  const { flatRows, totalDuplicates, communeColorMap } = useMemo(() => {
    // Group voters by CIN
    const cinMap = new Map<string, Voter[]>();
    voters.forEach((v) => {
      if (!v.cin) return;
      const key = v.cin.trim();
      if (!cinMap.has(key)) cinMap.set(key, []);
      cinMap.get(key)!.push(v);
    });

    // Keep only duplicates
    const duplicates: { cin: string; voters: Voter[] }[] = [];
    cinMap.forEach((entries, cin) => {
      if (entries.length > 1) duplicates.push({ cin, voters: entries });
    });

    // Build color map for communes
    const allCommunes = [...new Set(duplicates.flatMap(d => d.voters.map(v => v.commune)))].sort();
    const colorMap = new Map<string, string>();
    allCommunes.forEach((c, i) => colorMap.set(c, COMMUNE_COLORS[i % COMMUNE_COLORS.length]));

    // Flatten into rows with commune column
    const rows: { voter: Voter; cin: string; occurrences: number; isFirst: boolean; groupSize: number }[] = [];
    duplicates.sort((a, b) => a.cin.localeCompare(b.cin));
    duplicates.forEach(({ cin, voters: dupVoters }) => {
      dupVoters.forEach((v, i) => {
        rows.push({ voter: v, cin, occurrences: dupVoters.length, isFirst: i === 0, groupSize: dupVoters.length });
      });
    });

    return { flatRows: rows, totalDuplicates: duplicates.length, communeColorMap: colorMap };
  }, [voters]);

  if (totalDuplicates === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun doublon détecté</p>
        <p className="text-sm">Tous les CIN sont uniques dans les données filtrées</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="destructive" className="text-sm px-3 py-1">
          {totalDuplicates} CIN en doublon
        </Badge>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="data-table-header">
                <TableHead>CIN</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead>Circ.</TableHead>
                <TableHead>BV</TableHead>
                <TableHead>Occurrences</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatRows.map((row, idx) => (
                <TableRow
                  key={`${row.cin}-${idx}`}
                  className={row.isFirst ? 'border-t-2 border-t-destructive/30' : 'bg-muted/20'}
                >
                  <TableCell className="font-mono font-medium">{row.voter.cin}</TableCell>
                  <TableCell>{row.voter.lastName}</TableCell>
                  <TableCell>{row.voter.firstName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.voter.gender === 'm' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                    }`}>
                      {row.voter.gender === 'm' ? 'M' : 'F'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${communeColorMap.get(row.voter.commune) || ''}`}>
                      {row.voter.commune}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{row.voter.circonscription}</TableCell>
                  <TableCell className="font-mono">{row.voter.bvName}</TableCell>
                  {row.isFirst && (
                    <TableCell rowSpan={row.groupSize} className="text-center">
                      <Badge variant="destructive">{row.occurrences}</Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => generateDuplicatesPDF(voters)}
        >
          <FileText className="h-4 w-4" /> Exporter PDF Doublons
        </Button>
      </div>
    </div>
  );
};

export default DuplicatesView;
