import Groq from 'groq-sdk';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are a label-data extractor for the US TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance team.
You will receive raw OCR text from an alcohol beverage label.
Your job is to extract the structured fields the TTB requires and return strict JSON.

Required JSON shape (return null for fields you cannot find, do not guess):
{
  "brand_name": string|null,
  "class_type": string|null,
  "alcohol_content_abv": string|null,
  "alcohol_content_proof": string|null,
  "net_contents": string|null,
  "producer_name": string|null,
  "producer_address": string|null,
  "country_of_origin": string|null,
  "government_warning": string|null,
  "government_warning_prefix_all_caps": boolean,
  "beverage_type": "wine"|"spirits"|"beer"|"unknown"
}

Rules:
- "government_warning" must contain the FULL warning text exactly as it appears (preserve case and punctuation).
- "government_warning_prefix_all_caps" is true only if "GOVERNMENT WARNING:" appears in all caps in the source text.
- OCR text is noisy. Common substitutions: 0/O, 1/l/I, 5/S. Be tolerant.
- Return ONLY the JSON object. No commentary, no markdown fences.`;

export async function extractFieldsFromText(ocrText, hintedBeverageType) {
  const userPrompt = `OCR text from label:
"""
${ocrText}
"""
${hintedBeverageType ? `Agent indicated this is a ${hintedBeverageType} label.` : ''}
Return the JSON now.`;

  const start = Date.now();
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });
  const ms = Date.now() - start;

  const raw = completion.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM returned invalid JSON: ${err.message}`);
  }

  const normalized = normalizeFields(parsed, hintedBeverageType);
  return { fields: normalized, model_used: MODEL, latency_ms: ms };
}

function normalizeFields(obj, hintedBeverageType) {
  const stringOrNull = (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : null);
  const bool = (v) => v === true;
  const bevTypes = new Set(['wine', 'spirits', 'beer']);
  let bevType = typeof obj.beverage_type === 'string' ? obj.beverage_type.toLowerCase() : 'unknown';
  if (hintedBeverageType && bevTypes.has(hintedBeverageType)) bevType = hintedBeverageType;
  if (!bevTypes.has(bevType)) bevType = 'unknown';

  return {
    brand_name: stringOrNull(obj.brand_name),
    class_type: stringOrNull(obj.class_type),
    alcohol_content_abv: stringOrNull(obj.alcohol_content_abv),
    alcohol_content_proof: stringOrNull(obj.alcohol_content_proof),
    net_contents: stringOrNull(obj.net_contents),
    producer_name: stringOrNull(obj.producer_name),
    producer_address: stringOrNull(obj.producer_address),
    country_of_origin: stringOrNull(obj.country_of_origin),
    government_warning: stringOrNull(obj.government_warning),
    government_warning_prefix_all_caps: bool(obj.government_warning_prefix_all_caps),
    beverage_type: bevType,
  };
}
