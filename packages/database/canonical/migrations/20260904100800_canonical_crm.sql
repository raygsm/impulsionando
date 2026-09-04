-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS crm.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','archived')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  CONSTRAINT crm_pipelines_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  pipeline_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL,
  semantic_kind text NOT NULL CHECK (semantic_kind IN ('open','won','lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_stages_pipeline_fk
    FOREIGN KEY (tenant_id, pipeline_id)
    REFERENCES crm.pipelines (tenant_id, id),
  UNIQUE (pipeline_id, code),
  UNIQUE (pipeline_id, sort_order),
  CONSTRAINT crm_stages_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  customer_account_id uuid,
  source_id uuid,
  touchpoint_id uuid,
  campaign_id uuid,
  owner_user_id uuid,
  qualification_schema_version integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'new'
    CHECK (state IN ('new','contacted','qualified','converted','disqualified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT crm_leads_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT crm_leads_account_fk
    FOREIGN KEY (tenant_id, customer_account_id)
    REFERENCES contacts.customer_accounts (tenant_id, id),
  CONSTRAINT crm_leads_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES growth.sources (tenant_id, id),
  CONSTRAINT crm_leads_touch_fk
    FOREIGN KEY (tenant_id, touchpoint_id)
    REFERENCES growth.touchpoints (tenant_id, id),
  CONSTRAINT crm_leads_campaign_fk
    FOREIGN KEY (tenant_id, campaign_id)
    REFERENCES growth.campaigns (tenant_id, id),
  CONSTRAINT crm_leads_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.lead_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  from_state text,
  to_state text NOT NULL,
  reason text,
  actor_id uuid,
  correlation_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_lead_transitions_lead_fk
    FOREIGN KEY (tenant_id, lead_id)
    REFERENCES crm.leads (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  customer_account_id uuid,
  lead_id uuid,
  pipeline_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  owner_user_id uuid,
  expected_amount_minor bigint,
  expected_currency char(3),
  expected_close_date date,
  state text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open','won','lost','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT crm_opportunities_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT crm_opportunities_account_fk
    FOREIGN KEY (tenant_id, customer_account_id)
    REFERENCES contacts.customer_accounts (tenant_id, id),
  CONSTRAINT crm_opportunities_lead_fk
    FOREIGN KEY (tenant_id, lead_id)
    REFERENCES crm.leads (tenant_id, id),
  CONSTRAINT crm_opportunities_pipeline_fk
    FOREIGN KEY (tenant_id, pipeline_id)
    REFERENCES crm.pipelines (tenant_id, id),
  CONSTRAINT crm_opportunities_stage_fk
    FOREIGN KEY (tenant_id, stage_id)
    REFERENCES crm.stages (tenant_id, id),
  CONSTRAINT crm_opportunities_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.opportunity_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  from_stage_id uuid,
  to_stage_id uuid NOT NULL,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_opp_stage_hist_opp_fk
    FOREIGN KEY (tenant_id, opportunity_id)
    REFERENCES crm.opportunities (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  activity_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  summary text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT crm_activities_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT crm_activities_lead_fk
    FOREIGN KEY (tenant_id, lead_id)
    REFERENCES crm.leads (tenant_id, id),
  CONSTRAINT crm_activities_opp_fk
    FOREIGN KEY (tenant_id, opportunity_id)
    REFERENCES crm.opportunities (tenant_id, id),
  CONSTRAINT crm_activities_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.scoring_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  key text NOT NULL,
  version integer NOT NULL,
  factor_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key, version),
  CONSTRAINT crm_scoring_models_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.score_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  model_id uuid NOT NULL,
  score numeric(10,4) NOT NULL,
  factors_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_score_results_lead_fk
    FOREIGN KEY (tenant_id, lead_id)
    REFERENCES crm.leads (tenant_id, id),
  CONSTRAINT crm_score_results_model_fk
    FOREIGN KEY (tenant_id, model_id)
    REFERENCES crm.scoring_models (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS crm.handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  kind text NOT NULL,
  source_actor_kind text,
  source_actor_id text,
  target_actor_kind text,
  target_actor_id text,
  context_type text,
  context_id uuid,
  reason text,
  sla_due_at timestamptz,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','accepted','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_handoffs_tenant_row UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS crm_leads_tenant_state_idx ON crm.leads (tenant_id, state);
CREATE INDEX IF NOT EXISTS crm_opportunities_tenant_state_idx ON crm.opportunities (tenant_id, state);
