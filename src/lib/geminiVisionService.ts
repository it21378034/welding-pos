export interface ScannedMaterialItem {
  id?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
}

export interface ScanQuotationResult {
  projectName: string;
  suggestedCustomerName?: string;
  items: ScannedMaterialItem[];
  subtotal: number;
  grandTotal: number;
  notes?: string;
  rawAnalysis?: string;
}

// Built-in verified sample parsed directly from the welding note image
export const SAMPLE_HANDWRITTEN_BILL_DATA: ScanQuotationResult = {
  projectName: 'Sliding Gate Fabrication & Materials',
  suggestedCustomerName: '',
  notes: 'Extracted from handwritten workshop material estimate sheet (Total items: 15)',
  items: [
    {
      name: '2" x 2" Box Bar (2.0mm)',
      unit: 'Bars',
      quantity: 3,
      unitPrice: 5833.33,
      total: 17500,
      description: 'Heavy duty square hollow section (2.0mm thickness)',
    },
    {
      name: '1½" x 1½" Box Bar (1.6mm)',
      unit: 'Bars',
      quantity: 1,
      unitPrice: 4800,
      total: 4800,
      description: 'Square hollow section (1.6mm thickness)',
    },
    {
      name: '1½" x 1½" Angle Iron (5mm)',
      unit: 'Bars',
      quantity: 1,
      unitPrice: 5100,
      total: 5100,
      description: '5mm thick structural angle iron',
    },
    {
      name: '1" x ¼" Flat Iron (5mm)',
      unit: 'Bars',
      quantity: 4,
      unitPrice: 1950,
      total: 7800,
      description: '5mm thick mild steel flat bar',
    },
    {
      name: '2" x 1" Gate Bottom Roller',
      unit: 'Nos',
      quantity: 2,
      unitPrice: 2000,
      total: 4000,
      description: 'Heavy duty bottom track rollers with bearings',
    },
    {
      name: '2" x 1" Top Gate Roller Guide',
      unit: 'Nos',
      quantity: 1,
      unitPrice: 3000,
      total: 3000,
      description: 'Top guide roller with bracket',
    },
    {
      name: '2" x 1" Gate Pin / Hinge Pin',
      unit: 'Nos',
      quantity: 2,
      unitPrice: 550,
      total: 1100,
      description: 'Mild steel machined gate pins',
    },
    {
      name: '5 ft Amano Cladding Sheet (0.47mm)',
      unit: 'Sheets',
      quantity: 5,
      unitPrice: 2400,
      total: 12000,
      description: '0.47mm zinc/alu coated corrugated sheet',
    },
    {
      name: 'Gate Lock Mechanism',
      unit: 'Nos',
      quantity: 2,
      unitPrice: 500,
      total: 1000,
      description: 'Heavy duty welding gate drop lock / latch',
    },
    {
      name: '10" Gate Pull Handles',
      unit: 'Nos',
      quantity: 2,
      unitPrice: 650,
      total: 1300,
      description: '10-inch fabricated steel handles',
    },
    {
      name: '1½" x 1½" Angle Iron (5 ft length)',
      unit: 'Feet',
      quantity: 5,
      unitPrice: 400,
      total: 2000,
      description: 'Cut length angle iron support track',
    },
    {
      name: '5/32" x ½" Pop Rivets',
      unit: 'Nos',
      quantity: 400,
      unitPrice: 1,
      total: 400,
      description: 'Blind aluminum pop rivets for sheet fixing',
    },
    {
      name: 'Thinner (Cleaning & Spraying)',
      unit: 'Litres',
      quantity: 1,
      unitPrice: 900,
      total: 900,
      description: 'NC Thinner 1 Litre can',
    },
    {
      name: 'QD Black Enamel Paint',
      unit: 'Litres',
      quantity: 1,
      unitPrice: 2600,
      total: 2600,
      description: 'Quick drying anti-corrosive black gloss paint 1L',
    },
    {
      name: 'Sundries, Welding Electrodes & Extra Materials',
      unit: 'Job',
      quantity: 1,
      unitPrice: 3000,
      total: 3000,
      description: 'Welding rods, cutting discs, grinding discs & bolts',
    },
  ],
  subtotal: 66500,
  grandTotal: 66500,
};

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get active Gemini API Key from settings or environment
 */
export function getGeminiApiKey(customSettingsKey?: string): string {
  if (customSettingsKey && customSettingsKey.trim().length > 5) {
    return customSettingsKey.trim();
  }
  const fromLocal = localStorage.getItem('welding_pos_gemini_api_key');
  if (fromLocal && fromLocal.trim().length > 5) {
    return fromLocal.trim();
  }
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 5) {
    return fromEnv.trim();
  }
  return '';
}

/**
 * Store Gemini API Key in localStorage for persistent use
 */
export function saveGeminiApiKey(apiKey: string): void {
  if (!apiKey || apiKey.trim().length === 0) {
    localStorage.removeItem('welding_pos_gemini_api_key');
  } else {
    localStorage.setItem('welding_pos_gemini_api_key', apiKey.trim());
  }
}

/**
 * Parse an image containing handwritten notes, hardware bills, or material lists using Gemini Vision
 */
export async function analyzeHandwrittenBillImage(
  imageBase64: string,
  apiKey?: string
): Promise<ScanQuotationResult> {
  const activeKey = getGeminiApiKey(apiKey);

  if (!activeKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Extract mime type and pure base64 data
  let mimeType = 'image/jpeg';
  let base64Data = imageBase64;

  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  }

  const prompt = `You are an expert welding workshop estimator, fabricator, and handwriting OCR specialist.
The user has uploaded a photo of a handwritten material list, hardware store bill, or quotation estimate for a welding / metal fabrication project (e.g., gates, grilles, railings, trusses, sheet metal work).

TASK:
1. Carefully transcribe all numbered or unnumbered line items from the handwritten document.
2. For each item, accurately read:
   - Item name / description (including dimensions like 2x2, 1 1/2 x 1 1/2, 5/32, thicknesses like 2.0mm, 1.6mm, 5mm, material types like Box Bar, Angle Iron, Flat Iron, Amano Sheet, Gate Roller, Gate Lock, Pop Rivets, Thinner, QD Black paint, etc.).
   - Quantity (integer or decimal). If formatted as "= 03" or "- 03" or "5 ft", extract the quantity.
   - Unit: e.g. "Bars", "Nos", "Feet", "Sheets", "Litres", "Kg", "Job", "Pack".
   - Total price: the handwritten line price on the right side.
   - Unit price: total price divided by quantity (e.g., if total is 17500 and qty is 3, unit price is 5833.33).
   - Description / Specifications: any extra details written (e.g. gauge, dimensions, purpose).
3. Extract or infer:
   - projectName: A suitable title for this welding job based on materials (e.g. "Main Gate Metal Fabrication", "Security Grille & Gate Work", etc.)
   - customerName: If any customer name or address is written on top, extract it; otherwise empty.
   - grandTotal: The handwritten sum at the bottom or calculate sum of items.
   - notes: Any additional handwritten notes or remarks.

OUTPUT FORMAT:
Return valid JSON with this exact schema without any markdown formatting or code fences:
{
  "projectName": "string",
  "suggestedCustomerName": "string",
  "notes": "string",
  "grandTotal": number,
  "items": [
    {
      "name": "string",
      "unit": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number,
      "description": "string"
    }
  ]
}`;

  // Discover supported models for this API key, or use fallback candidates
  const candidateModels: { version: string; model: string }[] = [];

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (Array.isArray(listData.models)) {
        const available = listData.models
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        // Prioritize flash models (2.0-flash, 2.5-flash, etc.)
        const sorted = available.sort((a: string, b: string) => {
          const aFlash = a.includes('flash') ? 2 : (a.includes('pro') ? 1 : 0);
          const bFlash = b.includes('flash') ? 2 : (b.includes('pro') ? 1 : 0);
          return bFlash - aFlash;
        });

        sorted.forEach((m: string) => {
          candidateModels.push({ version: 'v1beta', model: m });
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch active models list from Google API:', err);
  }

  // If dynamic list was empty, add all known active models
  if (candidateModels.length === 0) {
    candidateModels.push(
      { version: 'v1beta', model: 'gemini-2.0-flash' },
      { version: 'v1beta', model: 'gemini-2.0-flash-exp' },
      { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
      { version: 'v1beta', model: 'gemini-2.5-flash' },
      { version: 'v1', model: 'gemini-2.0-flash' },
      { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
      { version: 'v1beta', model: 'gemini-1.5-pro-latest' },
      { version: 'v1', model: 'gemini-1.5-pro' }
    );
  }

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const { version, model } = candidateModels[i];
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${activeKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If 404 (model not found / deprecated) or unsupported, try next available model candidate
        if (
          (response.status === 404 || errorText.includes('NOT_FOUND') || errorText.includes('not supported') || errorText.includes('deprecated')) &&
          i < candidateModels.length - 1
        ) {
          console.warn(`Gemini model ${model} (${version}) returned ${response.status}. Trying next candidate...`);
          continue;
        }
        throw new Error(`Gemini API Error (${response.status}) on model ${model}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No response text received from Gemini Vision model');
      }

      // Clean markdown fences if any
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleaned);

      const items: ScannedMaterialItem[] = (parsed.items || []).map((item: any, idx: number) => {
        const qty = Number(item.quantity) || 1;
        const total = Number(item.total) || 0;
        const unitPrice = Number(item.unitPrice) || (qty > 0 ? total / qty : total);

        return {
          id: `scanned-${Date.now()}-${idx}`,
          name: String(item.name || `Material Item ${idx + 1}`).trim(),
          unit: String(item.unit || 'Nos').trim(),
          quantity: qty,
          unitPrice: Math.round(unitPrice * 100) / 100,
          total: total > 0 ? total : Math.round(qty * unitPrice),
          description: item.description ? String(item.description).trim() : '',
        };
      });

      const calculatedSubtotal = items.reduce((sum, it) => sum + it.total, 0);

      return {
        projectName: parsed.projectName || 'Fabrication & Metal Works',
        suggestedCustomerName: parsed.suggestedCustomerName || '',
        notes: parsed.notes || '',
        items: items,
        subtotal: calculatedSubtotal,
        grandTotal: parsed.grandTotal || calculatedSubtotal,
        rawAnalysis: rawText,
      };
    } catch (err: any) {
      lastError = err;
      if (
        (err.message && (err.message.includes('404') || err.message.includes('NOT_FOUND') || err.message.includes('not supported'))) &&
        i < candidateModels.length - 1
      ) {
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Failed to process image with Gemini AI Vision');
}
