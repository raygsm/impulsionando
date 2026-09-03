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
