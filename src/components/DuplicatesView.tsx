import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Voter } from '@/types/voter';

interface DuplicatesViewProps {
  voters: Voter[];
}

const DuplicatesView = ({ voters }: DuplicatesViewProps) => {
  const duplicatesByCommune = useMemo(() => {
    // Group voters by CIN
    const cinMap = new Map<string, Voter[]>();
    voters.forEach((v) => {
      if (!v.cin) return;
      const key = v.cin.trim();
      if (!cinMap.has(key)) cinMap.set(key, []);
      cinMap.get(key)!.push(v);
    });

    // Keep only duplicates (CIN appearing more than once)
    const duplicates = new Map<string, Voter[]>();
    cinMap.forEach((entries, cin) => {
      if (entries.length > 1) duplicates.set(cin, entries);
    });

    // Group duplicates by commune
    const communeMap = new Map<string, { cin: string; voters: Voter[] }[]>();
    duplicates.forEach((entries, cin) => {
      const communes = [...new Set(entries.map((v) => v.commune))];
      communes.forEach((commune) => {
        if (!communeMap.has(commune)) communeMap.set(commune, []);
        const communeVoters = entries.filter((v) => v.commune === commune);
        // Only add if not already added for this commune
        const existing = communeMap.get(commune)!;
        if (!existing.find((e) => e.cin === cin)) {
          existing.push({ cin, voters: entries });
        }
      });
    });

    return communeMap;
  }, [voters]);

  const totalDuplicates = useMemo(() => {
    const seen = new Set<string>();
    duplicatesByCommune.forEach((entries) => {
      entries.forEach((e) => seen.add(e.cin));
    });
    return seen.size;
  }, [duplicatesByCommune]);

  if (totalDuplicates === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun doublon détecté</p>
        <p className="text-sm">Tous les CIN sont uniques dans les données filtrées</p>
      </div>
    );
  }

  const sortedCommunes = [...duplicatesByCommune.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="text-sm px-3 py-1">
          {totalDuplicates} CIN en doublon
        </Badge>
      </div>

      {sortedCommunes.map(([commune, entries]) => (
        <div key={commune} className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{commune}</h3>
            <Badge variant="secondary">{entries.length} doublon(s)</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="data-table-header">
                  <TableHead>CIN</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Circ.</TableHead>
                  <TableHead>BV</TableHead>
                  <TableHead>Occurrences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(({ cin, voters: dupVoters }) =>
                  dupVoters.map((v, i) => (
                    <TableRow
                      key={`${cin}-${i}`}
                      className={i === 0 ? 'border-t-2 border-t-destructive/30' : 'bg-muted/20'}
                    >
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
                      <TableCell className="font-mono">{v.circonscription}</TableCell>
                      <TableCell className="font-mono">{v.bvName}</TableCell>
                      {i === 0 && (
                        <TableCell rowSpan={dupVoters.length} className="text-center">
                          <Badge variant="destructive">{dupVoters.length}</Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DuplicatesView;
