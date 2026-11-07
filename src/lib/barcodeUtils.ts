import type { Quotation, Invoice, PurchaseList } from '../types';

/**
 * Standard ISO/IEC 15417 Code 128 (Subset B) Symbol Width Patterns.
 * Each entry from 0 to 105 has 6 integers [bar, space, bar, space, bar, space] totaling 11 modules.
 * Stop symbol 106 has 7 integers [bar, space, bar, space, bar, space, bar] totaling 13 modules.
 */
export const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], // 0  (space)
  [2, 2, 2, 1, 2, 2], // 1  !
  [2, 2, 2, 2, 2, 1], // 2  "
  [1, 2, 1, 2, 2, 3], // 3  #
  [1, 2, 1, 3, 2, 2], // 4  $
  [1, 3, 1, 2, 2, 2], // 5  %
  [1, 2, 2, 2, 1, 3], // 6  &
  [1, 2, 2, 3, 1, 2], // 7  '
  [1, 3, 2, 2, 1, 2], // 8  (
  [2, 2, 1, 2, 1, 3], // 9  )
  [2, 2, 1, 3, 1, 2], // 10 *
  [2, 3, 1, 2, 1, 2], // 11 +
  [1, 1, 2, 2, 3, 2], // 12 ,
  [1, 2, 2, 1, 3, 2], // 13 -
  [1, 2, 2, 2, 3, 1], // 14 .
  [1, 1, 3, 2, 2, 2], // 15 /
  [1, 2, 3, 1, 2, 2], // 16 0
  [1, 2, 3, 2, 2, 1], // 17 1
  [2, 2, 3, 2, 1, 1], // 18 2
  [2, 2, 1, 1, 3, 2], // 19 3
  [2, 2, 1, 2, 3, 1], // 20 4
  [2, 1, 3, 2, 1, 2], // 21 5
  [2, 2, 3, 1, 1, 2], // 22 6
  [3, 1, 2, 1, 3, 1], // 23 7
  [3, 1, 1, 2, 2, 2], // 24 8
  [3, 2, 1, 1, 2, 2], // 25 9
  [3, 2, 1, 2, 2, 1], // 26 :
  [3, 1, 2, 2, 1, 2], // 27 ;
  [3, 2, 2, 1, 1, 2], // 28 <
  [3, 2, 2, 2, 1, 1], // 29 =
  [2, 1, 2, 1, 2, 3], // 30 >
  [2, 1, 2, 3, 2, 1], // 31 ?
  [2, 3, 2, 1, 2, 1], // 32 @
  [1, 1, 1, 3, 2, 3], // 33 A
  [1, 3, 1, 1, 2, 3], // 34 B
  [1, 3, 1, 3, 2, 1], // 35 C
  [1, 1, 2, 3, 1, 3], // 36 D
  [1, 3, 2, 1, 1, 3], // 37 E
  [1, 3, 2, 3, 1, 1], // 38 F
  [2, 1, 1, 3, 1, 3], // 39 G
  [2, 3, 1, 1, 1, 3], // 40 H
  [2, 3, 1, 3, 1, 1], // 41 I
  [1, 1, 2, 1, 3, 3], // 42 J
  [1, 1, 2, 3, 3, 1], // 43 K
  [1, 3, 2, 1, 3, 1], // 44 L
  [1, 1, 3, 1, 2, 3], // 45 M
  [1, 1, 3, 3, 2, 1], // 46 N
  [1, 3, 3, 1, 2, 1], // 47 O
  [3, 1, 3, 1, 2, 1], // 48 P
  [2, 1, 1, 3, 3, 1], // 49 Q
  [2, 3, 1, 1, 3, 1], // 50 R
  [2, 1, 3, 1, 1, 3], // 51 S
  [2, 1, 3, 3, 1, 1], // 52 T
  [2, 1, 3, 1, 3, 1], // 53 U
  [3, 1, 1, 1, 2, 3], // 54 V
  [3, 1, 1, 3, 2, 1], // 55 W
  [3, 3, 1, 1, 2, 1], // 56 X
  [3, 1, 2, 1, 1, 3], // 57 Y
  [3, 1, 2, 3, 1, 1], // 58 Z
  [3, 3, 2, 1, 1, 1], // 59 [
  [3, 1, 4, 1, 1, 1], // 60 \
  [2, 2, 1, 4, 1, 1], // 61 ]
  [4, 3, 1, 1, 1, 1], // 62 ^
  [1, 1, 1, 2, 2, 4], // 63 _
  [1, 1, 1, 4, 2, 2], // 64 `
  [1, 2, 1, 1, 2, 4], // 65 a
  [1, 2, 1, 4, 2, 1], // 66 b
  [1, 4, 1, 1, 2, 2], // 67 c
  [1, 4, 1, 2, 2, 1], // 68 d
  [1, 1, 2, 2, 1, 4], // 69 e
  [1, 1, 2, 4, 1, 2], // 70 f
  [1, 2, 2, 1, 1, 4], // 71 g
  [1, 2, 2, 4, 1, 1], // 72 h
  [1, 4, 2, 1, 1, 2], // 73 i
  [1, 4, 2, 2, 1, 1], // 74 j
  [2, 4, 1, 2, 1, 1], // 75 k
  [2, 2, 1, 1, 1, 4], // 76 l
  [4, 1, 3, 1, 1, 1], // 77 m
  [2, 4, 1, 1, 1, 2], // 78 n
  [1, 3, 4, 1, 1, 1], // 79 o
  [1, 1, 1, 2, 4, 2], // 80 p
  [1, 2, 1, 1, 4, 2], // 81 q
  [1, 2, 1, 2, 4, 1], // 82 r
  [1, 1, 4, 2, 1, 2], // 83 s
  [1, 2, 4, 1, 1, 2], // 84 t
  [1, 2, 4, 2, 1, 1], // 85 u
  [4, 1, 1, 2, 1, 2], // 86 v
  [4, 2, 1, 1, 1, 2], // 87 w
  [4, 2, 1, 2, 1, 1], // 88 x
  [2, 1, 2, 1, 4, 1], // 89 y
  [2, 1, 4, 1, 2, 1], // 90 z
  [4, 1, 2, 1, 2, 1], // 91 {
  [1, 1, 1, 1, 4, 3], // 92 |
  [1, 1, 1, 3, 4, 1], // 93 }
  [1, 3, 1, 1, 4, 1], // 94 ~
  [1, 1, 4, 1, 1, 3], // 95 DEL
  [1, 1, 4, 3, 1, 1], // 96 FNC 3
  [4, 1, 1, 1, 1, 3], // 97 FNC 2
  [4, 1, 1, 3, 1, 1], // 98 SHIFT
  [1, 1, 3, 1, 4, 1], // 99 CODE C
  [1, 1, 4, 1, 3, 1], // 100 CODE B
  [3, 1, 1, 1, 4, 1], // 101 FNC 4
  [4, 1, 1, 1, 3, 1], // 102 FNC 1
  [2, 1, 1, 4, 1, 2], // 103 START A
  [2, 1, 1, 2, 1, 4], // 104 START B
  [2, 1, 1, 2, 3, 2], // 105 START C
  [2, 3, 3, 1, 1, 1, 2] // 106 STOP (7 elements = 13 modules)
];

export interface BarcodeElement {
  width: number;
  isBar: boolean;
}

/**
 * Encodes an ASCII string using Code 128 (Subset B)
 */
export function encodeCode128B(rawText: string): { bars: BarcodeElement[]; totalModules: number } {
  // Sanitize text to valid printable ASCII (32..126)
  const text = (rawText || 'UNKNOWN').replace(/[^\x20-\x7E]/g, '-');
  
  const codes: number[] = [104]; // Start B
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop symbol

  const bars: BarcodeElement[] = [];
  let totalModules = 0;

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
    for (let i = 0; i < pattern.length; i++) {
      const width = pattern[i];
      const isBar = i % 2 === 0;
      bars.push({ width, isBar });
      totalModules += width;
    }
  }

  return { bars, totalModules };
}

/**
 * Generates a Base64 PNG Data URL for a given barcode string.
 * Used for high-res embedding in jsPDF or <img> tags.
 */
export function generateBarcodeDataUrl(
  text: string,
  options?: {
    height?: number;
    moduleWidth?: number;
    showText?: boolean;
    fontSize?: number;
    quietZone?: number;
    color?: string;
    bgColor?: string;
  }
): string {
  if (typeof document === 'undefined') return '';

  const height = options?.height ?? 50;
  const moduleWidth = options?.moduleWidth ?? 2;
  const showText = options?.showText ?? true;
  const fontSize = options?.fontSize ?? 12;
  const quietZone = options?.quietZone ?? 12;
  const color = options?.color ?? '#000000';
  const bgColor = options?.bgColor ?? '#ffffff';

  const { bars, totalModules } = encodeCode128B(text);
  const textHeight = showText ? fontSize + 4 : 0;
  const canvasWidth = totalModules * moduleWidth + quietZone * 2;
  const canvasHeight = height + textHeight + 6;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw Bars
  ctx.fillStyle = color;
  let currentX = quietZone;

  for (const bar of bars) {
    const barWidth = bar.width * moduleWidth;
    if (bar.isBar) {
      ctx.fillRect(currentX, 4, barWidth, height);
    }
    currentX += barWidth;
  }

  // Draw text label below bars
  if (showText) {
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.fillText(text, canvasWidth / 2, height + 6);
  }

  return canvas.toDataURL('image/png');
}

export type MatchedDocumentResult =
  | { type: 'quotation'; data: Quotation }
  | { type: 'invoice'; data: Invoice }
  | { type: 'purchase-list'; data: PurchaseList };

/**
 * Searches across Quotations, Invoices, and Purchase Lists by barcode or document number.
 */
export function findDocumentByBarcode(
  scannedCode: string,
  quotations: Quotation[],
  invoices: Invoice[],
  purchaseLists: PurchaseList[]
): MatchedDocumentResult | null {
  if (!scannedCode) return null;
  const code = scannedCode.trim().toUpperCase();

  // 1. Direct Quotation match
  const matchedQuotation = quotations.find(
    q =>
      (q.barcode && q.barcode.toUpperCase() === code) ||
      (q.quotationNumber && q.quotationNumber.toUpperCase() === code) ||
      q.id.toUpperCase() === code
  );
  if (matchedQuotation) {
    return { type: 'quotation', data: matchedQuotation };
  }

  // 2. Direct Invoice match
  const matchedInvoice = invoices.find(
    inv =>
      (inv.barcode && inv.barcode.toUpperCase() === code) ||
      (inv.invoiceNumber && inv.invoiceNumber.toUpperCase() === code) ||
      inv.id.toUpperCase() === code
  );
  if (matchedInvoice) {
    return { type: 'invoice', data: matchedInvoice };
  }

  // 3. Direct Purchase List match
  const matchedPurchaseList = purchaseLists.find(
    pl =>
      (pl.barcode && pl.barcode.toUpperCase() === code) ||
      (pl.listNumber && pl.listNumber.toUpperCase() === code) ||
      pl.id.toUpperCase() === code
  );
  if (matchedPurchaseList) {
    return { type: 'purchase-list', data: matchedPurchaseList };
  }

  return null;
}

