import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MatrixRow } from '@/types/voter';

interface MatrixViewProps {
  data: MatrixRow[];
}

const MatrixView = ({ data }: MatrixViewProps) => {
  if (data.length === 0) return null;

  const total = data.reduce((s, r) => s + r.count, 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead>Commune</TableHead>
              <TableHead>Circonscription</TableHead>
              <TableHead>Bureau de Vote</TableHead>
              <TableHead className="text-right">Nb Électeurs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i} className="hover:bg-muted/50">
                <TableCell className="font-medium">{r.commune}</TableCell>
                <TableCell className="font-mono">{r.circonscription}</TableCell>
                <TableCell className="font-mono">{r.bv}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{r.count}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right font-mono">{total}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MatrixView;
