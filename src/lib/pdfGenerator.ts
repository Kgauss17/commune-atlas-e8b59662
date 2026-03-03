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

export async function generateMatrixPDF(matrix: MatrixRow[]) {
  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  setupArabicFont(doc, fontBase64);

  doc.setFontSize(16);
  doc.text('حالة المصفوفة - عدد الناخبين', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

  autoTable(doc, {
    startY: 25,
    head: [['الجماعة', 'الدائرة الانتخابية', 'مكتب التصويت', 'عدد الناخبين']],
    body: matrix.map((r) => [r.commune, r.circonscription, r.bv, r.count]),
    styles: { fontSize: 9, cellPadding: 3, font: 'Amiri', halign: 'right' },
    headStyles: { fillColor: [41, 121, 204], font: 'Amiri', fontStyle: 'normal', halign: 'right' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    foot: [['المجموع', '', '', matrix.reduce((s, r) => s + r.count, 0).toString()]],
    footStyles: { fillColor: [41, 121, 204], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal', halign: 'right' },
  });

  doc.save('etat_matrice.pdf');
}
