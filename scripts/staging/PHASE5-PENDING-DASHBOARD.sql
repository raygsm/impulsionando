-- =============================================================================
-- PHASE 5 PENDING — Supabase Dashboard SQL paste bundle (staging only)
-- =============================================================================
--
-- README (read before running)
-- ---------------------------
-- Project: aamorcqznimmleafavai ONLY (staging).
-- NEVER run on prod (arygtqrdpcdkwnuwsgmm) or any non-staging project.
-- No secrets in this file. No DATABASE_URL required — paste in Dashboard SQL editor.
--
-- Apply order (already concatenated below):
--   1. scripts/staging/phase5b-job-ledger-grants.sql
--      (= migration 20260902131000_phase5b_job_ledger_service_role_select.sql)
--   2. 20260902200000_phase5c_event_outbox.sql
--   3. 20260902210000_phase5d_webhook_ingress.sql
--   4. 20260902220000_phase5e_communication_delivery.sql
--   5. 20260902230000_phase5f_crm_invite_journey.sql
--   6. 20260902240000_phase5g_ops_metrics.sql
--
-- Idempotency notes
-- -----------------
-- Safe to re-run as a whole on staging if a prior partial paste failed mid-way:
--   - GRANT / REVOKE are re-runnable
--   - CREATE TABLE / INDEX use IF NOT EXISTS
--   - Functions use CREATE OR REPLACE
--   - Policies use DROP POLICY IF EXISTS before CREATE POLICY
-- Not a substitute for Phase 4B DDL/seeds (aliases/membership/entitlements) —
-- those are outside this Phase 5 pending bundle.
-- After SQL: set Dokploy env WEBHOOK_SECRET_REENGINEERING_SMOKE on reengineering-api
-- (see scripts/staging/README-PHASE5-APPLY.md). Do not start Phase 6 from this apply.
--
-- Generated for human Dashboard paste — leave sources as SoT in supabase/migrations/.
-- =============================================================================


-- #############################################################################
-- SECTION 1: Phase 5B residual — service_role SELECT on job ledgers + get_reengineering_job_effect
-- Source: scripts/staging/phase5b-job-ledger-grants.sql
-- Note: Same SQL as supabase/migrations/20260902131000_phase5b_job_ledger_service_role_select.sql
-- Idempotent: GRANT SELECT may be re-run; CREATE OR REPLACE FUNCTION replaces definition.
-- #############################################################################
-- Staging-only apply helper (project aamorcqznimmleafavai). Same as
-- supabase/migrations/20260902131000_phase5b_job_ledger_service_role_select.sql
-- Never run on prod arygtqrdpcdkwnuwsgmm.

GRANT SELECT ON TABLE public.reengineering_job_effects TO service_role;
GRANT SELECT ON TABLE public.reengineering_job_idempotency TO service_role;

CREATE OR REPLACE FUNCTION public.get_reengineering_job_effect(p_scope_key TEXT)
RETURNS TABLE (
  scope_key TEXT,
  tenant_id UUID,
  effect_type TEXT,
  job_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.scope_key, e.tenant_id, e.effect_type, e.job_id, e.created_at
  FROM public.reengineering_job_effects e
  WHERE e.scope_key = p_scope_key;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reengineering_job_effect(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reengineering_job_effect(TEXT) TO service_role;

-- #############################################################################
-- SECTION 2: Phase 5C — transactional event outbox
-- Source: supabase/migrations/20260902200000_phase5c_event_outbox.sql
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS; CREATE OR REPLACE FUNCTION; GRANT/REVOKE re-runnable.
-- #############################################################################
-- Phase 5C — transactional event outbox (staging gate; ADR-005 / CONTRACT-EVENTS-JOBS)
-- Do NOT apply on prod without Phase 5C staging evidence.

CREATE TABLE IF NOT EXISTS public.reengineering_event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  tenant_id UUID NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  envelope JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'failed')),
  publish_attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT reengineering_event_outbox_event_id_unique UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_reengineering_event_outbox_pending
  ON public.reengineering_event_outbox (status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reengineering_event_outbox_tenant
  ON public.reengineering_event_outbox (tenant_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_event_outbox_correlation
  ON public.reengineering_event_outbox (correlation_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reengineering_event_outbox_idempotency
  ON public.reengineering_event_outbox (tenant_id, event_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Insert pending outbox row from EventEnvelope JSON (service_role only).
CREATE OR REPLACE FUNCTION public.write_reengineering_event_outbox(p_envelope JSONB)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_idem TEXT;
BEGIN
  v_event_id := (p_envelope->>'eventId')::uuid;
  v_idem := NULLIF(p_envelope->>'idempotencyKey', '');

  INSERT INTO public.reengineering_event_outbox (
    event_id,
    event_type,
    schema_version,
    tenant_id,
    correlation_id,
    idempotency_key,
    occurred_at,
    payload,
    envelope,
    status
  ) VALUES (
    v_event_id,
    p_envelope->>'type',
    COALESCE((p_envelope->>'schemaVersion')::int, 1),
    (p_envelope->>'tenantId')::uuid,
    p_envelope->>'correlationId',
    v_idem,
    COALESCE((p_envelope->>'occurredAt')::timestamptz, now()),
    COALESCE(p_envelope->'payload', '{}'::jsonb),
    p_envelope,
    'pending'
  )
  ON CONFLICT (event_id) DO NOTHING;

  IF v_idem IS NOT NULL THEN
    -- Idempotent replay: return existing event_id for same business key
    SELECT event_id INTO v_event_id
    FROM public.reengineering_event_outbox
    WHERE tenant_id = (p_envelope->>'tenantId')::uuid
      AND event_type = p_envelope->>'type'
      AND idempotency_key = v_idem
    LIMIT 1;
  END IF;

  RETURN v_event_id;
END;
$$;

-- Claim a batch of pending outbox rows for the worker publisher (FOR UPDATE SKIP LOCKED).
CREATE OR REPLACE FUNCTION public.claim_reengineering_outbox_batch(p_batch_size INT)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  event_type TEXT,
  tenant_id UUID,
  correlation_id TEXT,
  envelope JSONB,
  publish_attempts INT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT o.id
    FROM public.reengineering_event_outbox o
    WHERE o.status = 'pending'
    ORDER BY o.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(COALESCE(p_batch_size, 10), 100))
  )
  UPDATE public.reengineering_event_outbox o
  SET publish_attempts = o.publish_attempts + 1
  FROM claimed
  WHERE o.id = claimed.id
  RETURNING
    o.id,
    o.event_id,
    o.event_type,
    o.tenant_id,
    o.correlation_id,
    o.envelope,
    o.publish_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_reengineering_outbox_published(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reengineering_event_outbox
  SET status = 'published',
      published_at = now(),
      last_error = NULL
  WHERE event_id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_reengineering_outbox_failed(p_event_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reengineering_event_outbox
  SET status = 'failed',
      last_error = left(COALESCE(p_error, 'unknown'), 2000)
  WHERE event_id = p_event_id;
END;
$$;

-- True transactional path: support ticket + outbox in one DB transaction.
-- Used by Nest Support create when Phase 5C migration is applied.
CREATE OR REPLACE FUNCTION public.create_support_ticket_with_outbox(
  p_ticket JSONB,
  p_outbox_envelope JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_tickets%ROWTYPE;
  v_event_id UUID;
BEGIN
  INSERT INTO public.support_tickets (
    company_id,
    category,
    priority,
    status,
    subject,
    description,
    source_channel,
    requester_user_id,
    ticket_code,
    metadata
  ) VALUES (
    (p_ticket->>'company_id')::uuid,
    p_ticket->>'category',
    p_ticket->>'priority',
    COALESCE(p_ticket->>'status', 'open'),
    p_ticket->>'subject',
    p_ticket->>'description',
    p_ticket->>'source_channel',
    NULLIF(p_ticket->>'requester_user_id', '')::uuid,
    p_ticket->>'ticket_code',
    COALESCE(p_ticket->'metadata', '{}'::jsonb)
  )
  RETURNING * INTO v_row;

  -- Ensure outbox payload carries ticket id if caller left it empty
  p_outbox_envelope := jsonb_set(
    p_outbox_envelope,
    '{payload,ticketId}',
    to_jsonb(v_row.id::text),
    true
  );
  p_outbox_envelope := jsonb_set(
    p_outbox_envelope,
    '{payload,protocol}',
    to_jsonb(v_row.ticket_code),
    true
  );

  v_event_id := public.write_reengineering_event_outbox(p_outbox_envelope);

  INSERT INTO public.support_ticket_events (
    ticket_id,
    event_type,
    actor_user_id,
    from_value,
    to_value,
    metadata
  ) VALUES (
    v_row.id,
    'support.ticket.created',
    NULLIF(p_ticket->>'requester_user_id', '')::uuid,
    NULL,
    'new',
    jsonb_build_object(
      'schemaVersion', 1,
      'eventId', v_event_id,
      'correlationId', p_outbox_envelope->>'correlationId',
      'action', 'support.ticket.created',
      'source', COALESCE(p_ticket->'metadata'->>'source', 'api.v1.support'),
      'outbox', true
    )
  );

  RETURN jsonb_build_object(
    'id', v_row.id,
    'ticket_code', v_row.ticket_code,
    'status', v_row.status,
    'eventId', v_event_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.write_reengineering_event_outbox(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_reengineering_event_outbox(JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_reengineering_outbox_batch(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reengineering_outbox_batch(INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_reengineering_outbox_published(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_reengineering_outbox_published(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_reengineering_outbox_failed(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_reengineering_outbox_failed(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_support_ticket_with_outbox(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_support_ticket_with_outbox(JSONB, JSONB) TO service_role;

ALTER TABLE public.reengineering_event_outbox ENABLE ROW LEVEL SECURITY;

-- #############################################################################
-- SECTION 3: Phase 5D — webhook ingress audit
-- Source: supabase/migrations/20260902210000_phase5d_webhook_ingress.sql
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS; DROP POLICY IF EXISTS + CREATE POLICY; CREATE OR REPLACE FUNCTION.
-- #############################################################################
-- Phase 5D — secure webhook ingress audit (staging gate)
-- Stores signature/replay outcomes + payload SHA-256 only (no raw secrets).
-- Do NOT apply to prod from this track without an explicit gate.

CREATE TABLE IF NOT EXISTS public.reengineering_webhook_ingress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT,
  scope_key TEXT,
  signature_ok BOOLEAN NOT NULL,
  replay_rejected BOOLEAN NOT NULL DEFAULT false,
  reject_reason TEXT,
  payload_sha256 TEXT NOT NULL,
  payload_redacted JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reengineering_webhook_ingress_sha256_hex
    CHECK (payload_sha256 ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_reengineering_webhook_ingress_provider_received
  ON public.reengineering_webhook_ingress (provider, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_reengineering_webhook_ingress_correlation
  ON public.reengineering_webhook_ingress (correlation_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_webhook_ingress_scope
  ON public.reengineering_webhook_ingress (scope_key)
  WHERE scope_key IS NOT NULL;

-- One accepted delivery per provider+idempotency scope
CREATE UNIQUE INDEX IF NOT EXISTS uq_reengineering_webhook_ingress_accepted_scope
  ON public.reengineering_webhook_ingress (scope_key)
  WHERE signature_ok AND NOT replay_rejected AND scope_key IS NOT NULL;

COMMENT ON TABLE public.reengineering_webhook_ingress IS
  'Phase 5D webhook ingress audit — payload_sha256 + redacted JSON only; service_role write via RPC';

CREATE OR REPLACE FUNCTION public.record_reengineering_webhook_ingress(
  p_provider TEXT,
  p_correlation_id TEXT,
  p_idempotency_key TEXT,
  p_scope_key TEXT,
  p_signature_ok BOOLEAN,
  p_replay_rejected BOOLEAN,
  p_reject_reason TEXT,
  p_payload_sha256 TEXT,
  p_payload_redacted JSONB,
  p_received_at TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
  is_duplicate BOOLEAN := false;
  final_replay BOOLEAN := COALESCE(p_replay_rejected, false);
  final_reason TEXT := p_reject_reason;
BEGIN
  -- Durable replay: same scope already accepted with a valid signature
  IF p_signature_ok AND p_scope_key IS NOT NULL AND NOT final_replay THEN
    SELECT id INTO existing_id
    FROM public.reengineering_webhook_ingress
    WHERE scope_key = p_scope_key
      AND signature_ok
      AND NOT replay_rejected
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      is_duplicate := true;
      final_replay := true;
      final_reason := COALESCE(final_reason, 'REPLAY_DUPLICATE');
    END IF;
  END IF;

  INSERT INTO public.reengineering_webhook_ingress (
    provider,
    correlation_id,
    idempotency_key,
    scope_key,
    signature_ok,
    replay_rejected,
    reject_reason,
    payload_sha256,
    payload_redacted,
    received_at
  ) VALUES (
    p_provider,
    p_correlation_id,
    p_idempotency_key,
    p_scope_key,
    p_signature_ok,
    final_replay,
    final_reason,
    lower(p_payload_sha256),
    p_payload_redacted,
    COALESCE(p_received_at, now())
  )
  RETURNING id INTO new_id;

  RETURN jsonb_build_object(
    'ingress_id', new_id,
    'duplicate', is_duplicate,
    'existing_id', existing_id
  );
END;
$$;

REVOKE ALL ON TABLE public.reengineering_webhook_ingress FROM PUBLIC;
REVOKE ALL ON TABLE public.reengineering_webhook_ingress FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.reengineering_webhook_ingress TO service_role;

ALTER TABLE public.reengineering_webhook_ingress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reengineering_webhook_ingress_service_role ON public.reengineering_webhook_ingress;
CREATE POLICY reengineering_webhook_ingress_service_role
  ON public.reengineering_webhook_ingress
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION public.record_reengineering_webhook_ingress(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT, JSONB, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_reengineering_webhook_ingress(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT, JSONB, TIMESTAMPTZ
) TO service_role;

-- #############################################################################
-- SECTION 4: Phase 5E — communication delivery ledger
-- Source: supabase/migrations/20260902220000_phase5e_communication_delivery.sql
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS; DROP POLICY IF EXISTS + CREATE POLICY; CREATE OR REPLACE FUNCTION.
-- #############################################################################
-- Phase 5E — communication delivery ledger (staging gate)
-- Intent → policy → provider outcome. Do NOT apply to prod from this track.
-- service_role RPCs only; RLS enabled; no raw provider secrets stored.

CREATE TABLE IF NOT EXISTS public.reengineering_communication_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  correlation_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  template_id TEXT NOT NULL,
  template_version INT NOT NULL CHECK (template_version > 0),
  recipient_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'queued',
    'sending',
    'delivered',
    'failed',
    'opted_out',
    'no_consent',
    'cooldown_skipped',
    'dedup_skipped',
    'allowlist_denied'
  )),
  skip_reason TEXT,
  provider TEXT,
  provider_message_id TEXT,
  dedup_key TEXT,
  cooldown_key TEXT,
  idempotency_key TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reengineering_communication_delivery_intent_unique UNIQUE (intent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reengineering_comm_delivery_idempotency
  ON public.reengineering_communication_delivery (tenant_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reengineering_comm_delivery_dedup
  ON public.reengineering_communication_delivery (tenant_id, channel, dedup_key)
  WHERE dedup_key IS NOT NULL
    AND status = 'delivered';

CREATE INDEX IF NOT EXISTS idx_reengineering_comm_delivery_tenant_status
  ON public.reengineering_communication_delivery (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reengineering_comm_delivery_correlation
  ON public.reengineering_communication_delivery (correlation_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_comm_delivery_cooldown
  ON public.reengineering_communication_delivery (tenant_id, channel, cooldown_key, delivered_at DESC)
  WHERE cooldown_key IS NOT NULL AND status = 'delivered';

COMMENT ON TABLE public.reengineering_communication_delivery IS
  'Phase 5E communication delivery ledger — sink/provider outcomes; service_role write via RPC';

CREATE OR REPLACE FUNCTION public.upsert_reengineering_communication_delivery(
  p_intent_id UUID,
  p_tenant_id UUID,
  p_correlation_id TEXT,
  p_channel TEXT,
  p_template_id TEXT,
  p_template_version INT,
  p_recipient_address TEXT,
  p_status TEXT,
  p_skip_reason TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_provider_message_id TEXT DEFAULT NULL,
  p_dedup_key TEXT DEFAULT NULL,
  p_cooldown_key TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_requested_at TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_delivered_at TIMESTAMPTZ := NULL;
BEGIN
  IF p_status = 'delivered' THEN
    v_delivered_at := now();
  END IF;

  INSERT INTO public.reengineering_communication_delivery (
    intent_id,
    tenant_id,
    correlation_id,
    channel,
    template_id,
    template_version,
    recipient_address,
    status,
    skip_reason,
    provider,
    provider_message_id,
    dedup_key,
    cooldown_key,
    idempotency_key,
    error_code,
    error_message,
    requested_at,
    delivered_at
  ) VALUES (
    p_intent_id,
    p_tenant_id,
    p_correlation_id,
    p_channel,
    p_template_id,
    p_template_version,
    p_recipient_address,
    p_status,
    p_skip_reason,
    p_provider,
    p_provider_message_id,
    NULLIF(p_dedup_key, ''),
    NULLIF(p_cooldown_key, ''),
    COALESCE(NULLIF(p_idempotency_key, ''), p_intent_id::text),
    p_error_code,
    left(p_error_message, 2000),
    COALESCE(p_requested_at, now()),
    v_delivered_at
  )
  ON CONFLICT (intent_id) DO UPDATE SET
    status = EXCLUDED.status,
    skip_reason = EXCLUDED.skip_reason,
    provider = EXCLUDED.provider,
    provider_message_id = EXCLUDED.provider_message_id,
    error_code = EXCLUDED.error_code,
    error_message = EXCLUDED.error_message,
    updated_at = now(),
    delivered_at = COALESCE(EXCLUDED.delivered_at, public.reengineering_communication_delivery.delivered_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reengineering_communication_delivery_by_dedup(
  p_tenant_id UUID,
  p_channel TEXT,
  p_dedup_key TEXT
)
RETURNS TABLE (
  id UUID,
  intent_id UUID,
  status TEXT,
  delivered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.intent_id, d.status, d.delivered_at
  FROM public.reengineering_communication_delivery d
  WHERE d.tenant_id = p_tenant_id
    AND d.channel = p_channel
    AND d.dedup_key = p_dedup_key
    AND d.status = 'delivered'
  ORDER BY d.delivered_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

REVOKE ALL ON TABLE public.reengineering_communication_delivery FROM PUBLIC;
REVOKE ALL ON TABLE public.reengineering_communication_delivery FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.reengineering_communication_delivery TO service_role;

ALTER TABLE public.reengineering_communication_delivery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reengineering_communication_delivery_service_role
  ON public.reengineering_communication_delivery;
CREATE POLICY reengineering_communication_delivery_service_role
  ON public.reengineering_communication_delivery
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION public.upsert_reengineering_communication_delivery(
  UUID, UUID, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_reengineering_communication_delivery(
  UUID, UUID, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_reengineering_communication_delivery_by_dedup(
  UUID, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reengineering_communication_delivery_by_dedup(
  UUID, TEXT, TEXT
) TO service_role;

-- #############################################################################
-- SECTION 5: Phase 5F — CRM invite journey
-- Source: supabase/migrations/20260902230000_phase5f_crm_invite_journey.sql
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS; CREATE OR REPLACE FUNCTION. Depends on 5C write_reengineering_event_outbox.
-- #############################################################################
-- Phase 5F — CRM invitation journey tables + transactional RPCs (staging gate)
-- Synthetic/test recipients only. Do NOT apply on prod without an explicit gate.
-- Depends on Phase 5C write_reengineering_event_outbox when using *_with_outbox RPCs.

CREATE TABLE IF NOT EXISTS public.reengineering_crm_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  correlation_id TEXT NOT NULL,
  contact_ref TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN (
      'selected',
      'invite_created',
      'dispatched',
      'link_clicked',
      'first_login',
      'completed',
      'revoked',
      'expired'
    )),
  invite_id UUID,
  active_reminder_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  cancelled_reminder_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_context JSONB,
  schema_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reengineering_crm_journey_tenant
  ON public.reengineering_crm_journey (tenant_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_crm_journey_correlation
  ON public.reengineering_crm_journey (correlation_id);

CREATE TABLE IF NOT EXISTS public.reengineering_crm_invite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  journey_id UUID NOT NULL REFERENCES public.reengineering_crm_journey (id),
  correlation_id TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  token_hash TEXT NOT NULL
    CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status TEXT NOT NULL
    CHECK (status IN (
      'pending',
      'dispatched',
      'clicked',
      'redeemed',
      'revoked',
      'expired'
    )),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  channel TEXT NOT NULL DEFAULT 'sink'
    CHECK (channel IN ('email', 'whatsapp', 'sink')),
  schema_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reengineering_crm_invite_tenant
  ON public.reengineering_crm_invite (tenant_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_crm_invite_journey
  ON public.reengineering_crm_invite (journey_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reengineering_crm_invite_token_hash
  ON public.reengineering_crm_invite (token_hash);

COMMENT ON TABLE public.reengineering_crm_journey IS
  'Phase 5F canonical CRM journey state — API owns; n8n must not write';

COMMENT ON TABLE public.reengineering_crm_invite IS
  'Phase 5F expiring/revocable invites — token_hash only; synthetic recipients';

-- Create journey + invite + outbox in one transaction.
CREATE OR REPLACE FUNCTION public.create_crm_invite_with_outbox(
  p_journey JSONB,
  p_invite JSONB,
  p_outbox_envelope JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journey public.reengineering_crm_journey%ROWTYPE;
  v_invite public.reengineering_crm_invite%ROWTYPE;
  v_event_id UUID;
BEGIN
  INSERT INTO public.reengineering_crm_journey (
    id,
    tenant_id,
    correlation_id,
    contact_ref,
    status,
    invite_id,
    active_reminder_keys,
    cancelled_reminder_keys,
    support_context,
    schema_version,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NULLIF(p_journey->>'id', '')::uuid, gen_random_uuid()),
    (p_journey->>'tenant_id')::uuid,
    p_journey->>'correlation_id',
    p_journey->>'contact_ref',
    COALESCE(p_journey->>'status', 'invite_created'),
    NULLIF(p_journey->>'invite_id', '')::uuid,
    COALESCE(p_journey->'active_reminder_keys', '[]'::jsonb),
    COALESCE(p_journey->'cancelled_reminder_keys', '[]'::jsonb),
    p_journey->'support_context',
    COALESCE((p_journey->>'schema_version')::int, 1),
    COALESCE((p_journey->>'created_at')::timestamptz, now()),
    COALESCE((p_journey->>'updated_at')::timestamptz, now())
  )
  RETURNING * INTO v_journey;

  INSERT INTO public.reengineering_crm_invite (
    id,
    tenant_id,
    journey_id,
    correlation_id,
    recipient_address,
    token_hash,
    status,
    expires_at,
    revoked_at,
    clicked_at,
    redeemed_at,
    channel,
    schema_version,
    created_at
  ) VALUES (
    COALESCE(NULLIF(p_invite->>'id', '')::uuid, gen_random_uuid()),
    (p_invite->>'tenant_id')::uuid,
    COALESCE(NULLIF(p_invite->>'journey_id', '')::uuid, v_journey.id),
    p_invite->>'correlation_id',
    lower(p_invite->>'recipient_address'),
    lower(p_invite->>'token_hash'),
    COALESCE(p_invite->>'status', 'pending'),
    (p_invite->>'expires_at')::timestamptz,
    NULLIF(p_invite->>'revoked_at', '')::timestamptz,
    NULLIF(p_invite->>'clicked_at', '')::timestamptz,
    NULLIF(p_invite->>'redeemed_at', '')::timestamptz,
    COALESCE(p_invite->>'channel', 'sink'),
    COALESCE((p_invite->>'schema_version')::int, 1),
    COALESCE((p_invite->>'created_at')::timestamptz, now())
  )
  RETURNING * INTO v_invite;

  UPDATE public.reengineering_crm_journey
  SET invite_id = v_invite.id,
      updated_at = now()
  WHERE id = v_journey.id;

  p_outbox_envelope := jsonb_set(
    p_outbox_envelope,
    '{payload,inviteId}',
    to_jsonb(v_invite.id::text),
    true
  );
  p_outbox_envelope := jsonb_set(
    p_outbox_envelope,
    '{payload,journeyId}',
    to_jsonb(v_journey.id::text),
    true
  );

  v_event_id := public.write_reengineering_event_outbox(p_outbox_envelope);

  RETURN jsonb_build_object(
    'journeyId', v_journey.id,
    'inviteId', v_invite.id,
    'eventId', v_event_id
  );
END;
$$;

-- Record click once (single-effect) + outbox invite.link_clicked.
CREATE OR REPLACE FUNCTION public.record_crm_invite_click_with_outbox(
  p_invite_id UUID,
  p_clicked_at TIMESTAMPTZ,
  p_outbox_envelope JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.reengineering_crm_invite%ROWTYPE;
  v_journey public.reengineering_crm_journey%ROWTYPE;
  v_event_id UUID;
  v_effect TEXT := 'applied';
BEGIN
  SELECT * INTO v_invite
  FROM public.reengineering_crm_invite
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND';
  END IF;

  IF v_invite.status = 'revoked' OR v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_REVOKED';
  END IF;

  IF v_invite.status = 'expired' OR v_invite.expires_at <= COALESCE(p_clicked_at, now()) THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;

  IF v_invite.status = 'redeemed' THEN
    RAISE EXCEPTION 'INVITE_REDEEMED';
  END IF;

  IF v_invite.status = 'clicked' THEN
    v_effect := 'noop';
  ELSE
    UPDATE public.reengineering_crm_invite
    SET status = 'clicked',
        clicked_at = COALESCE(p_clicked_at, now())
    WHERE id = p_invite_id
    RETURNING * INTO v_invite;
  END IF;

  UPDATE public.reengineering_crm_journey
  SET status = CASE
        WHEN status IN ('invite_created', 'dispatched', 'link_clicked') THEN 'link_clicked'
        ELSE status
      END,
      updated_at = now()
  WHERE id = v_invite.journey_id
  RETURNING * INTO v_journey;

  IF v_effect = 'applied' THEN
    v_event_id := public.write_reengineering_event_outbox(p_outbox_envelope);
  ELSE
    -- Idempotent replay: reuse existing outbox row if present
    SELECT event_id INTO v_event_id
    FROM public.reengineering_event_outbox
    WHERE tenant_id = v_invite.tenant_id
      AND event_type = 'invite.link_clicked'
      AND idempotency_key = 'click:' || p_invite_id::text
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'invite', row_to_json(v_invite),
    'journey', row_to_json(v_journey),
    'eventId', v_event_id,
    'effect', v_effect
  );
END;
$$;

-- First login redeems invite, cancels reminders, emits account.first_login.
CREATE OR REPLACE FUNCTION public.record_crm_first_login_with_outbox(
  p_invite_id UUID,
  p_redeemed_at TIMESTAMPTZ,
  p_active_reminder_keys JSONB,
  p_cancelled_reminder_keys JSONB,
  p_outbox_envelope JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.reengineering_crm_invite%ROWTYPE;
  v_journey public.reengineering_crm_journey%ROWTYPE;
  v_event_id UUID;
  v_prev_cancelled JSONB;
  v_newly JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_invite
  FROM public.reengineering_crm_invite
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND';
  END IF;

  IF v_invite.status = 'revoked' OR v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_REVOKED';
  END IF;

  IF v_invite.status = 'expired' OR v_invite.expires_at <= COALESCE(p_redeemed_at, now()) THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;

  UPDATE public.reengineering_crm_invite
  SET status = 'redeemed',
      redeemed_at = COALESCE(p_redeemed_at, now())
  WHERE id = p_invite_id
  RETURNING * INTO v_invite;

  SELECT cancelled_reminder_keys INTO v_prev_cancelled
  FROM public.reengineering_crm_journey
  WHERE id = v_invite.journey_id
  FOR UPDATE;

  UPDATE public.reengineering_crm_journey
  SET status = 'first_login',
      active_reminder_keys = COALESCE(p_active_reminder_keys, '[]'::jsonb),
      cancelled_reminder_keys = COALESCE(p_cancelled_reminder_keys, '[]'::jsonb),
      updated_at = now()
  WHERE id = v_invite.journey_id
  RETURNING * INTO v_journey;

  -- Diff newly cancelled for response (array-element subtract)
  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  INTO v_newly
  FROM jsonb_array_elements_text(COALESCE(p_cancelled_reminder_keys, '[]'::jsonb)) AS x
  WHERE NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(COALESCE(v_prev_cancelled, '[]'::jsonb)) AS prev(y)
    WHERE prev.y = x
  );

  v_event_id := public.write_reengineering_event_outbox(p_outbox_envelope);

  RETURN jsonb_build_object(
    'invite', row_to_json(v_invite),
    'journey', row_to_json(v_journey),
    'eventId', v_event_id,
    'newlyCancelled', COALESCE(v_newly, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON TABLE public.reengineering_crm_journey FROM PUBLIC;
REVOKE ALL ON TABLE public.reengineering_crm_invite FROM PUBLIC;

ALTER TABLE public.reengineering_crm_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengineering_crm_invite ENABLE ROW LEVEL SECURITY;

-- No authenticated policies — service_role via RPCs only (default deny for anon/auth).
-- service_role bypasses RLS in Supabase; RPCs are SECURITY DEFINER for explicit grants.

REVOKE EXECUTE ON FUNCTION public.create_crm_invite_with_outbox(JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_crm_invite_with_outbox(JSONB, JSONB, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_crm_invite_click_with_outbox(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_crm_invite_click_with_outbox(UUID, TIMESTAMPTZ, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_crm_first_login_with_outbox(UUID, TIMESTAMPTZ, JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_crm_first_login_with_outbox(UUID, TIMESTAMPTZ, JSONB, JSONB, JSONB) TO service_role;

-- #############################################################################
-- SECTION 6: Phase 5G — ops queue metrics RPC
-- Source: supabase/migrations/20260902240000_phase5g_ops_metrics.sql
-- Idempotent: CREATE OR REPLACE FUNCTION + GRANT/REVOKE. Depends on 5B pgmq queues + reengineering_job_idempotency.
-- #############################################################################
-- Phase 5G — read-only ops metrics RPCs (depends on 5B pgmq + idempotency ledger).
-- Additive only. DO NOT apply from this agent session — operator applies on staging when ready.
-- No writes to queues; service_role execute only.

CREATE OR REPLACE FUNCTION public.get_reengineering_queue_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  jobs_length BIGINT := 0;
  jobs_oldest INT := NULL;
  jobs_newest INT := NULL;
  jobs_total BIGINT := NULL;
  jobs_visible BIGINT := NULL;
  dlq_length BIGINT := 0;
  dlq_oldest INT := NULL;
  dlq_newest INT := NULL;
  dlq_total BIGINT := NULL;
  dlq_visible BIGINT := NULL;
  processing_count BIGINT := 0;
  completed_count BIGINT := 0;
  failed_count BIGINT := 0;
BEGIN
  BEGIN
    SELECT
      m.queue_length,
      m.oldest_msg_age_sec,
      m.newest_msg_age_sec,
      m.total_messages,
      m.queue_visible_length
    INTO
      jobs_length,
      jobs_oldest,
      jobs_newest,
      jobs_total,
      jobs_visible
    FROM pgmq.metrics('reengineering_jobs') m;
  EXCEPTION
    WHEN OTHERS THEN
      jobs_length := 0;
      jobs_oldest := NULL;
      jobs_newest := NULL;
      jobs_total := NULL;
      jobs_visible := NULL;
  END;

  BEGIN
    SELECT
      m.queue_length,
      m.oldest_msg_age_sec,
      m.newest_msg_age_sec,
      m.total_messages,
      m.queue_visible_length
    INTO
      dlq_length,
      dlq_oldest,
      dlq_newest,
      dlq_total,
      dlq_visible
    FROM pgmq.metrics('reengineering_jobs_dlq') m;
  EXCEPTION
    WHEN OTHERS THEN
      dlq_length := 0;
      dlq_oldest := NULL;
      dlq_newest := NULL;
      dlq_total := NULL;
      dlq_visible := NULL;
  END;

  BEGIN
    SELECT
      COUNT(*) FILTER (WHERE state = 'processing'),
      COUNT(*) FILTER (WHERE state = 'completed'),
      COUNT(*) FILTER (WHERE state = 'failed')
    INTO processing_count, completed_count, failed_count
    FROM public.reengineering_job_idempotency;
  EXCEPTION
    WHEN undefined_table THEN
      processing_count := 0;
      completed_count := 0;
      failed_count := 0;
  END;

  RETURN jsonb_build_object(
    'schemaVersion', 1,
    'scrapedAt', now(),
    'queues', jsonb_build_array(
      jsonb_build_object(
        'queueName', 'reengineering_jobs',
        'backlog', COALESCE(jobs_length, 0),
        'oldestJobAgeSeconds', COALESCE(to_jsonb(jobs_oldest), 'null'::jsonb),
        'newestJobAgeSeconds', COALESCE(to_jsonb(jobs_newest), 'null'::jsonb),
        'totalMessages', COALESCE(to_jsonb(jobs_total), 'null'::jsonb),
        'visibleLength', COALESCE(to_jsonb(jobs_visible), 'null'::jsonb)
      ),
      jsonb_build_object(
        'queueName', 'reengineering_jobs_dlq',
        'backlog', COALESCE(dlq_length, 0),
        'oldestJobAgeSeconds', COALESCE(to_jsonb(dlq_oldest), 'null'::jsonb),
        'newestJobAgeSeconds', COALESCE(to_jsonb(dlq_newest), 'null'::jsonb),
        'totalMessages', COALESCE(to_jsonb(dlq_total), 'null'::jsonb),
        'visibleLength', COALESCE(to_jsonb(dlq_visible), 'null'::jsonb)
      )
    ),
    'idempotency', jsonb_build_object(
      'processing', processing_count,
      'completed', completed_count,
      'failed', failed_count
    ),
    'dlqBacklog', COALESCE(dlq_length, 0),
    'providerLatencyMsP50', 'null'::jsonb,
    'providerLatencyMsP95', 'null'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reengineering_queue_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reengineering_queue_metrics() TO service_role;

COMMENT ON FUNCTION public.get_reengineering_queue_metrics() IS
  'Phase 5G read-only queue/idempotency metrics for ops API. No secrets. No queue mutations.';
