-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- T-DB-05: Phase 5 public.reengineering_* remain live adapters until authority migrates.
-- These tables are the canonical target shapes; do not dual-write without an authority plan.

CREATE TABLE IF NOT EXISTS eventing.domain_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  tenant_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  aggregate_version bigint,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_kind text,
  actor_id text,
  correlation_id text,
  causation_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  classification text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eventing_domain_events_tenant_occurred_idx
  ON eventing.domain_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS eventing_domain_events_aggregate_idx
  ON eventing.domain_events (tenant_id, aggregate_type, aggregate_id);

CREATE TABLE IF NOT EXISTS eventing.outbox_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES eventing.domain_events(event_id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','published','failed')),
  attempts integer NOT NULL DEFAULT 0,
  lease_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS eventing.consumer_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_key text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consumer_key, event_id)
);

CREATE TABLE IF NOT EXISTS eventing.idempotency_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  operation text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  result_ref text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, operation, idempotency_key)
);

CREATE TABLE IF NOT EXISTS eventing.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  job_type text NOT NULL,
  correlation_id text,
  idempotency_key text,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','running','succeeded','failed','dead')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS eventing_jobs_idem_uq
  ON eventing.jobs (tenant_id, job_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS eventing.job_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES eventing.jobs(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  result text,
  error_class text,
  error_detail text
);

CREATE TABLE IF NOT EXISTS eventing.dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES eventing.jobs(id),
  payload_ref text,
  remediation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eventing.job_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES eventing.jobs(id),
  effect_key text NOT NULL,
  receipt_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, effect_key)
);

COMMENT ON SCHEMA eventing IS
  'Canonical eventing target; adapters: public.reengineering_event_outbox / job ledger until T-DB-05 cutover';
