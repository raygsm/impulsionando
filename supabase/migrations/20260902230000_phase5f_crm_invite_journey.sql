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
