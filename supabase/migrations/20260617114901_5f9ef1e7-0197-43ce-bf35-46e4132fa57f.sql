
-- =========================================================
-- Fase A — Webhook log, expiração de PIX, status failed/expired, dedupe SMS
-- =========================================================

-- 1) webhook_event_log: campos de reprocessamento
ALTER TABLE public.webhook_event_log
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS replay_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_reason text,
  ADD COLUMN IF NOT EXISTS replayed_by uuid,
  ADD COLUMN IF NOT EXISTS replayed_at timestamptz;

CREATE INDEX IF NOT EXISTS webhook_event_log_status_idx
  ON public.webhook_event_log(status);
CREATE INDEX IF NOT EXISTS webhook_event_log_processed_at_idx
  ON public.webhook_event_log(processed_at DESC);

-- 2) restaurant_table_invoices: expiração + tentativa + erro
ALTER TABLE public.restaurant_table_invoices
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

CREATE INDEX IF NOT EXISTS restaurant_table_invoices_session_idx
  ON public.restaurant_table_invoices(session_id, created_at DESC);

-- 3) Dedupe por canal SMS
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS notified_ready_sms_at timestamptz;

ALTER TABLE public.restaurant_table_sessions
  ADD COLUMN IF NOT EXISTS bill_notified_sms_at timestamptz;

-- 4) RPC: marcar invoice como falha/expirada — libera mesa para nova tentativa
CREATE OR REPLACE FUNCTION public.restaurant_mark_table_invoice_failed(
  _invoice_id uuid,
  _reason text,
  _new_status text DEFAULT 'failed'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.restaurant_table_invoices;
BEGIN
  IF _new_status NOT IN ('failed','expired','cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;
  SELECT * INTO v_inv FROM public.restaurant_table_invoices
    WHERE id = _invoice_id FOR UPDATE;
  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_inv.status = 'paid' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_paid');
  END IF;
  UPDATE public.restaurant_table_invoices
     SET status = _new_status,
         last_error = COALESCE(_reason, last_error),
         failed_at = now()
   WHERE id = _invoice_id;
  RETURN jsonb_build_object('ok', true, 'session_id', v_inv.session_id, 'status', _new_status);
END; $$;

-- 5) RPC: força nova cobrança (cancela a anterior se existir)
CREATE OR REPLACE FUNCTION public.restaurant_force_new_table_invoice(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_total_cents int;
  v_invoice public.restaurant_table_invoices;
  v_prev_attempt int := 0;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id AND status = 'aberta';
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_open'); END IF;

  v_total_cents := public._restaurant_session_total_cents(v_session.id);
  IF v_total_cents <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'empty_bill'); END IF;

  -- pega último attempt e cancela qualquer aberta
  SELECT COALESCE(MAX(attempt_number), 0) INTO v_prev_attempt
    FROM public.restaurant_table_invoices WHERE session_id = v_session.id;

  UPDATE public.restaurant_table_invoices
     SET status = 'cancelled', failed_at = now(),
         last_error = COALESCE(last_error, 'replaced_by_user')
   WHERE session_id = v_session.id AND status = 'open';

  INSERT INTO public.restaurant_table_invoices(
    session_id, company_id, amount_cents, order_nsu,
    attempt_number, expires_at
  ) VALUES (
    v_session.id, v_session.company_id, v_total_cents,
    'table-' || replace(gen_random_uuid()::text, '-', ''),
    v_prev_attempt + 1,
    now() + interval '15 minutes'
  ) RETURNING * INTO v_invoice;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_invoice.id,
    'order_nsu', v_invoice.order_nsu,
    'amount_cents', v_invoice.amount_cents,
    'status', v_invoice.status,
    'attempt_number', v_invoice.attempt_number,
    'expires_at', v_invoice.expires_at,
    'pix_url', v_invoice.pix_url,
    'pix_copy_paste', v_invoice.pix_copy_paste
  );
END; $$;

-- 6) Atualiza create: passa a respeitar expiração + grava expires_at
CREATE OR REPLACE FUNCTION public.restaurant_create_table_invoice(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_total_cents int;
  v_invoice public.restaurant_table_invoices;
  v_prev_attempt int := 0;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id AND status = 'aberta';
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_open'); END IF;

  v_total_cents := public._restaurant_session_total_cents(v_session.id);
  IF v_total_cents <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'empty_bill'); END IF;

  -- Expira invoices vencidas
  UPDATE public.restaurant_table_invoices
     SET status = 'expired', failed_at = now(),
         last_error = COALESCE(last_error, 'pix_expired')
   WHERE session_id = v_session.id
     AND status = 'open'
     AND expires_at IS NOT NULL
     AND expires_at < now();

  -- Pega a última aberta válida
  SELECT * INTO v_invoice FROM public.restaurant_table_invoices
    WHERE session_id = v_session.id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;

  SELECT COALESCE(MAX(attempt_number), 0) INTO v_prev_attempt
    FROM public.restaurant_table_invoices WHERE session_id = v_session.id;

  IF v_invoice IS NULL OR v_invoice.amount_cents <> v_total_cents THEN
    IF v_invoice IS NOT NULL THEN
      UPDATE public.restaurant_table_invoices
        SET status = 'cancelled', failed_at = now(),
            last_error = COALESCE(last_error, 'amount_changed')
       WHERE id = v_invoice.id;
    END IF;
    INSERT INTO public.restaurant_table_invoices(
      session_id, company_id, amount_cents, order_nsu,
      attempt_number, expires_at
    ) VALUES (
      v_session.id, v_session.company_id, v_total_cents,
      'table-' || replace(gen_random_uuid()::text, '-', ''),
      v_prev_attempt + 1,
      now() + interval '15 minutes'
    ) RETURNING * INTO v_invoice;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_invoice.id,
    'order_nsu', v_invoice.order_nsu,
    'amount_cents', v_invoice.amount_cents,
    'status', v_invoice.status,
    'attempt_number', v_invoice.attempt_number,
    'expires_at', v_invoice.expires_at,
    'pix_url', v_invoice.pix_url,
    'pix_copy_paste', v_invoice.pix_copy_paste
  );
END; $$;

-- 7) RPC: lista histórico de invoices da sessão (público via token)
CREATE OR REPLACE FUNCTION public.restaurant_list_table_invoices(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_rows jsonb;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id;
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', true, 'invoices', '[]'::jsonb); END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t->>'created_at') DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      jsonb_build_object(
        'id', id,
        'amount_cents', amount_cents,
        'status', status,
        'attempt_number', attempt_number,
        'expires_at', expires_at,
        'last_error', last_error,
        'created_at', created_at,
        'paid_at', paid_at,
        'failed_at', failed_at
      ) AS r
    FROM public.restaurant_table_invoices
    WHERE session_id = v_session.id
  ) AS s, jsonb_array_elements(jsonb_build_array(s.r)) AS t;

  RETURN jsonb_build_object('ok', true, 'invoices', v_rows);
END; $$;

-- Versão mais simples (a anterior tem agregação complicada — simplifica)
CREATE OR REPLACE FUNCTION public.restaurant_list_table_invoices(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_rows jsonb;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id;
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', true, 'invoices', '[]'::jsonb); END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'amount_cents', amount_cents,
      'status', status,
      'attempt_number', attempt_number,
      'expires_at', expires_at,
      'last_error', last_error,
      'created_at', created_at,
      'paid_at', paid_at,
      'failed_at', failed_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_rows
  FROM public.restaurant_table_invoices
  WHERE session_id = v_session.id;

  RETURN jsonb_build_object('ok', true, 'invoices', v_rows);
END; $$;

-- 8) RPC: registra reprocessamento de evento (idempotente)
CREATE OR REPLACE FUNCTION public.webhook_log_register_replay(
  _id uuid,
  _reason text,
  _user uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user
      AND role::text IN ('master','manager','admin','support')
  ) INTO v_role;
  IF NOT v_role THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;

  UPDATE public.webhook_event_log
     SET replay_count = COALESCE(replay_count, 0) + 1,
         replay_reason = _reason,
         replayed_by = _user,
         replayed_at = now(),
         status = 'replayed'
   WHERE id = _id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.restaurant_mark_table_invoice_failed(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.restaurant_force_new_table_invoice(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restaurant_list_table_invoices(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.webhook_log_register_replay(uuid, text, uuid) TO authenticated, service_role;
