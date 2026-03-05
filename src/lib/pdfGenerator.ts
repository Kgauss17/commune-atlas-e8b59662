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
  (doc as any).setR2L(true);
}

// Arabic letter forms mapping for reshaping
const arabicForms: Record<number, [number, number | null, number | null, number | null]> = {
  0x0621: [0xFE80, null, null, null], // HAMZA
  0x0622: [0xFE81, null, null, 0xFE82], // ALEF_MADDA
  0x0623: [0xFE83, null, null, 0xFE84], // ALEF_HAMZA_ABOVE
  0x0624: [0xFE85, null, null, 0xFE86], // WAW_HAMZA
  0x0625: [0xFE87, null, null, 0xFE88], // ALEF_HAMZA_BELOW
  0x0626: [0xFE89, 0xFE8B, 0xFE8C, 0xFE8A], // YEH_HAMZA
  0x0627: [0xFE8D, null, null, 0xFE8E], // ALEF
  0x0628: [0xFE8F, 0xFE91, 0xFE92, 0xFE90], // BEH
  0x0629: [0xFE93, null, null, 0xFE94], // TEH_MARBUTA
  0x062A: [0xFE95, 0xFE97, 0xFE98, 0xFE96], // TEH
  0x062B: [0xFE99, 0xFE9B, 0xFE9C, 0xFE9A], // THEH
  0x062C: [0xFE9D, 0xFE9F, 0xFEA0, 0xFE9E], // JEEM
  0x062D: [0xFEA1, 0xFEA3, 0xFEA4, 0xFEA2], // HAH
  0x062E: [0xFEA5, 0xFEA7, 0xFEA8, 0xFEA6], // KHAH
  0x062F: [0xFEA9, null, null, 0xFEAA], // DAL
  0x0630: [0xFEAB, null, null, 0xFEAC], // THAL
  0x0631: [0xFEAD, null, null, 0xFEAE], // REH
  0x0632: [0xFEAF, null, null, 0xFEB0], // ZAIN
  0x0633: [0xFEB1, 0xFEB3, 0xFEB4, 0xFEB2], // SEEN
  0x0634: [0xFEB5, 0xFEB7, 0xFEB8, 0xFEB6], // SHEEN
  0x0635: [0xFEB9, 0xFEBB, 0xFEBC, 0xFEBA], // SAD
  0x0636: [0xFEBD, 0xFEBF, 0xFEC0, 0xFEBE], // DAD
  0x0637: [0xFEC1, 0xFEC3, 0xFEC4, 0xFEC2], // TAH
  0x0638: [0xFEC5, 0xFEC7, 0xFEC8, 0xFEC6], // ZAH
  0x0639: [0xFEC9, 0xFECB, 0xFECC, 0xFECA], // AIN
  0x063A: [0xFECD, 0xFECF, 0xFED0, 0xFECE], // GHAIN
  0x0640: [0x0640, null, null, null], // TATWEEL
  0x0641: [0xFED1, 0xFED3, 0xFED4, 0xFED2], // FEH
  0x0642: [0xFED5, 0xFED7, 0xFED8, 0xFED6], // QAF
  0x0643: [0xFED9, 0xFEDB, 0xFEDC, 0xFEDA], // KAF
  0x0644: [0xFEDD, 0xFEDF, 0xFEE0, 0xFEDE], // LAM
  0x0645: [0xFEE1, 0xFEE3, 0xFEE4, 0xFEE2], // MEEM
  0x0646: [0xFEE5, 0xFEE7, 0xFEE8, 0xFEE6], // NOON
  0x0647: [0xFEE9, 0xFEEB, 0xFEEC, 0xFEEA], // HEH
  0x0648: [0xFEED, null, null, 0xFEEE], // WAW
  0x0649: [0xFEEF, null, null, 0xFEF0], // ALEF_MAKSURA
  0x064A: [0xFEF1, 0xFEF3, 0xFEF4, 0xFEF2], // YEH
};

function isArabicChar(code: number): boolean {
  return code >= 0x0600 && code <= 0x06FF;
}

function canConnect(code: number, side: 'right' | 'left'): boolean {
  const forms = arabicForms[code];
  if (!forms) return false;
  if (side === 'right') return forms[3] !== null; // has final form = can connect to right
  return forms[1] !== null; // has initial form = can connect to left
}

function reshapeArabic(text: string): string {
  if (!text) return text;
  if (!/[\u0600-\u06FF]/.test(text)) return text;

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);
    const forms = arabicForms[code];

    if (!forms) {
      result += text[i];
      continue;
    }

    const prevCode = i > 0 ? text.charCodeAt(i - 1) : 0;
    const nextCode = i < len - 1 ? text.charCodeAt(i + 1) : 0;

    const prevConnects = isArabicChar(prevCode) && canConnect(prevCode, 'left');
    const nextConnects = isArabicChar(nextCode) && canConnect(nextCode, 'right');

    let formIndex: number;
    if (prevConnects && nextConnects && forms[2] !== null) {
      formIndex = 2; // medial
    } else if (prevConnects && forms[3] !== null) {
      formIndex = 3; // final
    } else if (nextConnects && forms[1] !== null) {
      formIndex = 1; // initial
    } else {
      formIndex = 0; // isolated
    }

    result += String.fromCharCode(forms[formIndex]!);
  }

  // Reverse for RTL display
  return result.split('').reverse().join('');
}

export async function generateVoterPDF(voters: Voter[], title: string) {
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  doc.setFontSize(16);
  doc.text(reshapeArabic(title), doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Total: ${voters.length}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['#', 'CIN', reshapeArabic('الاسم العائلي'), reshapeArabic('الاسم الشخصي'), reshapeArabic('الجنس'), reshapeArabic('الجماعة'), reshapeArabic('الدائرة'), reshapeArabic('مكتب التصويت'), reshapeArabic('عنوان مكتب التصويت')]],
    body: voters.map((v, i) => [
      i + 1,
      v.cin,
      reshapeArabic(v.lastName),
      reshapeArabic(v.firstName),
      reshapeArabic(v.gender),
      reshapeArabic(v.commune),
      reshapeArabic(v.circonscription),
      reshapeArabic(v.bvName),
      reshapeArabic(v.bvAddress),
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
  const headerRow1: any[] = [{ content: reshapeArabic('الجماعة'), rowSpan: 2, styles: { halign: 'right', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } }];
  circonsKeys.forEach((c) => {
    const span = circBvMap.get(c)!.size;
    headerRow1.push({ content: reshapeArabic(c), colSpan: span, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });
  });
  headerRow1.push({ content: reshapeArabic('المجموع'), rowSpan: 2, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });

  // Header row 2: BV names
  const headerRow2: any[] = bvList.map((bv) => ({
    content: reshapeArabic(bv.name),
    styles: { halign: 'center', fillColor: [60, 140, 220], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', fontSize: 7 },
  }));

  // Body rows
  const body = communes.map((com) => {
    const row: any[] = [reshapeArabic(com)];
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
  const footRow: any[] = [reshapeArabic('المجموع')];
  bvList.forEach((bv) => {
    let t = 0;
    communes.forEach((com) => { t += cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0; });
    footRow.push(t);
  });
  footRow.push(voters.length);

  doc.setFontSize(16);
  doc.text(reshapeArabic('حالة المصفوفة - عدد الناخبين'), doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

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
