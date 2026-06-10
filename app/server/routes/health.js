import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const checks = { server: 'ok', db: 'unknown', groq_key: process.env.GROQ_API_KEY ? 'set' : 'missing' };
  try {
    await query('SELECT 1');
    checks.db = 'ok';
  } catch (err) {
    checks.db = `error: ${err.message}`;
  }
  const healthy = checks.db === 'ok';
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});

export default router;
