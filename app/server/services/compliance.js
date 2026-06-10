// TTB Government Warning per 27 CFR §16.21
export const CANONICAL_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

const normalizeWhitespace = (s) => (s || '').replace(/\s+/g, ' ').trim();

export function checkGovernmentWarning(extractedFields, rawOcrText) {
  const claimedWarning = extractedFields?.government_warning || '';
  const ocrHaystack = (rawOcrText || '').toLowerCase();
  const prefixPresent = ocrHaystack.includes('government warning');
  const prefixAllCaps =
    Boolean(extractedFields?.government_warning_prefix_all_caps) ||
    /GOVERNMENT\s+WARNING\s*:/.test(rawOcrText || '');

  const normExtracted = normalizeWhitespace(claimedWarning);
  const normCanonical = normalizeWhitespace(CANONICAL_WARNING);
  const exactMatch = normExtracted.length > 0 && normExtracted === normCanonical;

  let diff = null;
  if (!exactMatch && claimedWarning) {
    diff = describeDiff(normCanonical, normExtracted);
  } else if (!claimedWarning) {
    diff = 'No warning text was found on the label.';
  }

  return {
    warning_present: prefixPresent || Boolean(claimedWarning),
    warning_prefix_all_caps: prefixAllCaps,
    warning_text_exact_match: exactMatch,
    warning_diff: diff,
  };
}

function describeDiff(expected, actual) {
  if (!actual) return 'Warning text missing.';
  const expWords = expected.split(' ');
  const actWords = actual.split(' ');
  const missing = expWords.filter((w) => !actWords.includes(w)).slice(0, 8);
  const extra = actWords.filter((w) => !expWords.includes(w)).slice(0, 8);
  const parts = [];
  if (missing.length) parts.push(`missing words: ${missing.join(', ')}`);
  if (extra.length) parts.push(`unexpected words: ${extra.join(', ')}`);
  if (!parts.length) parts.push('phrasing or punctuation differs from the canonical TTB text.');
  return parts.join('; ');
}
