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
