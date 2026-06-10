# TTB Label Recognition — Prototype

A web tool that extracts TTB-required fields from alcohol beverage label images, checks the Government Warning, and optionally compares against application data. Built for the prototype scope in [../REQUIREMENTS.md](../REQUIREMENTS.md) and the architecture in [../ARCHITECTURE.pdf](../ARCHITECTURE.pdf).

**Stack:** Node.js (Express) + Vue 3 (Vite) + Postgres + Tesseract (OCR) + Groq Llama 3.1 8B (LLM).

> Note on OCR choice: the architecture spec named PaddleOCR. PaddleOCR is Python-only, so for an all-Node deployment this prototype uses Tesseract instead. Quality is slightly lower on stylized label fonts; swap-in via a Python sidecar is a straightforward production change (tracked in REQUIREMENTS §8).
## Testing with Sample Images
Sample images can be found in the scripts/sample-labels directory along with the JSON representation of the extracted fields. Some test labels will fail to parse - this is intentional.

## Local development

### Prerequisites
- Node 20+
- Postgres 14+ running locally (or pointed to via `DATABASE_URL`)
- Tesseract installed: `brew install tesseract` (macOS) or `apt install tesseract-ocr` (Debian/Ubuntu)
- A free Groq API key from https://console.groq.com/keys

### Setup
```bash
cd app
cp .env.example .env
# edit .env: set APP_PASSWORD, SESSION_SECRET, DATABASE_URL, GROQ_API_KEY

# Create the DB once:
createdb ttb_labels

npm install
npm run migrate     # applies SQL migrations
npm run dev         # starts server (3000) + vite (5173) concurrently
```

Open http://localhost:5173 — Vite proxies `/api` and `/uploads` to the Express server on 3000.

### Production build (local)
```bash
npm run build       # builds Vue to ../dist
npm start           # serves API + static dist on port 3000
```

## API

All endpoints except `/api/health` and `/api/auth/*` require a session cookie obtained from `POST /api/auth/login`.

| Method | Path                      | Notes |
|--------|---------------------------|-------|
| POST   | `/api/auth/login`         | body: `{ password }` |
| POST   | `/api/auth/logout`        | |
| GET    | `/api/auth/status`        | `{ authed }` |
| GET    | `/api/health`             | DB + Groq-key check |
| POST   | `/api/scans`              | multipart: `image`, optional `beverage_type`, `application_id`, `reference_fields` (JSON string) |
| GET    | `/api/scans`              | query: `application_id`, `limit` |
| GET    | `/api/scans/:id`          | full detail |
| POST   | `/api/batches`            | multipart: `images[]`, optional `beverage_type` — streams **Server-Sent Events** |
| GET    | `/api/batches`            | |
| GET    | `/api/batches/:id`        | with associated scans |

### Reference data format
For comparison mode, supply a JSON object with any of these keys (string values):
```json
{
  "brand_name": "OLD TOM DISTILLERY",
  "class_type": "Kentucky Straight Bourbon Whiskey",
  "alcohol_content_abv": "45%",
  "alcohol_content_proof": "90",
  "net_contents": "750 mL",
  "producer_name": "Old Tom Distillery Co.",
  "producer_address": "Bardstown, KY",
  "country_of_origin": "USA"
}
```

### Batch streaming
`POST /api/batches` returns `text/event-stream` with these event types:
- `batch_start` — `{ batch_id, total }`
- `scan_done` — `{ scan_id, fields, compliance, timing }`
- `scan_failed` — `{ scan_id, error }`
- `progress` — `{ completed, total }`
- `batch_done` — `{ batch_id, error_count }`


## Architecture summary

```
Browser ──HTTPS──> fly.io edge ──> Express (auth + routes)
                                     │
                                     ├─> Tesseract OCR (in-process)
                                     ├─> Groq API (external, Llama 3.1 8B)
                                     ├─> Postgres (fly Postgres)
                                     └─> Volume (/data/uploads — raw images)
```

Single-label latency budget: ≤ 5 s p95. Current estimate ~3.5 s (OCR ~1.5 s, LLM ~0.8 s, overhead ~1.2 s).

Batch: 300 labels processed with `WORKER_CONCURRENCY` parallel jobs, streaming results back via SSE.

## What's deferred to production

See [../REQUIREMENTS.md §8](../REQUIREMENTS.md) for the full backlog. Highlights:
- Azure Gov / FedRAMP deployment
- SSO / PIV-card auth
- Self-hosted LLM (TTB firewall blocks Groq)
- S3 object storage with retention policy
- Audit log, encryption at rest with FIPS modules
- Image preprocessing for bad photos
- HA Postgres, multi-region failover

## Limitations of the prototype
- **Tesseract quality** on stylized label fonts is lower than PaddleOCR / vision LLMs. Bad-photo handling is minimal.
- **Single shared password** — no per-agent identity.
- **No request retries** for Groq rate-limit responses; a 429 currently fails that scan and the batch keeps going.
- **No background queue** — batch SSE connection must stay open until completion. Closing the tab drops the stream; the underlying scans may still complete on the server side but no further updates are sent.
- **Latency is not enforced.** The 5 s target is a goal, not a server-side timeout.
