import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Voter, MatrixRow } from '@/types/voter';

const AMIRI_FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf';

let cachedFontBase64: string | null = null;

async function loadArabicFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  const response = await fetch(AMIRI_FONT_URL);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  cachedFontBase64 = btoa(binary);
  return cachedFontBase64;
}

function setupArabicFont(doc: jsPDF, fontBase64: string) {
  doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri');
  doc.setLanguage('ar');
}

export async function generateVoterPDF(voters: Voter[], title: string) {
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Total: ${voters.length}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['#', 'CIN', 'الاسم العائلي', 'الاسم الشخصي', 'الجنس', 'الجماعة', 'الدائرة', 'مكتب التصويت', 'عنوان مكتب التصويت']],
    body: voters.map((v, i) => [
      i + 1,
      v.cin,
      v.lastName,
      v.firstName,
      v.gender,
      v.commune,
      v.circonscription,
      v.bvName,
      v.bvAddress,
    ]),
    styles: { fontSize: 8, cellPadding: 2, font: 'Amiri', halign: 'right' },
    headStyles: { fillColor: [41, 121, 204], font: 'Amiri', fontStyle: 'normal', halign: 'right' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export async function generateMatrixPDF(voters: Voter[]) {
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  // Build pivot data
  const communeSet = new Set<string>();
  const circBvMap = new Map<string, Set<string>>();
  const cellMap = new Map<string, number>();

  voters.forEach((v) => {
    communeSet.add(v.commune);
    if (!circBvMap.has(v.circonscription)) circBvMap.set(v.circonscription, new Set());
    circBvMap.get(v.circonscription)!.add(v.bvName);
    const key = `${v.commune}||${v.circonscription}||${v.bvName}`;
    cellMap.set(key, (cellMap.get(key) || 0) + 1);
  });

  const communes = [...communeSet].sort();
  const circonsKeys = [...circBvMap.keys()].sort();
  const bvList: { name: string; circons: string }[] = [];
  circonsKeys.forEach((c) => {
    const bvs = [...circBvMap.get(c)!].sort();
    bvs.forEach((bv) => bvList.push({ name: bv, circons: c }));
  });

  // Header row 1: الجماعة + circonscriptions merged + المجموع
  const headerRow1: any[] = [{ content: 'الجماعة', rowSpan: 2, styles: { halign: 'right', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } }];
  circonsKeys.forEach((c) => {
    const span = circBvMap.get(c)!.size;
    headerRow1.push({ content: c, colSpan: span, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });
  });
  headerRow1.push({ content: 'المجموع', rowSpan: 2, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });

  // Header row 2: BV names
  const headerRow2: any[] = bvList.map((bv) => ({
    content: bv.name,
    styles: { halign: 'center', fillColor: [60, 140, 220], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', fontSize: 7 },
  }));

  // Body rows
  const body = communes.map((com) => {
    const row: any[] = [com];
    let rowTotal = 0;
    bvList.forEach((bv) => {
      const val = cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0;
      rowTotal += val;
      row.push(val > 0 ? val : '-');
    });
    row.push(rowTotal);
    return row;
  });

  // Footer row
  const footRow: any[] = ['المجموع'];
  bvList.forEach((bv) => {
    let t = 0;
    communes.forEach((com) => { t += cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0; });
    footRow.push(t);
  });
  footRow.push(voters.length);

  doc.setFontSize(16);
  doc.text('حالة المصفوفة - عدد الناخبين', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

  autoTable(doc, {
    startY: 25,
    head: [headerRow1, headerRow2],
    body,
    foot: [footRow],
    styles: { fontSize: 8, cellPadding: 2, font: 'Amiri', halign: 'center' },
    headStyles: { fillColor: [41, 121, 204], font: 'Amiri', fontStyle: 'normal' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', halign: 'center' },
    columnStyles: { 0: { halign: 'right', fontStyle: 'bold' } },
  });

  doc.save('etat_matrice.pdf');
}
