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
