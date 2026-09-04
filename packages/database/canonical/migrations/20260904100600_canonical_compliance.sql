-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS compliance.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  contact_point_id uuid,
  purpose text NOT NULL,
  channel text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('granted','denied','revoked')),
  lawful_basis text,
  policy_version text,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT compliance_consent_events_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT compliance_consent_events_cp_fk
    FOREIGN KEY (tenant_id, contact_point_id)
    REFERENCES contacts.contact_points (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS compliance.consent_current (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid,
  contact_point_id uuid,
  purpose text NOT NULL,
  channel text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('granted','denied','revoked')),
  policy_version text,
  source_event_id uuid REFERENCES compliance.consent_events(id),
  rebuilt_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS compliance_consent_current_uq
  ON compliance.consent_current (
    tenant_id,
    purpose,
    channel,
    COALESCE(party_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(contact_point_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE TABLE IF NOT EXISTS compliance.data_classifications (
  key text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance.retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  resource_type text NOT NULL,
  retention_days integer,
  policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance.legal_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  reason text NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE TABLE IF NOT EXISTS compliance.erasure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  state text NOT NULL DEFAULT 'requested'
    CHECK (state IN ('requested','in_progress','completed','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT compliance_erasure_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS compliance.audit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor_kind text NOT NULL,
  actor_id text,
  platform_delegation_id uuid,
  capability_key text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  before_hash text,
  after_hash text,
  result text NOT NULL,
  correlation_id text,
  request_id text,
  classification text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_audit_tenant_occurred_idx
  ON compliance.audit_records (tenant_id, occurred_at DESC);
