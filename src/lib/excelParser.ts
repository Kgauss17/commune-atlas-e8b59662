import * as XLSX from 'xlsx';
import type { Voter } from '@/types/voter';

const CHUNK_SIZE = 5000;

function mapRow(row: any): Voter {
  return {
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
  };
}

/**
 * Parse Excel in chunks to avoid blocking the main thread on large files.
 * onProgress is called with a value between 0 and 100.
 */
export function parseExcelFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<Voter[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        onProgress?.(10);

        const workbook = XLSX.read(data, { type: 'array', dense: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);
        onProgress?.(30);

        const total = rows.length;
        const voters: Voter[] = new Array(total);
        let processed = 0;

        function processChunk() {
          const end = Math.min(processed + CHUNK_SIZE, total);
          for (let i = processed; i < end; i++) {
            voters[i] = mapRow(rows[i]);
          }
          processed = end;
          const pct = 30 + Math.round((processed / total) * 70);
          onProgress?.(pct);

          if (processed < total) {
            // Yield to the main thread so the UI stays responsive
            setTimeout(processChunk, 0);
          } else {
            resolve(voters);
          }
        }

        processChunk();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
