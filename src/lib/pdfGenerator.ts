import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Voter, MatrixRow } from '@/types/voter';

export function generateVoterPDF(voters: Voter[], title: string) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Total: ${voters.length}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['#', 'CIN', 'Nom', 'Prenom', 'Genre', 'Commune', 'Circons.', 'BV', 'Adresse BV']],
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
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 121, 204] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export function generateMatrixPDF(matrix: MatrixRow[]) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Etat Matrice - Nombre des electeurs', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

  autoTable(doc, {
    startY: 25,
    head: [['Commune', 'Circonscription', 'Bureau de Vote', 'Nombre Electeurs']],
    body: matrix.map((r) => [r.commune, r.circonscription, r.bv, r.count]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 121, 204] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    foot: [['Total', '', '', matrix.reduce((s, r) => s + r.count, 0).toString()]],
    footStyles: { fillColor: [41, 121, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save('etat_matrice.pdf');
}
