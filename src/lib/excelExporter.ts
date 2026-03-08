import * as XLSX from 'xlsx';
import type { Voter } from '@/types/voter';

export function exportVotersToExcel(voters: Voter[], filename = 'electeurs_filtres.xlsx') {
  const data = voters.map((v, i) => ({
    '#': i + 1,
    'CIN': v.cin,
    'Nom': v.lastName,
    'Prénom': v.firstName,
    'Genre': v.gender === 'm' ? 'Homme' : 'Femme',
    'Date Naissance': v.birthDate,
    'Adresse': v.address,
    'Commune': v.commune,
    'Circonscription': v.circonscription,
    'Bureau de Vote': v.bvName,
    'Adresse BV': v.bvAddress,
    'Province': v.province,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Électeurs');

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((r) => String((r as Record<string, unknown>)[key] ?? '').length)).valueOf() + 2,
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, filename);
}

export function exportMatrixToExcel(
  communes: string[],
  circonsMap: Map<string, string[]>,
  bvList: { name: string; circons: string }[],
  cellMap: Map<string, number>,
  communeTotals: Map<string, number>,
  bvTotals: Map<string, number>,
  grandTotal: number,
  filename = 'matrice_electorale.xlsx'
) {
  const circonsKeys = [...circonsMap.keys()];

  // Row 1: header with circonscriptions
  const header1: (string | number)[] = ['Commune'];
  circonsKeys.forEach((c) => {
    const bvs = circonsMap.get(c)!;
    header1.push(c);
    for (let i = 1; i < bvs.length; i++) header1.push('');
  });
  header1.push('Total');

  // Row 2: BV names
  const header2: (string | number)[] = [''];
  bvList.forEach((bv) => header2.push(bv.name));
  header2.push('');

  // Data rows
  const rows: (string | number)[][] = [];
  communes.forEach((com) => {
    const row: (string | number)[] = [com];
    bvList.forEach((bv) => {
      row.push(cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0);
    });
    row.push(communeTotals.get(com) || 0);
    rows.push(row);
  });

  // Totals row
  const totalsRow: (string | number)[] = ['Total'];
  bvList.forEach((bv) => {
    totalsRow.push(bvTotals.get(`${bv.circons}||${bv.name}`) || 0);
  });
  totalsRow.push(grandTotal);

  const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...rows, totalsRow]);

  // Merge circonscription header cells
  const merges: XLSX.Range[] = [];
  let col = 1;
  circonsKeys.forEach((c) => {
    const span = circonsMap.get(c)!.length;
    if (span > 1) {
      merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + span - 1 } });
    }
    col += span;
  });
  ws['!merges'] = merges;

  // Auto-width
  const allRows = [header1, header2, ...rows, totalsRow];
  const colCount = header1.length;
  const colWidths: { wch: number }[] = [];
  for (let i = 0; i < colCount; i++) {
    const maxLen = Math.max(...allRows.map((r) => String(r[i] ?? '').length));
    colWidths.push({ wch: Math.max(maxLen + 2, 6) });
  }
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matrice');
  XLSX.writeFile(wb, filename);
}
