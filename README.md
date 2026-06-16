# TTB Label Recognition — Prototype

A web tool that helps TTB compliance agents verify alcohol beverage label artwork against application data. Uploads a label image, extracts the TTB-required fields, runs the Government Warning compliance check, and (when reference data is supplied) compares each field against the application.

**Status:** prototype / proof-of-concept. **Not for production use.**

| Doc | What it covers |
|---|---|
| `README.md` *(this file)* | **Local-machine setup and running** |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | Requirements, stakeholder decisions, deferred backlog |
| [`ARCHITECTURE.pdf`](./ARCHITECTURE.pdf) / [`.pptx`](./ARCHITECTURE.pptx) | System architecture, latency budget, fly.io topology |
| [`app/README.md`](./app/README.md) | API reference, batch SSE event types, fly.io deploy steps |

---

## Stack

- **Frontend:** Vue 3 + Vite + Tailwind
- **Backend:** Node.js 20 (Express) + Postgres
- **OCR:** Tesseract (called via `node-tesseract-ocr`) with two-pass preprocessing (greyscale-normalize + inverted) so the white-on-dark warning band is readable
- **LLM:** Groq-hosted Llama 3.1 8B (free tier) with JSON-mode for structured extraction
- **Storage:** Postgres for structured data + filesystem volume for raw images

> The architecture spec named **PaddleOCR**, but PaddleOCR is Python-only with no first-class Node bindings. The prototype substitutes Tesseract to keep everything in Node. Swap to a Python sidecar (or a vision LLM) is a documented production option.

---

## Prerequisites

Tested on macOS (Apple Silicon) with the versions below. Linux works identically; Windows works via WSL2.

| Tool | Version | macOS install | Debian/Ubuntu install |
|---|---|---|---|
| Node.js | ≥ 20 | `brew install node@20` | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install nodejs` |
| Postgres | ≥ 14 | `brew install postgresql@16` *or* the [Postgres.app](https://postgresapp.com/) bundle | `sudo apt install postgresql` |
| Tesseract | ≥ 5 | `brew install tesseract` | `sudo apt install tesseract-ocr tesseract-ocr-eng` |
| Git | any | preinstalled / `brew install git` | `sudo apt install git` |

You'll also need a **free Groq API key** — sign up at https://console.groq.com/keys (takes ~1 minute, no card required).

### Verifying the toolchain

```bash
node --version      # v20.x or higher
psql --version      # PostgreSQL 14+
tesseract --version # 5.x
```

If any of these fail, fix that first before continuing.

---

## Setup — step by step

### 1. Clone

```bash
git clone https://github.com/anandbasu/ttb-demo-app.git
cd ttb-demo-app/app
```

> All subsequent commands run from the `app/` directory unless noted.

### 2. Install Node dependencies

```bash
npm install
```

This installs both server (Express, pg, multer, node-tesseract-ocr, groq-sdk, …) and client (Vue, Vite, Tailwind) packages.

### 3. Set up the Postgres database

#### 3a. Start Postgres if it isn't running

- **Homebrew:** `brew services start postgresql@16`
- **Postgres.app:** open the app and click *Start*
- **EnterpriseDB installer (macOS):** the launchd service starts at boot; nothing to do

#### 3b. Create the database

The exact command depends on how Postgres was installed:

```bash
# Homebrew or Postgres.app (peer auth, no password prompt)
createdb ttb_labels

# EnterpriseDB installer / any setup with a password on the postgres role:
PGPASSWORD=YOUR_POSTGRES_PASSWORD createdb -U postgres -h localhost ttb_labels
```

If you get **"role 'anandbasu' does not exist"**, your Postgres install doesn't have a role for your macOS user. Connect as the `postgres` superuser instead:

```bash
PGPASSWORD=YOUR_PASSWORD psql -U postgres -h localhost -c "CREATE DATABASE ttb_labels;"
```

> **Forgot your `postgres` password?** With the EnterpriseDB installer you can run `sudo -u postgres /Library/PostgreSQL/<version>/bin/psql` (peer auth, no password) and then `ALTER USER postgres PASSWORD 'newpw';`.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
# Pick anything — this is what you'll type at the login screen
APP_PASSWORD=demo123

# Generate a strong random string
SESSION_SECRET=$(openssl rand -hex 32)   # paste the output here

# Use whatever connection string matches your Postgres setup
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/ttb_labels

# Paste your Groq key from https://console.groq.com/keys
GROQ_API_KEY=gsk_...
```

The other variables (`PORT`, `GROQ_MODEL`, `MAX_BATCH_SIZE`, etc.) have sensible defaults — leave them alone unless you have a reason.

### 5. Run database migrations

```bash
npm run migrate
```

You should see `[migrate] applying 001_init.sql` then `[migrate] complete`. This creates the four tables: `batches`, `scans`, `extractions`, `comparisons`.

### 6. Start the app

```bash
npm run dev
```

This concurrently boots:

- **Express API** on `http://localhost:3000`
- **Vite dev server** on `http://localhost:5175` (proxies `/api` and `/uploads` to Express)

Open **http://localhost:5175** and you should see:

- A bright amber **PROTOTYPE — NOT FOR PRODUCTION USE** banner across the top
- The login screen
- Type the `APP_PASSWORD` you set in step 4 → you're in

---
## Working Prototype
Open https://ttb-label-recognition.fly.dev/
Password provided in the submitted form.

## Trying it out

### Option A — use the included sample labels (recommended first run)

The repo ships with 5 synthetic test labels designed for clean OCR in `app/scripts/sample-labels/`:

| File | What it tests |
|---|---|
| `spirits_bourbon_clean.png` | Happy path — all fields, canonical Government Warning |
| `wine_cabernet_clean.png` | Wine variant |
| `beer_ipa_clean.png` | Beer variant |
| `spirits_bourbon_bad_warning.png` | "Government Warning:" in **title case** — should **fail** the all-caps check |
| `spirits_bourbon_no_warning.png` | No warning band at all — should **fail** "warning present" |

Each PNG has a sidecar `*.expected.json` with the ground-truth fields, so you can sanity-check the extraction.

1. Click **Scan a label**.
2. Drop in `spirits_bourbon_clean.png`.
3. Wait ~3 seconds. You should see all fields extracted and the Government Warning marked as an exact match.
4. Now try `spirits_bourbon_bad_warning.png` — the warning section should turn red with a "case violation" diff.

### Option B — your own label image

JPG, PNG, or WEBP, up to 10 MB. Photographs of real bottles are harder — small text, glare, and dim lighting all hurt Tesseract. Clean scans or vendor artwork files work best.

### Trying the comparison feature

In the API, send `reference_fields` as a JSON object alongside the image — values from the application form. Each label field gets compared and statused as `match`, `fuzzy_match`, `mismatch`, or `missing`. See [`app/README.md`](./app/README.md#reference-data-format) for the schema.

### Batch upload

Click **Batch upload**, select multiple images, and watch the results stream in via Server-Sent Events. Failed scans don't block the rest of the batch.

---

## Production build (still local)

If you want to test the production deploy path locally:

```bash
npm run build          # builds Vue → dist/
NODE_ENV=production npm start
```

Now Express serves both API and static UI on port 3000 — open http://localhost:3000.

---

## Common issues

### "Port 5175 already in use" / "Port 3000 already in use"

Another process is using the port. Find and stop it, or change the port via `.env` (`PORT=3001` for the API) / `client/vite.config.js` for Vite.

```bash
lsof -nP -iTCP:5175 -sTCP:LISTEN
kill <PID>
```

### `createdb: command not found`

Postgres isn't on your `PATH`. Either install via Homebrew (`brew install postgresql@16`) or add the bin dir to PATH:

```bash
export PATH="/Library/PostgreSQL/16/bin:$PATH"
```

### Login button does nothing / 401 loop after typing the right password

Check `.env`:
- `APP_PASSWORD` must be set
- `SESSION_SECRET` must be set (any non-empty string)

Restart `npm run dev` after editing `.env`.

### `GROQ_API_KEY is not set` in server logs

You didn't set `GROQ_API_KEY` in `.env`, or the dev server was running when you added it. Stop with Ctrl-C and `npm run dev` again.

### Extraction returns mostly nulls / OCR is poor

Tesseract struggles with photographs (glare, angle, low contrast). Try one of the synthetic sample labels first to confirm the pipeline works end-to-end. If the test labels work but a real photo doesn't, that's an expected prototype limitation — see [`REQUIREMENTS.md` §8](./REQUIREMENTS.md) ("Image preprocessing pipeline" and "Vision-LLM swap-in option" in the deferred backlog).

### Browser shows unstyled HTML

This usually means the dev server isn't serving CSS — check the terminal for a Tailwind / PostCSS error. If you see one mentioning `tailwind.config.js` not found, ensure you're running `npm run dev` from inside the `app/` directory (not the repo root or `app/client/`).

### `npm run migrate` fails with auth error

The `DATABASE_URL` in `.env` doesn't match your Postgres setup. Test the connection directly:

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

If that fails, fix the URL (user, password, host, port, dbname) before rerunning the migration.

---

## Project layout

```
label-recognition-app/
├── README.md                ← you are here
├── REQUIREMENTS.md          ← stakeholder requirements, decisions, deferred backlog
├── ARCHITECTURE.{pdf,pptx}  ← 7-slide architecture deck
├── build/                   ← pptxgenjs source for the architecture deck
└── app/
    ├── README.md            ← API reference + fly.io deploy
    ├── package.json         ← scripts: dev, build, start, migrate
    ├── Dockerfile           ← Node 20 + tesseract; multi-stage build
    ├── fly.toml             ← fly.io deploy config
    ├── tailwind.config.js
    ├── server/
    │   ├── index.js         ← Express entrypoint
    │   ├── auth.js          ← shared-password session middleware
    │   ├── db.js            ← pg pool
    │   ├── migrate.js       ← simple migration runner
    │   ├── upload.js        ← multer config
    │   ├── routes/          ← /api/scans, /api/batches, /api/health
    │   ├── services/        ← ocr, llm, compliance, comparison, pipeline
    │   └── migrations/      ← *.sql, applied in order
    ├── client/
    │   ├── index.html
    │   ├── vite.config.js
    │   ├── postcss.config.js
    │   └── src/
    │       ├── App.vue      ← chrome + prototype banner
    │       ├── main.{js,css}
    │       ├── api.js       ← fetch wrapper for /api
    │       ├── views/       ← Login, Home (single), Batch, History, ScanDetail
    │       └── components/  ← ResultPanel (extracted fields, compliance, comparison)
    ├── scripts/
    │   ├── generate-sample-labels.js
    │   └── sample-labels/   ← generated PNGs + *.expected.json
    └── uploads/             ← runtime: raw uploaded images (gitignored)
```



---

## License & disclaimer

Prototype code, no warranty. Advisory output only — compliance agents always make the final call. **Do not submit real PII or non-public TTB data through the prototype.**
