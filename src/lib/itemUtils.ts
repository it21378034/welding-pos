/**
 * Utility functions for quotation and invoice line items.
 * Normalizes text and eliminates duplicate/redundant descriptions.
 */

/**
 * Normalizes text for comparison by standardizing common welding terms,
 * symbols, fractions, and removing punctuation and extra whitespace.
 */
export function normalizeItemText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[½]/g, '1/2')
    .replace(/[¼]/g, '1/4')
    .replace(/[¾]/g, '3/4')
    .replace(/["'”’]/g, '')
    .replace(/\bl\s*angle\b/gi, 'angle iron')
    .replace(/\bangle\s*bar\b/gi, 'angle iron')
    .replace(/\bflat\s*bar\b/gi, 'flat iron')
    .replace(/\bbox\s*bar\b/gi, 'box iron')
    .replace(/\bsquare\s*bar\b/gi, 'box iron')
    .replace(/[^a-z0-9/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if the secondary description duplicates or restates the item name.
 * Returns the description if it contains distinct technical details or notes,
 * or empty string ("") if it duplicates, rephrases, or is redundant with the item name.
 */
export function getDistinctDescription(name: string, description?: string): string {
  if (!description) return '';
  const trimmedDesc = description.trim();
  if (!trimmedDesc) return '';
  if (!name || !name.trim()) return trimmedDesc;

  const trimmedName = name.trim();

  // 1. Literal or case-insensitive match
  if (trimmedName.toLowerCase() === trimmedDesc.toLowerCase()) {
    return '';
  }

  // 2. Normalized text match (ignoring fractions, quotes, punctuation, L Angle vs Angle Iron)
  const normName = normalizeItemText(trimmedName);
  const normDesc = normalizeItemText(trimmedDesc);

  if (!normDesc || normName === normDesc) {
    return '';
  }

  // 3. Substring containment:
  // e.g. name: "1 1/2 Flat Iron" in desc, or desc in name
  if (normName.includes(normDesc)) {
    return '';
  }
  if (normDesc.includes(normName)) {
    // Description merely contains the name (e.g. "Labor charges" vs "Labor charges for fabrication and painting")
    return '';
  }

  // 4. Word-level similarity / overlap:
  // e.g. name: "1 1/2 x 1 1/2 L Angle", desc: "1 1/2 x 1 1/2 Angle Iron"
  const nameWords = new Set(normName.split(' ').filter(w => w.length > 0));
  const descWords = normDesc.split(' ').filter(w => w.length > 0);

  if (descWords.length === 0) return '';

  const sharedWords = descWords.filter(w => nameWords.has(w));
  // If 50% or more of the description words are already in the name
  if (sharedWords.length / descWords.length >= 0.5) {
    return '';
  }

  return trimmedDesc;
}
