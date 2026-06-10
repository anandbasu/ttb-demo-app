import { extractTextFromImage } from './ocr.js';
import { extractFieldsFromText } from './llm.js';
import { checkGovernmentWarning } from './compliance.js';
import { compareFields } from './comparison.js';
import { query } from '../db.js';

export async function processScan(scanId, { imagePath, beverageType, referenceFields }) {
  await query("UPDATE scans SET status='processing' WHERE id=$1", [scanId]);

  const t0 = Date.now();
  try {
    const ocr = await extractTextFromImage(imagePath);
    const llm = await extractFieldsFromText(ocr.text, beverageType);
    const compliance = checkGovernmentWarning(llm.fields, ocr.text);

    await query(
      `INSERT INTO extractions
        (scan_id, fields_json, ocr_raw_text, warning_present, warning_prefix_all_caps,
         warning_text_exact_match, warning_diff, model_used, latency_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        scanId,
        JSON.stringify(llm.fields),
        ocr.text,
        compliance.warning_present,
        compliance.warning_prefix_all_caps,
        compliance.warning_text_exact_match,
        compliance.warning_diff,
        llm.model_used,
        llm.latency_ms,
      ],
    );

    let comparison = null;
    if (referenceFields && Object.keys(referenceFields).length > 0) {
      const cmp = compareFields(llm.fields, referenceFields);
      await query(
        `INSERT INTO comparisons
          (scan_id, reference_json, field_results, overall_status, confidence)
         VALUES ($1,$2,$3,$4,$5)`,
        [scanId, JSON.stringify(referenceFields), JSON.stringify(cmp.field_results), cmp.overall_status, cmp.confidence],
      );
      comparison = cmp;
    }

    const total_ms = Date.now() - t0;
    await query(
      "UPDATE scans SET status='done', completed_at=NOW() WHERE id=$1",
      [scanId],
    );

    return {
      scan_id: scanId,
      fields: llm.fields,
      compliance,
      comparison,
      timing: { ocr_ms: ocr.latency_ms, llm_ms: llm.latency_ms, total_ms },
    };
  } catch (err) {
    await query(
      "UPDATE scans SET status='failed', error_message=$2, completed_at=NOW() WHERE id=$1",
      [scanId, String(err.message || err).slice(0, 1000)],
    );
    throw err;
  }
}
