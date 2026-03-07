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

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((r) => String((r as Record<string, unknown>)[key] ?? '').length)).valueOf() + 2,
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, filename);
}
