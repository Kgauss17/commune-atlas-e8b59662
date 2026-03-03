import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Voter } from '@/types/voter';

interface VoterTableProps {
  voters: Voter[];
}

const VoterTable = ({ voters }: VoterTableProps) => {
  if (voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Aucun résultat</p>
        <p className="text-sm">Modifiez vos filtres ou importez un fichier</p>
      </div>
    );
  }

  return (
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
            {voters.map((v, i) => (
              <TableRow key={v.cin + i} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
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
  );
};

export default VoterTable;
