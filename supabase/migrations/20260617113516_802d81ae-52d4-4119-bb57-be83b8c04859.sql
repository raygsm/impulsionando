
-- 1) Log de eventos de webhook (idempotência)
CREATE TABLE IF NOT EXISTS public.webhook_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,                 -- 'close-invoice' | 'infinitepay' | ...
  event_id text NOT NULL,               -- chave única do evento (header ou hash do corpo)
  target_kind text,                     -- 'consumer' | 'erp' | 'table'
  target_id text,
  payload jsonb,
  result jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, event_id)
);
GRANT SELECT ON public.webhook_event_log TO authenticated;
GRANT ALL ON public.webhook_event_log TO service_role;
ALTER TABLE public.webhook_event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem o log de webhooks" ON public.webhook_event_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid()
                   AND role::text IN ('master','manager','support','admin')));

-- 2) Faturas de mesa (PIX gerado no QR)
CREATE TABLE IF NOT EXISTS public.restaurant_table_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.restaurant_table_sessions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  status text NOT NULL DEFAULT 'open',  -- open | paid | cancelled
  order_nsu text NOT NULL UNIQUE,
  pix_url text,
  pix_copy_paste text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.restaurant_table_invoices TO anon, authenticated;
GRANT INSERT, UPDATE ON public.restaurant_table_invoices TO authenticated;
GRANT ALL ON public.restaurant_table_invoices TO service_role;
ALTER TABLE public.restaurant_table_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe da empresa vê as cobranças de mesa" ON public.restaurant_table_invoices
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );
-- leitura anônima por ID/session (cliente do QR) — controlada pela RPC; sem policy ampla anon

-- 3) Dedup de notificações
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS notified_ready_at timestamptz;
ALTER TABLE public.restaurant_table_sessions
  ADD COLUMN IF NOT EXISTS bill_notified_at timestamptz;

-- 4) Helper: total atual da mesa
CREATE OR REPLACE FUNCTION public._restaurant_session_total_cents(_session_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(ROUND(soi.total * 100))::int, 0)
  FROM public.sales_order_items soi
  JOIN public.restaurant_table_sessions s ON s.sales_order_id = soi.order_id
  WHERE s.id = _session_id
    AND COALESCE(soi.kitchen_status, 'pendente') <> 'cancelado'
$$;
REVOKE ALL ON FUNCTION public._restaurant_session_total_cents(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._restaurant_session_total_cents(uuid) TO service_role;

-- 5) RPC pública: cliente cria/recupera cobrança PIX da própria sessão (via token do QR)
CREATE OR REPLACE FUNCTION public.restaurant_create_table_invoice(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_total_cents int;
  v_invoice public.restaurant_table_invoices;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id AND status = 'aberta';
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_open'); END IF;

  v_total_cents := public._restaurant_session_total_cents(v_session.id);
  IF v_total_cents <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'empty_bill'); END IF;

  -- Se já existe uma cobrança aberta, devolve a mesma (idempotência do lado do cliente)
  SELECT * INTO v_invoice FROM public.restaurant_table_invoices
    WHERE session_id = v_session.id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;

  IF v_invoice IS NULL OR v_invoice.amount_cents <> v_total_cents THEN
    -- Se houver cobrança aberta com valor diferente, cancela e cria nova
    IF v_invoice IS NOT NULL THEN
      UPDATE public.restaurant_table_invoices SET status = 'cancelled' WHERE id = v_invoice.id;
    END IF;
    INSERT INTO public.restaurant_table_invoices(session_id, company_id, amount_cents, order_nsu)
    VALUES (v_session.id, v_session.company_id, v_total_cents,
            'table-' || replace(gen_random_uuid()::text, '-', ''))
    RETURNING * INTO v_invoice;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_invoice.id,
    'order_nsu', v_invoice.order_nsu,
    'amount_cents', v_invoice.amount_cents,
    'status', v_invoice.status,
    'pix_url', v_invoice.pix_url,
    'pix_copy_paste', v_invoice.pix_copy_paste
  );
END; $$;
REVOKE ALL ON FUNCTION public.restaurant_create_table_invoice(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restaurant_create_table_invoice(text) TO anon, authenticated;

-- 6) RPC: webhook marca cobrança de mesa como paga (fecha sessão + libera mesa)
CREATE OR REPLACE FUNCTION public.restaurant_mark_table_invoice_paid(_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv public.restaurant_table_invoices;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_inv FROM public.restaurant_table_invoices WHERE id = _invoice_id FOR UPDATE;
  IF v_inv IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_inv.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'already_paid', true, 'session_id', v_inv.session_id);
  END IF;

  UPDATE public.restaurant_table_invoices
    SET status = 'paid', paid_at = v_now
    WHERE id = _invoice_id;

  UPDATE public.restaurant_table_sessions
    SET status = 'paga', closed_at = v_now, updated_at = v_now
    WHERE id = v_inv.session_id;

  UPDATE public.restaurant_tables
    SET current_session_id = NULL, status = 'livre', updated_at = v_now
    WHERE current_session_id = v_inv.session_id;

  RETURN jsonb_build_object('ok', true, 'session_id', v_inv.session_id);
END; $$;
REVOKE ALL ON FUNCTION public.restaurant_mark_table_invoice_paid(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restaurant_mark_table_invoice_paid(uuid) TO service_role;

-- 7) RPC pública para o cliente consultar status da própria cobrança (polling)
CREATE OR REPLACE FUNCTION public.restaurant_get_table_invoice(_token text, _invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_table public.restaurant_tables;
  v_inv public.restaurant_table_invoices;
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_inv FROM public.restaurant_table_invoices WHERE id = _invoice_id;
  IF v_inv IS NULL OR v_inv.session_id <> v_table.current_session_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invoice_not_found');
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_inv.id,
    'status', v_inv.status,
    'amount_cents', v_inv.amount_cents,
    'paid_at', v_inv.paid_at
  );
END; $$;
REVOKE ALL ON FUNCTION public.restaurant_get_table_invoice(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restaurant_get_table_invoice(text, uuid) TO anon, authenticated;
