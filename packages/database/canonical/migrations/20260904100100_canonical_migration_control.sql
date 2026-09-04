-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS canonical_migration.source_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_schema text NOT NULL,
  source_object text NOT NULL,
  object_kind text NOT NULL CHECK (object_kind IN ('table','view','function','policy','trigger','other')),
  classification text NOT NULL CHECK (classification IN ('KEEP','ADAPT','MIGRATE','MERGE','RETIRE','UNKNOWN')),
  capability_aggregate text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_schema, source_object, object_kind)
);

CREATE TABLE IF NOT EXISTS canonical_migration.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_aggregate text NOT NULL,
  migration_sha text,
  code_sha text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  result text CHECK (result IS NULL OR result IN ('running','pass','fail','aborted')),
  evidence_ref text,
  notes text
);

CREATE TABLE IF NOT EXISTS canonical_migration.record_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES canonical_migration.runs(id),
  capability_aggregate text NOT NULL,
  source_schema text NOT NULL,
  source_object text NOT NULL,
  source_id text NOT NULL,
  target_schema text NOT NULL,
  target_object text NOT NULL,
  target_id uuid NOT NULL,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (capability_aggregate, source_schema, source_object, source_id, target_schema, target_object)
);

CREATE TABLE IF NOT EXISTS canonical_migration.errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES canonical_migration.runs(id),
  capability_aggregate text,
  source_object text,
  source_id text,
  error_class text NOT NULL,
  redacted_detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_migration.reconciliation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES canonical_migration.runs(id),
  capability_aggregate text NOT NULL,
  metric_key text NOT NULL,
  tenant_id uuid,
  source_value numeric,
  target_value numeric,
  status text NOT NULL CHECK (status IN ('match','mismatch','unknown','skipped')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_migration.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES canonical_migration.runs(id),
  capability_aggregate text NOT NULL,
  cursor_key text NOT NULL,
  cursor_value text,
  watermark_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, cursor_key)
);

CREATE TABLE IF NOT EXISTS canonical_migration.legacy_tenant_map (
  tenant_id uuid PRIMARY KEY,
  legacy_company_id uuid NOT NULL UNIQUE,
  mapped_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

COMMENT ON TABLE canonical_migration.legacy_tenant_map IS
  'Adapter map canonical tenant_id ↔ legacy companies.id; no write authority by itself';
