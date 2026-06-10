CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by  TEXT NOT NULL DEFAULT 'shared-user',
  label_count   INTEGER NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  error_count   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES batches(id) ON DELETE SET NULL,
  application_id  TEXT,
  beverage_type   TEXT NOT NULL CHECK (beverage_type IN ('wine','spirits','beer','unknown')),
  image_path      TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('pending','processing','done','failed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_batch_id ON scans (batch_id);
CREATE INDEX IF NOT EXISTS idx_scans_application_id ON scans (application_id);

CREATE TABLE IF NOT EXISTS extractions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id                  UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  fields_json              JSONB NOT NULL,
  ocr_raw_text             TEXT,
  warning_present          BOOLEAN NOT NULL DEFAULT FALSE,
  warning_prefix_all_caps  BOOLEAN NOT NULL DEFAULT FALSE,
  warning_text_exact_match BOOLEAN NOT NULL DEFAULT FALSE,
  warning_diff             TEXT,
  model_used               TEXT,
  latency_ms               INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_extractions_scan_id ON extractions (scan_id);

CREATE TABLE IF NOT EXISTS comparisons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  reference_json  JSONB NOT NULL,
  field_results   JSONB NOT NULL,
  overall_status  TEXT NOT NULL CHECK (overall_status IN ('match','fuzzy_match','mismatch','partial')),
  confidence      REAL NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comparisons_scan_id ON comparisons (scan_id);
