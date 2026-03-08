import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { exportMatrixToExcel } from '@/lib/excelExporter';
import type { Voter } from '@/types/voter';

interface MatrixViewProps {
  voters: Voter[];
}

interface BvInfo {
  name: string;
  circons: string;
}

const MatrixView = ({ voters }: MatrixViewProps) => {
  const { communes, circonsMap, bvList, cellMap, communeTotals, circonsTotals, bvTotals, grandTotal } = useMemo(() => {
    // Collect unique communes
    const communeSet = new Set<string>();
    // Map: circonscription -> Set<bvName>
    const circBvMap = new Map<string, Set<string>>();
    // Map: `commune||circons||bv` -> count
    const cellMap = new Map<string, number>();

    voters.forEach((v) => {
      communeSet.add(v.commune);
      if (!circBvMap.has(v.circonscription)) circBvMap.set(v.circonscription, new Set());
      circBvMap.get(v.circonscription)!.add(v.bvName);
      const key = `${v.commune}||${v.circonscription}||${v.bvName}`;
      cellMap.set(key, (cellMap.get(key) || 0) + 1);
    });

    const communes = [...communeSet].sort();
    // Sort circonscriptions and build ordered BV list
    const circonsKeys = [...circBvMap.keys()].sort((a, b) => Number(a) - Number(b));
    const circonsMap = new Map<string, string[]>();
    const bvList: BvInfo[] = [];

    circonsKeys.forEach((c) => {
      const bvs = [...circBvMap.get(c)!].sort();
      circonsMap.set(c, bvs);
      bvs.forEach((bv) => bvList.push({ name: bv, circons: c }));
    });

    // Totals per commune (row total)
    const communeTotals = new Map<string, number>();
    communes.forEach((com) => {
      let t = 0;
      bvList.forEach((bv) => {
        t += cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0;
      });
      communeTotals.set(com, t);
    });

    // Totals per circonscription
    const circonsTotals = new Map<string, number>();
    circonsKeys.forEach((c) => {
      let t = 0;
      communes.forEach((com) => {
        circonsMap.get(c)!.forEach((bv) => {
          t += cellMap.get(`${com}||${c}||${bv}`) || 0;
        });
      });
      circonsTotals.set(c, t);
    });

    // Totals per BV column
    const bvTotals = new Map<string, number>();
    bvList.forEach((bv) => {
      let t = 0;
      communes.forEach((com) => {
        t += cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0;
      });
      bvTotals.set(`${bv.circons}||${bv.name}`, t);
    });

    const grandTotal = voters.length;

    return { communes, circonsMap, bvList, cellMap, communeTotals, circonsTotals, bvTotals, grandTotal };
  }, [voters]);

  if (voters.length === 0) return null;

  const circonsKeys = [...circonsMap.keys()];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              {/* Row 1: Commune + Circonscriptions (merged over their BVs) + Total */}
              <TableRow className="bg-primary text-primary-foreground">
                <TableHead
                  rowSpan={2}
                  className="text-primary-foreground font-bold border-r border-primary-foreground/20 min-w-[160px] sticky left-0 bg-primary z-10"
                >
                  الجماعة
                </TableHead>
                {circonsKeys.map((c) => (
                  <TableHead
                    key={c}
                    colSpan={circonsMap.get(c)!.length}
                    className="text-center text-primary-foreground font-bold border-r border-primary-foreground/20"
                  >
                    {c}
                  </TableHead>
                ))}
                <TableHead
                  rowSpan={2}
                  className="text-center text-primary-foreground font-bold min-w-[80px]"
                >
                  المجموع
                </TableHead>
              </TableRow>
              {/* Row 2: BV names under each circonscription */}
              <TableRow className="bg-primary/80 text-primary-foreground">
                {bvList.map((bv, i) => (
                  <TableHead
                    key={i}
                    className="text-center text-primary-foreground text-xs font-medium border-r border-primary-foreground/20 min-w-[70px] whitespace-nowrap"
                  >
                    {bv.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {communes.map((com, ci) => (
                <TableRow key={com} className={ci % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <TableCell className="font-bold border-r border-border sticky left-0 z-10 bg-inherit">
                    {com}
                  </TableCell>
                  {bvList.map((bv, i) => {
                    const val = cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0;
                    return (
                      <TableCell
                        key={i}
                        className="text-center font-mono text-sm border-r border-border"
                      >
                        {val > 0 ? val : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-mono font-bold text-sm bg-primary/5">
                    {communeTotals.get(com) || 0}
                  </TableCell>
                </TableRow>
              ))}
              {/* Footer: totals row */}
              <TableRow className="bg-primary text-primary-foreground font-bold">
                <TableCell className="font-bold border-r border-primary-foreground/20 sticky left-0 bg-primary z-10">
                  المجموع
                </TableCell>
                {bvList.map((bv, i) => (
                  <TableCell
                    key={i}
                    className="text-center font-mono text-sm border-r border-primary-foreground/20"
                  >
                    {bvTotals.get(`${bv.circons}||${bv.name}`) || 0}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold text-sm">
                  {grandTotal}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex justify-end p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => exportMatrixToExcel(communes, circonsMap, bvList, cellMap, communeTotals, bvTotals, grandTotal)}
        >
          <Download className="h-3.5 w-3.5" /> Exporter Matrice XLS
        </Button>
      </div>
    </div>
  );
};

export default MatrixView;
