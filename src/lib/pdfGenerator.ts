import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Voter } from '@/types/voter';
import { ensureAmiriLoaded, drawArabicText, arabicAutoTableHooks, isArabic } from './arabicRenderer';

const AMIRI_FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf';

let cachedFontBase64: string | null = null;

export async function loadArabicFont(): Promise<string> {
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

export function setupArabicFont(doc: jsPDF, fontBase64: string) {
  doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri');
}

/**
 * Conservée pour compat ascendante : le rendu arabe se fait désormais via
 * canvas (arabicRenderer), donc plus besoin de reshape — on retourne le texte
 * tel quel.
 */
export function reshapeArabic(text: string): string {
  return text ?? '';
}

interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  date?: boolean;
  totalCount?: number;
}

function addEnhancedHeader(doc: jsPDF, options: PdfHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(41, 121, 204);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header background
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 4, pageWidth, 35, 'F');

  // Logo placeholder circle
  doc.setFillColor(41, 121, 204);
  doc.circle(pageWidth / 2, 16, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('GE', pageWidth / 2, 18, { align: 'center' });

  // Title (arabe via canvas)
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  if (isArabic(options.title)) {
    drawArabicText(doc, options.title, pageWidth / 2, 30, { align: 'center', fontSizePt: 14, bold: true });
  } else {
    doc.text(options.title, pageWidth / 2, 30, { align: 'center' });
  }

  // Subtitle line
  let yPos = 34;
  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (isArabic(options.subtitle)) {
      drawArabicText(doc, options.subtitle, pageWidth / 2, yPos, { align: 'center', fontSizePt: 9, color: '#646464' });
    } else {
      doc.text(options.subtitle, pageWidth / 2, yPos, { align: 'center' });
    }
    yPos += 4;
  }

  // Date and count line
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const infoParts: string[] = [];
  if (options.date !== false) {
    infoParts.push(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
  }
  if (options.totalCount !== undefined) {
    infoParts.push(`Total: ${options.totalCount.toLocaleString()}`);
  }
  if (infoParts.length > 0) {
    doc.text(infoParts.join('  |  '), pageWidth / 2, yPos + 4, { align: 'center' });
  }

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, 42, pageWidth - 15, 42);

  return 45;
}

function addPageFooters(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Gestion Électorale - Rapport généré automatiquement', 15, pageHeight - 8);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });

    doc.setFillColor(41, 121, 204);
    doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
  }
}

export async function generateVoterPDF(voters: Voter[], title: string) {
  await ensureAmiriLoaded();
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  const startY = addEnhancedHeader(doc, {
    title,
    subtitle: 'Liste détaillée des électeurs inscrits',
    totalCount: voters.length,
  });

  autoTable(doc, {
    startY,
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
    headStyles: { fillColor: [41, 121, 204], font: 'Amiri', fontStyle: 'normal', halign: 'center', textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    ...arabicAutoTableHooks(doc),
  });

  addPageFooters(doc);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export async function generateMatrixPDF(voters: Voter[]) {
  await ensureAmiriLoaded();
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  const startY = addEnhancedHeader(doc, {
    title: 'حالة المصفوفة - عدد الناخبين',
    subtitle: 'Matrice croisée Communes × Bureaux de vote',
    totalCount: voters.length,
  });

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

  const headerRow1: any[] = [{ content: 'الجماعة', rowSpan: 2, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } }];
  circonsKeys.forEach((c) => {
    const span = circBvMap.get(c)!.size;
    headerRow1.push({ content: c, colSpan: span, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });
  });
  headerRow1.push({ content: 'المجموع', rowSpan: 2, styles: { halign: 'center', fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' } });

  const headerRow2: any[] = bvList.map((bv) => ({
    content: bv.name,
    styles: { halign: 'center', fillColor: [60, 140, 220], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', fontSize: 7 },
  }));

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

  const footRow: any[] = ['المجموع'];
  bvList.forEach((bv) => {
    let t = 0;
    communes.forEach((com) => { t += cellMap.get(`${com}||${bv.circons}||${bv.name}`) || 0; });
    footRow.push(t);
  });
  footRow.push(voters.length);

  autoTable(doc, {
    startY,
    head: [headerRow1, headerRow2],
    body,
    foot: [footRow],
    styles: { fontSize: 8, cellPadding: 2, font: 'Amiri', halign: 'center' },
    headStyles: { fillColor: [41, 121, 204], font: 'Amiri', fontStyle: 'normal' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', halign: 'center' },
    columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
    ...arabicAutoTableHooks(doc),
  });

  addPageFooters(doc);
  doc.save('etat_matrice.pdf');
}

export async function generateDuplicatesPDF(voters: Voter[]) {
  await ensureAmiriLoaded();
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  const cinMap = new Map<string, Voter[]>();
  voters.forEach((v) => {
    if (!v.cin) return;
    const key = v.cin.trim();
    if (!cinMap.has(key)) cinMap.set(key, []);
    cinMap.get(key)!.push(v);
  });

  const duplicates: { cin: string; voters: Voter[] }[] = [];
  cinMap.forEach((entries, cin) => {
    if (entries.length > 1) duplicates.push({ cin, voters: entries });
  });
  duplicates.sort((a, b) => a.cin.localeCompare(b.cin));

  const startY = addEnhancedHeader(doc, {
    title: 'قائمة المكررين',
    subtitle: `${duplicates.length} CIN en doublon détectés`,
    totalCount: duplicates.reduce((acc, d) => acc + d.voters.length, 0),
  });

  const body: any[][] = [];
  duplicates.forEach(({ voters: dupVoters }) => {
    dupVoters.forEach((v, i) => {
      body.push([
        v.cin,
        v.lastName,
        v.firstName,
        v.gender,
        v.commune,
        v.circonscription,
        v.bvName,
        i === 0 ? String(dupVoters.length) : '',
      ]);
    });
  });

  autoTable(doc, {
    startY,
    head: [['CIN', 'الاسم العائلي', 'الاسم الشخصي', 'الجنس', 'الجماعة', 'الدائرة', 'مكتب التصويت', 'التكرار']],
    body,
    styles: { fontSize: 8, cellPadding: 2, font: 'Amiri', halign: 'right' },
    headStyles: { fillColor: [204, 41, 41], font: 'Amiri', fontStyle: 'normal', halign: 'center', textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [255, 245, 245] },
    ...arabicAutoTableHooks(doc),
  });

  addPageFooters(doc);
  doc.save('doublons.pdf');
}
