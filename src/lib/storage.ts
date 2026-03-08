import type { Voter } from '@/types/voter';

export interface ImportRecord {
  id: string;
  date: string;
  fileName: string;
  voterCount: number;
}

const VOTERS_KEY = 'ge_voters';
const HISTORY_KEY = 'ge_import_history';

export function saveVoters(voters: Voter[]): void {
  try {
    localStorage.setItem(VOTERS_KEY, JSON.stringify(voters));
  } catch {
    console.warn('localStorage full, data not saved');
  }
}

export function loadVoters(): Voter[] {
  try {
    const raw = localStorage.getItem(VOTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearVoters(): void {
  localStorage.removeItem(VOTERS_KEY);
}

export function addImportRecord(fileName: string, voterCount: number): void {
  const history = getImportHistory();
  history.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    fileName,
    voterCount,
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getImportHistory(): ImportRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearImportHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
