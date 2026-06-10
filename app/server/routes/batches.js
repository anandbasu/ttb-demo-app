import { Router } from 'express';
import { query } from '../db.js';
import { uploadMany } from '../upload.js';
import { processScan } from '../services/pipeline.js';

const router = Router();
const WORKER_CONCURRENCY = Math.max(1, parseInt(process.env.WORKER_CONCURRENCY || '4', 10));

router.get('/', async (_req, res, next) => {
  try {
    const rows = (await query(
      `SELECT id, submitted_by, label_count, status, started_at, completed_at, error_count
       FROM batches ORDER BY started_at DESC LIMIT 50`,
    )).rows;
    res.json({ batches: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const batch = (await query('SELECT * FROM batches WHERE id=$1', [req.params.id])).rows[0];
    if (!batch) return res.status(404).json({ error: 'not found' });
    const scans = (await query(
      `SELECT s.id, s.application_id, s.beverage_type, s.image_path, s.status,
              s.error_message, s.created_at, s.completed_at,
              e.warning_text_exact_match, e.fields_json,
              c.overall_status AS comparison_status
       FROM scans s
       LEFT JOIN extractions e ON e.scan_id = s.id
       LEFT JOIN comparisons c ON c.scan_id = s.id
       WHERE s.batch_id = $1
       ORDER BY s.created_at ASC`,
      [batch.id],
    )).rows;
    res.json({ batch, scans });
  } catch (err) { next(err); }
});

router.post('/', uploadMany, async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: 'at least one image required (field: images)' });

    const beverageType = (req.body.beverage_type || 'unknown').toLowerCase();

    const batch = (await query(
      `INSERT INTO batches (label_count, status) VALUES ($1, 'running') RETURNING id, started_at`,
      [files.length],
    )).rows[0];

    const scanIds = [];
    for (const file of files) {
      const row = (await query(
        `INSERT INTO scans (batch_id, beverage_type, image_path, status)
         VALUES ($1, $2, $3, 'pending') RETURNING id`,
        [batch.id, ['wine', 'spirits', 'beer'].includes(beverageType) ? beverageType : 'unknown', file.path],
      )).rows[0];
      scanIds.push({ scanId: row.id, imagePath: file.path });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('batch_start', { batch_id: batch.id, total: files.length });

    let errorCount = 0;
    let completedCount = 0;
    const queueRef = [...scanIds];

    const worker = async () => {
      while (queueRef.length > 0) {
        const job = queueRef.shift();
        if (!job) break;
        try {
          const result = await processScan(job.scanId, { imagePath: job.imagePath, beverageType });
          sendEvent('scan_done', {
            scan_id: job.scanId,
            fields: result.fields,
            compliance: result.compliance,
            timing: result.timing,
          });
        } catch (err) {
          errorCount += 1;
          sendEvent('scan_failed', { scan_id: job.scanId, error: err.message });
        } finally {
          completedCount += 1;
          sendEvent('progress', { completed: completedCount, total: files.length });
        }
      }
    };

    const concurrency = Math.min(WORKER_CONCURRENCY, files.length);
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    await query(
      `UPDATE batches SET status='completed', completed_at=NOW(), error_count=$2 WHERE id=$1`,
      [batch.id, errorCount],
    );
    sendEvent('batch_done', { batch_id: batch.id, error_count: errorCount });
    res.end();
  } catch (err) { next(err); }
});

export default router;
