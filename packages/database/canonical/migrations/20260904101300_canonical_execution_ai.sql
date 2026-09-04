-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS communications.channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  provider text NOT NULL,
  channel text NOT NULL,
  secret_ref text,
  sender_identity text,
  readiness text NOT NULL DEFAULT 'not_configured',
  health text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communications_cc_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.channel_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  identity_value text NOT NULL,
  verification_state text NOT NULL DEFAULT 'unverified',
  ownership_state text NOT NULL DEFAULT 'owned',
  CONSTRAINT communications_ci_conn_fk
    FOREIGN KEY (tenant_id, connection_id) REFERENCES communications.channel_connections (tenant_id, id),
  CONSTRAINT communications_ci_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  channel text NOT NULL,
  state text NOT NULL DEFAULT 'open',
  owner_user_id uuid,
  owner_team text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communications_conversations_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  participant_kind text NOT NULL,
  participant_id text NOT NULL,
  role text NOT NULL,
  CONSTRAINT communications_cp_conv_fk
    FOREIGN KEY (tenant_id, conversation_id) REFERENCES communications.conversations (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound','internal')),
  content_ref text,
  sender_ref text,
  classification text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communications_messages_conv_fk
    FOREIGN KEY (tenant_id, conversation_id) REFERENCES communications.conversations (tenant_id, id),
  CONSTRAINT communications_messages_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.message_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  conversation_id uuid,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','prepared','approved','sent','cancelled')),
  payload_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communications_mi_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  message_intent_id uuid NOT NULL,
  provider text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communications_da_intent_fk
    FOREIGN KEY (tenant_id, message_intent_id) REFERENCES communications.message_intents (tenant_id, id),
  UNIQUE (tenant_id, provider, idempotency_key)
);

CREATE TABLE IF NOT EXISTS communications.delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  delivery_attempt_id uuid NOT NULL,
  event_type text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communications.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  purpose text NOT NULL,
  channel text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT communications_templates_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS communications.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid NOT NULL,
  version integer NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT communications_tv_template_fk
    FOREIGN KEY (tenant_id, template_id) REFERENCES communications.templates (tenant_id, id),
  UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS communications.handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  conversation_id uuid,
  from_owner text,
  to_owner text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communications.opt_out_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  channel text NOT NULL,
  purpose text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communications.routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  version integer NOT NULL DEFAULT 1,
  conditions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
);

-- cases: future engine pending P-DB-05; do not dual-authority with support_tickets
CREATE TABLE IF NOT EXISTS cases.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  provider_scope text NOT NULL CHECK (provider_scope IN ('platform_support','tenant_customer_service')),
  requester_ref text,
  subject text,
  priority text NOT NULL DEFAULT 'normal',
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cases_cases_tenant_row UNIQUE (owning_tenant_id, id)
);

COMMENT ON TABLE cases.cases IS
  'Future case engine only. Active platform Support remains public.support_tickets + Nest Support API until P-DB-05 bridge.';

CREATE TABLE IF NOT EXISTS cases.case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_tenant_id uuid NOT NULL,
  case_id uuid NOT NULL,
  body_ref text,
  author_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cases_cm_case_fk
    FOREIGN KEY (owning_tenant_id, case_id) REFERENCES cases.cases (owning_tenant_id, id)
);

CREATE TABLE IF NOT EXISTS cases.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_tenant_id uuid NOT NULL,
  case_id uuid NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cases_ce_case_fk
    FOREIGN KEY (owning_tenant_id, case_id) REFERENCES cases.cases (owning_tenant_id, id)
);

CREATE TABLE IF NOT EXISTS cases.sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  version integer NOT NULL DEFAULT 1,
  clocks_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS cases.sla_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_tenant_id uuid NOT NULL,
  case_id uuid NOT NULL,
  due_at timestamptz,
  paused boolean NOT NULL DEFAULT false,
  breached_at timestamptz,
  CONSTRAINT cases_si_case_fk
    FOREIGN KEY (owning_tenant_id, case_id) REFERENCES cases.cases (owning_tenant_id, id)
);

CREATE TABLE IF NOT EXISTS integrations.providers (
  key text PRIMARY KEY,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  provider_key text NOT NULL REFERENCES integrations.providers(key),
  capability text NOT NULL,
  secret_ref text,
  state text NOT NULL DEFAULT 'not_configured'
    CHECK (state IN ('unavailable','not_configured','configuring','ready','degraded','suspended','disconnected')),
  readiness text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integrations_connections_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS integrations.connection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integrations_ce_conn_fk
    FOREIGN KEY (tenant_id, connection_id) REFERENCES integrations.connections (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS integrations.external_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  domain_type text NOT NULL,
  domain_id uuid NOT NULL,
  provider_key text NOT NULL,
  external_id text NOT NULL,
  UNIQUE (tenant_id, provider_key, external_id)
);

CREATE TABLE IF NOT EXISTS integrations.webhook_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  connection_id uuid,
  provider_key text NOT NULL,
  delivery_id text NOT NULL,
  signature_ok boolean,
  payload_hash text NOT NULL,
  processing_state text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_key, delivery_id)
);

CREATE TABLE IF NOT EXISTS integrations.rate_limit_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  provider_key text NOT NULL,
  window_key text NOT NULL,
  used_count bigint NOT NULL DEFAULT 0,
  rebuilt_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS integrations_rate_limit_state_uq
  ON integrations.rate_limit_state (
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    provider_key,
    window_key
  );

CREATE TABLE IF NOT EXISTS integrations.health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid,
  provider_key text NOT NULL,
  result text NOT NULL,
  correlation_id text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  key text NOT NULL,
  scope text NOT NULL DEFAULT 'tenant',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS automation_wd_tenant_key_uq
  ON automation.workflow_definitions (tenant_id, key) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS automation_wd_global_key_uq
  ON automation.workflow_definitions (key) WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS automation.workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES automation.workflow_definitions(id),
  version integer NOT NULL,
  graph_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version)
);

CREATE TABLE IF NOT EXISTS automation.workflow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_version_id uuid NOT NULL REFERENCES automation.workflow_versions(id),
  trigger_kind text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS automation.workflow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_version_id uuid NOT NULL REFERENCES automation.workflow_versions(id),
  action_key text NOT NULL,
  risk_class text NOT NULL DEFAULT 'normal',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS automation.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  workflow_version_id uuid NOT NULL REFERENCES automation.workflow_versions(id),
  correlation_id text,
  outcome text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS automation.workflow_step_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES automation.workflow_runs(id),
  step_key text NOT NULL,
  attempt integer NOT NULL DEFAULT 1,
  input_ref text,
  output_ref text,
  result text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS automation.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  timezone text NOT NULL,
  recurrence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_occurrence_at timestamptz
);

CREATE TABLE IF NOT EXISTS automation.approval_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_action_id uuid NOT NULL REFERENCES automation.workflow_actions(id),
  required_capability text NOT NULL
);

CREATE TABLE IF NOT EXISTS automation.n8n_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  external_workflow_id text NOT NULL,
  external_version text,
  health text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI agent registry; P-DB-09 cardinality still open
CREATE TABLE IF NOT EXISTS ai.agent_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  kind text NOT NULL CHECK (kind IN ('platform_parent','tenant_internal','tenant_client')),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_def_tenant_kind_uq
  ON ai.agent_definitions (tenant_id, kind) WHERE tenant_id IS NOT NULL AND kind IN ('tenant_internal','tenant_client');
CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_def_platform_uq
  ON ai.agent_definitions (kind) WHERE kind = 'platform_parent';

CREATE TABLE IF NOT EXISTS ai.agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai.agent_definitions(id),
  version integer NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE TABLE IF NOT EXISTS ai.agent_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai.agent_definitions(id),
  agent_version_id uuid NOT NULL REFERENCES ai.agent_versions(id),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','inactive')),
  activated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai.tool_definitions (
  key text PRIMARY KEY,
  risk_class text NOT NULL DEFAULT 'normal',
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai.agent_tool_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id uuid NOT NULL REFERENCES ai.agent_versions(id),
  tool_key text NOT NULL REFERENCES ai.tool_definitions(key),
  UNIQUE (agent_version_id, tool_key)
);

CREATE TABLE IF NOT EXISTS ai.tool_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  agent_id uuid,
  tool_key text NOT NULL,
  correlation_id text,
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  tool_invocation_id uuid REFERENCES ai.tool_invocations(id),
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','approved','rejected','expired')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.metric_definitions (
  key text PRIMARY KEY,
  description text NOT NULL,
  freshness_sla_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.projection_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  metric_key text NOT NULL REFERENCES analytics.metric_definitions(key),
  watermark_at timestamptz,
  rebuilt_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ok'
);

CREATE TABLE IF NOT EXISTS analytics.metric_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  metric_key text NOT NULL,
  period_key text NOT NULL,
  value_numeric numeric,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  as_of timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, metric_key, period_key)
);
