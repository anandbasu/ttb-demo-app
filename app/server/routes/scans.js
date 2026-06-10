import { Router } from 'express';
import { query } from '../db.js';
import { uploadSingle } from '../upload.js';
import { processScan } from '../services/pipeline.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const appId = req.query.application_id;
    const params = [];
    let where = '';
    if (appId) {
      params.push(appId);
      where = `WHERE s.application_id = $${params.length}`;
    }
    params.push(limit);
    const sql = `
      SELECT s.id, s.application_id, s.beverage_type, s.image_path, s.status,
             s.created_at, s.completed_at, s.batch_id,
             e.warning_text_exact_match, e.warning_present, e.fields_json,
             c.overall_status AS comparison_status
      FROM scans s
      LEFT JOIN extractions e ON e.scan_id = s.id
      LEFT JOIN comparisons c ON c.scan_id = s.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT $${params.length}
    `;
    const rows = (await query(sql, params)).rows;
    res.json({ scans: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const scan = (await query('SELECT * FROM scans WHERE id=$1', [req.params.id])).rows[0];
    if (!scan) return res.status(404).json({ error: 'not found' });
    const extraction = (await query('SELECT * FROM extractions WHERE scan_id=$1 ORDER BY created_at DESC LIMIT 1', [scan.id])).rows[0] || null;
    const comparison = (await query('SELECT * FROM comparisons WHERE scan_id=$1 ORDER BY created_at DESC LIMIT 1', [scan.id])).rows[0] || null;
    res.json({ scan, extraction, comparison });
  } catch (err) { next(err); }
});

router.post('/', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required (field name: image)' });
    const beverageType = (req.body.beverage_type || 'unknown').toLowerCase();
    const applicationId = req.body.application_id || null;
    let referenceFields = null;
    if (req.body.reference_fields) {
      try {
        referenceFields = typeof req.body.reference_fields === 'string'
          ? JSON.parse(req.body.reference_fields)
          : req.body.reference_fields;
      } catch (err) {
        return res.status(400).json({ error: 'reference_fields must be valid JSON' });
      }
    }

    const scanRow = (await query(
      `INSERT INTO scans (application_id, beverage_type, image_path, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id, created_at`,
      [applicationId, ['wine', 'spirits', 'beer'].includes(beverageType) ? beverageType : 'unknown', req.file.path],
    )).rows[0];

    try {
      const result = await processScan(scanRow.id, {
        imagePath: req.file.path,
        beverageType,
        referenceFields,
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(502).json({ ok: false, scan_id: scanRow.id, error: err.message });
    }
  } catch (err) { next(err); }
});

export default router;
