-- Phase 5B — reengineering jobs queue + idempotency ledger (staging gate; ADR-005)
CREATE EXTENSION IF NOT EXISTS pgmq;

DO $$ BEGIN PERFORM pgmq.create('reengineering_jobs'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('reengineering_jobs_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reengineering_job_idempotency (
  scope_key TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  job_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reengineering_job_idem_tenant
  ON public.reengineering_job_idempotency (tenant_id);

CREATE INDEX IF NOT EXISTS idx_reengineering_job_idem_state
  ON public.reengineering_job_idempotency (state);

-- Smoke/effect ledger — proves single side-effect under duplicate delivery
CREATE TABLE IF NOT EXISTS public.reengineering_job_effects (
  scope_key TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  effect_type TEXT NOT NULL,
  job_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.enqueue_reengineering_job(payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.send('reengineering_jobs', payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create('reengineering_jobs');
  RETURN pgmq.send('reengineering_jobs', payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_reengineering_job_batch(batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY
    SELECT r.msg_id, r.read_ct, r.message
    FROM pgmq.read('reengineering_jobs', vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create('reengineering_jobs');
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_reengineering_job(message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.delete('reengineering_jobs', message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_reengineering_job_to_dlq(message_id BIGINT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send('reengineering_jobs_dlq', payload) INTO new_id;
  PERFORM pgmq.delete('reengineering_jobs', message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create('reengineering_jobs_dlq');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send('reengineering_jobs_dlq', payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete('reengineering_jobs', message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Returns: claimed | skip_completed | skip_processing
CREATE OR REPLACE FUNCTION public.claim_reengineering_job_idempotency(
  p_scope_key TEXT,
  p_tenant_id UUID,
  p_job_type TEXT,
  p_idempotency_key TEXT,
  p_job_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE existing_state TEXT;
BEGIN
  INSERT INTO public.reengineering_job_idempotency (
    scope_key, tenant_id, job_type, idempotency_key, job_id, state
  ) VALUES (
    p_scope_key, p_tenant_id, p_job_type, p_idempotency_key, p_job_id, 'processing'
  )
  ON CONFLICT (scope_key) DO NOTHING;

  SELECT state INTO existing_state
  FROM public.reengineering_job_idempotency
  WHERE scope_key = p_scope_key;

  IF existing_state = 'completed' THEN
    RETURN 'skip_completed';
  END IF;

  IF existing_state = 'processing' AND EXISTS (
    SELECT 1 FROM public.reengineering_job_idempotency
    WHERE scope_key = p_scope_key AND job_id <> p_job_id
  ) THEN
    RETURN 'skip_processing';
  END IF;

  RETURN 'claimed';
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_reengineering_job_idempotency(p_scope_key TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reengineering_job_idempotency
  SET state = 'completed', completed_at = now(), updated_at = now()
  WHERE scope_key = p_scope_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_reengineering_job_idempotency(p_scope_key TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reengineering_job_idempotency
  SET state = 'failed', updated_at = now()
  WHERE scope_key = p_scope_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_reengineering_job_effect(
  p_scope_key TEXT,
  p_tenant_id UUID,
  p_effect_type TEXT,
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reengineering_job_effects (scope_key, tenant_id, effect_type, job_id)
  VALUES (p_scope_key, p_tenant_id, p_effect_type, p_job_id)
  ON CONFLICT (scope_key) DO NOTHING;
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_reengineering_job(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_reengineering_job(JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_reengineering_job_batch(INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_reengineering_job_batch(INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_reengineering_job(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_reengineering_job(BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_reengineering_job_to_dlq(BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_reengineering_job_to_dlq(BIGINT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_reengineering_job_idempotency(TEXT, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reengineering_job_idempotency(TEXT, UUID, TEXT, TEXT, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_reengineering_job_idempotency(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_reengineering_job_idempotency(TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fail_reengineering_job_idempotency(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_reengineering_job_idempotency(TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_reengineering_job_effect(TEXT, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_reengineering_job_effect(TEXT, UUID, TEXT, UUID) TO service_role;

ALTER TABLE public.reengineering_job_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengineering_job_effects ENABLE ROW LEVEL SECURITY;
