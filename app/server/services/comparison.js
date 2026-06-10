// Compare extracted label fields against an application reference payload.
// Per Dave's "STONE'S THROW" vs "Stone's Throw" example: normalize before exact-match,
// and fall through to a fuzzy Levenshtein check for typos / minor variants.

const FIELDS = [
  'brand_name',
  'class_type',
  'alcohol_content_abv',
  'alcohol_content_proof',
  'net_contents',
  'producer_name',
  'producer_address',
  'country_of_origin',
];

const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,;:!?'"`()\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = temp;
    }
  }
  return dp[b.length];
}

function compareOne(extracted, reference) {
  if (reference == null || reference === '') {
    return { status: 'not_in_reference', confidence: 1, extracted, reference };
  }
  if (extracted == null || extracted === '') {
    return { status: 'missing', confidence: 0, extracted, reference };
  }
  const a = normalize(extracted);
  const b = normalize(reference);
  if (a === b) return { status: 'match', confidence: 1, extracted, reference };

  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

  if (similarity >= 0.85) {
    return { status: 'fuzzy_match', confidence: Number(similarity.toFixed(2)), extracted, reference };
  }
  return { status: 'mismatch', confidence: Number(similarity.toFixed(2)), extracted, reference };
}

export function compareFields(extractedFields, referenceFields) {
  const ref = referenceFields || {};
  const results = {};
  const statuses = [];
  for (const f of FIELDS) {
    if (!(f in ref)) continue;
    results[f] = compareOne(extractedFields?.[f], ref[f]);
    if (results[f].status !== 'not_in_reference') statuses.push(results[f].status);
  }

  let overall = 'match';
  if (statuses.includes('mismatch') || statuses.includes('missing')) overall = 'mismatch';
  else if (statuses.includes('fuzzy_match')) overall = 'fuzzy_match';
  if (statuses.length === 0) overall = 'partial';

  const matches = statuses.filter((s) => s === 'match' || s === 'fuzzy_match').length;
  const confidence = statuses.length === 0 ? 0 : Number((matches / statuses.length).toFixed(2));

  return { field_results: results, overall_status: overall, confidence };
}

export { FIELDS as COMPARABLE_FIELDS };
