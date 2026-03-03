import * as XLSX from 'xlsx';
import type { Voter } from '@/types/voter';

export function parseExcelFile(file: File): Promise<Voter[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        const voters: Voter[] = rows.map((row: any) => ({
          orderNumber: row['الرقم الترتيبي'] || 0,
          cin: String(row['رقم بطــاقة التعريف'] || ''),
          address: row['العنوان بدقة'] || '',
          birthDate: row['تاريخ الازدياد'] || '',
          firstName: row['الاسم الشخصي للناخب'] || '',
          lastName: row['الاسم العائلي للناخب'] || '',
          gender: row['الجنس'] || '',
          circonscription: String(row['الدائرة الانتخابية'] || ''),
          commune: row['الجماعة'] || '',
          bvName: String(row['اسم مكتب التصويت'] || ''),
          bvAddress: row['عنوان مكتب التصويت'] || '',
          bvLocation: row['مكان مكتب التصويت'] || '',
          province: row['العمالة او الاقليم'] || '',
        }));

        resolve(voters);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
