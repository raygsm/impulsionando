-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS growth.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  channel text NOT NULL,
  platform text,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_sources_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  objective text,
  owner_user_id uuid,
  period_start date,
  period_end date,
  budget_minor bigint,
  budget_currency char(3),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','planned','active','paused','completed','cancelled')),
  external_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT growth_campaigns_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.campaign_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  party_id uuid NOT NULL,
  reason text,
  snapshot_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_campaign_memberships_campaign_fk
    FOREIGN KEY (tenant_id, campaign_id)
    REFERENCES growth.campaigns (tenant_id, id),
  CONSTRAINT growth_campaign_memberships_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  session_id text,
  source_id uuid,
  campaign_id uuid,
  utm_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_touchpoints_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT growth_touchpoints_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES growth.sources (tenant_id, id),
  CONSTRAINT growth_touchpoints_campaign_fk
    FOREIGN KEY (tenant_id, campaign_id)
    REFERENCES growth.campaigns (tenant_id, id),
  CONSTRAINT growth_touchpoints_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.attribution_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  outcome_type text NOT NULL,
  outcome_id uuid NOT NULL,
  model_key text NOT NULL,
  model_version integer NOT NULL,
  source_id uuid,
  touchpoint_id uuid,
  weight numeric(8,6) NOT NULL DEFAULT 1,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_attr_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES growth.sources (tenant_id, id),
  CONSTRAINT growth_attr_touch_fk
    FOREIGN KEY (tenant_id, touchpoint_id)
    REFERENCES growth.touchpoints (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.segment_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_segment_definitions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.segment_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  segment_id uuid NOT NULL,
  version integer NOT NULL,
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_segment_versions_seg_fk
    FOREIGN KEY (tenant_id, segment_id)
    REFERENCES growth.segment_definitions (tenant_id, id),
  UNIQUE (segment_id, version)
);

CREATE TABLE IF NOT EXISTS growth.segment_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  segment_version_id uuid NOT NULL REFERENCES growth.segment_versions(id),
  party_id uuid NOT NULL,
  as_of timestamptz NOT NULL DEFAULT now(),
  freshness_at timestamptz,
  CONSTRAINT growth_segment_snapshots_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  definition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_retention_policies_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.retention_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  policy_id uuid NOT NULL,
  policy_version integer NOT NULL DEFAULT 1,
  classification text NOT NULL,
  score numeric(8,4),
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_retention_signals_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT growth_retention_signals_policy_fk
    FOREIGN KEY (tenant_id, policy_id)
    REFERENCES growth.retention_policies (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.lifecycle_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  lead_id uuid,
  opportunity_id uuid,
  downstream_type text NOT NULL,
  downstream_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth.survey_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  program_version integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_survey_programs_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.survey_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  program_id uuid NOT NULL,
  party_id uuid NOT NULL,
  context_type text,
  context_id uuid,
  channel text,
  state text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_survey_requests_program_fk
    FOREIGN KEY (tenant_id, program_id)
    REFERENCES growth.survey_programs (tenant_id, id),
  CONSTRAINT growth_survey_requests_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS growth.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  request_id uuid NOT NULL,
  score numeric(8,4),
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth.projection_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  projection_key text NOT NULL,
  watermark_at timestamptz,
  rebuilt_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, projection_key)
);
