import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './migrate.js';
import { requireAuth, login, logout, authStatus } from './auth.js';
import scansRouter from './routes/scans.js';
import batchesRouter from './routes/batches.js';
import healthRouter from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// fly.io terminates TLS at its edge and forwards over HTTP. Without this,
// express-session sees req.secure=false and refuses to set Secure cookies.
if (isProd) app.set('trust proxy', 1);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(session({
  name: 'ttb_sess',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 12 * 60 * 60 * 1000,
  },
}));

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });

app.use('/api/health', healthRouter);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/status', authStatus);

app.use('/api/scans', requireAuth, scansRouter);
app.use('/api/batches', requireAuth, batchesRouter);

app.use('/uploads', requireAuth, express.static(uploadDir));

if (isProd) {
  const distDir = path.join(ROOT, 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

async function start() {
  await runMigrations();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    if (!process.env.GROQ_API_KEY) {
      console.warn('[server] GROQ_API_KEY is not set — LLM calls will fail.');
    }
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
