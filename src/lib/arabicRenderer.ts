import type jsPDF from 'jspdf';

const AMIRI_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf';
let loadPromise: Promise<void> | null = null;

/**
 * Charge la police Amiri dans le navigateur (FontFace API) pour que le canvas
 * puisse l'utiliser pour rendre l'arabe avec un shaping correct.
 */
export function ensureAmiriLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const font = new FontFace('AmiriRender', `url(${AMIRI_URL})`);
      await font.load();
      (document as any).fonts.add(font);
    } catch (e) {
      console.warn('Amiri font load failed:', e);
    }
  })();
  return loadPromise;
}

export function isArabic(s: any): boolean {
  return typeof s === 'string' && /[\u0600-\u06FF]/.test(s);
}

const cache = new Map<string, { url: string; w: number; h: number }>();
const SCALE = 2; // retina

export function renderArabicToImage(
  text: string,
  fontPx: number,
  color: string,
  bold = false,
): { url: string; w: number; h: number } {
  const key = `${fontPx}|${color}|${bold ? 'b' : 'n'}|${text}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const fontDecl = `${bold ? 'bold ' : ''}${fontPx}px AmiriRender, "Amiri", "Noto Naskh Arabic", "Arial", serif`;

  const measureCtx = document.createElement('canvas').getContext('2d')!;
  measureCtx.font = fontDecl;
  const tw = Math.max(1, Math.ceil(measureCtx.measureText(text).width)) + 6;
  const th = Math.ceil(fontPx * 1.5);

  const canvas = document.createElement('canvas');
  canvas.width = tw * SCALE;
  canvas.height = th * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.font = fontDecl;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText(text, tw - 3, th / 2);

  const url = canvas.toDataURL('image/png');
  const result = { url, w: tw, h: th };
  cache.set(key, result);
  return result;
}

interface DrawTextOpts {
  fontSizePt?: number;
  align?: 'left' | 'right' | 'center';
  color?: string;
  bold?: boolean;
  maxWidthMm?: number;
}

/**
 * Dessine du texte (arabe ou latin avec arabe inline) dans un PDF jsPDF
 * en passant par un rendu canvas natif du navigateur.
 * x, y sont en mm. y correspond à la baseline (comme doc.text).
 */
export function drawArabicText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts: DrawTextOpts = {},
) {
  if (!text) return;
  const fontPt = opts.fontSizePt ?? doc.getFontSize();
  const fontPx = Math.max(12, Math.round(fontPt * 2));
  const img = renderArabicToImage(text, fontPx, opts.color ?? '#000', opts.bold);

  // Hauteur cible en mm proportionnelle au fontSize PDF (1pt = 25.4/72 mm)
  let drawH = (fontPt * 25.4) / 72 * 1.2;
  let drawW = (img.w / img.h) * drawH;

  if (opts.maxWidthMm && drawW > opts.maxWidthMm) {
    drawW = opts.maxWidthMm;
    drawH = (img.h / img.w) * drawW;
  }

  let dx = x;
  if (opts.align === 'center') dx = x - drawW / 2;
  else if (opts.align === 'right') dx = x - drawW;

  // y représente plutôt la baseline ; on cale le centre image légèrement au-dessus
  const dy = y - drawH * 0.78;
  doc.addImage(img.url, 'PNG', dx, dy, drawW, drawH);
}

function rgbArrToHex(arr: any): string {
  if (!Array.isArray(arr) || arr.length < 3) return '#000000';
  return '#' + arr.slice(0, 3).map((n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Hooks à brancher sur autoTable pour rendre toute cellule contenant de
 * l'arabe via le canvas (tête, corps, pied de page).
 */
export function arabicAutoTableHooks(doc: jsPDF) {
  return {
    didParseCell: (data: any) => {
      const txt = Array.isArray(data.cell.text)
        ? data.cell.text.join(' ')
        : String(data.cell.text ?? '');
      if (isArabic(txt)) {
        data.cell._arabicText = txt;
        data.cell.text = [''];
      }
    },
    didDrawCell: (data: any) => {
      const ar = data.cell._arabicText;
      if (!ar) return;
      const fontPt = data.cell.styles.fontSize || 8;
      const fontPx = Math.max(14, Math.round(fontPt * 2.2));
      const color = Array.isArray(data.cell.styles.textColor)
        ? rgbArrToHex(data.cell.styles.textColor)
        : (typeof data.cell.styles.textColor === 'string' ? data.cell.styles.textColor : '#000');
      const bold = data.cell.styles.fontStyle === 'bold';

      const img = renderArabicToImage(ar, fontPx, color, bold);

      const padRaw = data.cell.styles.cellPadding;
      const pad = typeof padRaw === '