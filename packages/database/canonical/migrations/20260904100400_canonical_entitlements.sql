-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- P-DB-01 open: quota-first plans; plan_modules omitted until feature-tiering accepted.

CREATE TABLE IF NOT EXISTS entitlements.module_definitions (
  key text PRIMARY KEY,
  category text NOT NULL,
  owner_context text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'active'
    CHECK (lifecycle IN ('draft','active','deprecated','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements.module_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL REFERENCES entitlements.module_definitions(key),
  version integer NOT NULL,
  contract_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'published'
    CHECK (state IN ('draft','published','retired')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_key, version)
);

CREATE TABLE IF NOT EXISTS entitlements.module_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_version_id uuid NOT NULL REFERENCES entitlements.module_versions(id),
  depends_on_module_key text NOT NULL REFERENCES entitlements.module_definitions(key),
  min_version integer,
  UNIQUE (module_version_id, depends_on_module_key)
);

CREATE TABLE IF NOT EXISTS entitlements.plan_definitions (
  key text PRIMARY KEY,
  display_name text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'active'
    CHECK (lifecycle IN ('draft','active','deprecated','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements.plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL REFERENCES entitlements.plan_definitions(key),
  version integer NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  price_minor bigint,
  price_currency char(3),
  commercial_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('draft','active','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_key, version)
);

CREATE TABLE IF NOT EXISTS entitlements.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  plan_version_id uuid NOT NULL REFERENCES entitlements.plan_versions(id),
  state text NOT NULL DEFAULT 'trialing'
    CHECK (state IN ('trialing','active','past_due','suspended','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT entitlements_tenant_subscriptions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entitlements.quota_definitions (
  key text PRIMARY KEY,
  measured_subject text NOT NULL,
  unit text NOT NULL,
  reset_policy text NOT NULL DEFAULT 'calendar_month'
    CHECK (reset_policy IN ('none','calendar_month','rolling_30d','billing_period')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements.plan_quota_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id uuid NOT NULL REFERENCES entitlements.plan_versions(id),
  quota_key text NOT NULL REFERENCES entitlements.quota_definitions(key),
  hard_limit bigint,
  soft_limit bigint,
  overage_policy text NOT NULL DEFAULT 'block'
    CHECK (overage_policy IN ('block','warn','allow_metered')),
  UNIQUE (plan_version_id, quota_key)
);

CREATE TABLE IF NOT EXISTS entitlements.quota_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  quota_key text NOT NULL REFERENCES entitlements.quota_definitions(key),
  delta bigint NOT NULL,
  period_key text NOT NULL,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_kind text,
  actor_id text,
  UNIQUE (tenant_id, quota_key, idempotency_key)
);

CREATE TABLE IF NOT EXISTS entitlements.quota_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  quota_key text NOT NULL REFERENCES entitlements.quota_definitions(key),
  period_key text NOT NULL,
  used_amount bigint NOT NULL DEFAULT 0,
  rebuilt_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quota_key, period_key)
);

CREATE TABLE IF NOT EXISTS entitlements.tenant_module_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  module_key text NOT NULL REFERENCES entitlements.module_definitions(key),
  module_version_id uuid REFERENCES entitlements.module_versions(id),
  desired_state text NOT NULL DEFAULT 'enabled'
    CHECK (desired_state IN ('enabled','disabled')),
  effective_state text NOT NULL DEFAULT 'disabled'
    CHECK (effective_state IN ('enabled','disabled','pending','blocked')),
  source text NOT NULL DEFAULT 'manual',
  readiness text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_key),
  CONSTRAINT entitlements_tenant_module_states_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entitlements.tenant_module_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  module_key text NOT NULL REFERENCES entitlements.module_definitions(key),
  action text NOT NULL CHECK (action IN ('enable','disable')),
  reason text,
  actor_id uuid,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements.blueprints (
  key text PRIMARY KEY,
  display_name text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'active'
    CHECK (lifecycle IN ('draft','active','deprecated','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements.blueprint_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_key text NOT NULL REFERENCES entitlements.blueprints(key),
  version integer NOT NULL,
  terminology_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'published'
    CHECK (state IN ('draft','published','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blueprint_key, version)
);

CREATE TABLE IF NOT EXISTS entitlements.blueprint_module_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_version_id uuid NOT NULL REFERENCES entitlements.blueprint_versions(id),
  module_key text NOT NULL REFERENCES entitlements.module_definitions(key),
  recommended_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (blueprint_version_id, module_key)
);

CREATE TABLE IF NOT EXISTS entitlements.tenant_blueprint_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  blueprint_version_id uuid NOT NULL REFERENCES entitlements.blueprint_versions(id),
  override_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_tba_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entitlements.onboarding_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  blueprint_version_id uuid REFERENCES entitlements.blueprint_versions(id),
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','compiled','approved','applying','applied','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT entitlements_onboarding_runs_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entitlements.onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  onboarding_run_id uuid NOT NULL,
  field_key text NOT NULL,
  field_schema_version integer NOT NULL DEFAULT 1,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_onboarding_answers_run_fk
    FOREIGN KEY (tenant_id, onboarding_run_id)
    REFERENCES entitlements.onboarding_runs (tenant_id, id),
  UNIQUE (onboarding_run_id, field_key)
);

CREATE TABLE IF NOT EXISTS entitlements.onboarding_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  onboarding_run_id uuid NOT NULL,
  input_hash text NOT NULL,
  output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflicts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_onboarding_proposals_run_fk
    FOREIGN KEY (tenant_id, onboarding_run_id)
    REFERENCES entitlements.onboarding_runs (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entitlements.onboarding_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  onboarding_run_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_onboarding_apps_run_fk
    FOREIGN KEY (tenant_id, onboarding_run_id)
    REFERENCES entitlements.onboarding_runs (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key)
);

INSERT INTO entitlements.quota_definitions (key, measured_subject, unit, reset_policy) VALUES
  ('active_admin_memberships','admin_membership','count','none'),
  ('active_consumer_accounts','consumer_account','count','none'),
  ('business_units','business_unit','count','none'),
  ('monthly_messages','message','count','calendar_month'),
  ('monthly_ai_tokens','ai_token','count','calendar_month'),
  ('storage_bytes','storage','bytes','none')
ON CONFLICT (key) DO NOTHING;
