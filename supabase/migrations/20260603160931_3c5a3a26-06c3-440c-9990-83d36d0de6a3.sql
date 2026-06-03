
-- =========================================================
-- Sales: daily cash session closing
-- =========================================================

CREATE TABLE public.sales_cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.company_units(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES public.fin_accounts(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  closing_amount NUMERIC(14,2),
  expected_total NUMERIC(14,2),
  difference_total NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sales_cash_sessions_one_open_per_user_account
  ON public.sales_cash_sessions(opened_by, account_id) WHERE status = 'open';
CREATE INDEX sales_cash_sessions_company_idx ON public.sales_cash_sessions(company_id, opened_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_cash_sessions TO authenticated;
GRANT ALL ON public.sales_cash_sessions TO service_role;
ALTER TABLE public.sales_cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_sessions_select" ON public.sales_cash_sessions FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'sales.cashsession.read'));
CREATE POLICY "cash_sessions_insert" ON public.sales_cash_sessions FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'sales.cashsession.write'));
CREATE POLICY "cash_sessions_update" ON public.sales_cash_sessions FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'sales.cashsession.write'))
WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'sales.cashsession.write'));
CREATE POLICY "cash_sessions_delete" ON public.sales_cash_sessions FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER sales_cash_sessions_updated_at BEFORE UPDATE ON public.sales_cash_sessions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.sales_cash_session_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sales_cash_sessions(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.fin_payment_methods(id) ON DELETE RESTRICT,
  expected_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  counted_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  difference NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, payment_method_id)
);
CREATE INDEX sales_cash_session_counts_session_idx ON public.sales_cash_session_counts(session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_cash_session_counts TO authenticated;
GRANT ALL ON public.sales_cash_session_counts TO service_role;
ALTER TABLE public.sales_cash_session_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_counts_select" ON public.sales_cash_session_counts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.sales_cash_sessions s WHERE s.id = session_id
  AND (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), s.company_id, 'sales.cashsession.read'))));
CREATE POLICY "cash_counts_write" ON public.sales_cash_session_counts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.sales_cash_sessions s WHERE s.id = session_id
  AND (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), s.company_id, 'sales.cashsession.write'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.sales_cash_sessions s WHERE s.id = session_id
  AND (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), s.company_id, 'sales.cashsession.write'))));

CREATE TRIGGER sales_cash_counts_updated_at BEFORE UPDATE ON public.sales_cash_session_counts
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------------------------------------------------------
-- RPC: close a cash session — computes expected vs counted
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sales_cash_session_close(
  _session_id UUID,
  _counts JSONB,           -- [{ "payment_method_id": "...", "counted_amount": 123.45 }, ...]
  _notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s RECORD;
  v_expected_total NUMERIC(14,2) := 0;
  v_counted_total  NUMERIC(14,2) := 0;
  pm RECORD;
  v_expected NUMERIC(14,2);
  v_counted  NUMERIC(14,2);
BEGIN
  SELECT * INTO s FROM public.sales_cash_sessions WHERE id = _session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão de caixa não encontrada'; END IF;
  IF s.status = 'closed' THEN RAISE EXCEPTION 'Sessão já está fechada'; END IF;
  IF NOT (public.is_super_admin(auth.uid())
     OR public.user_has_permission(auth.uid(), s.company_id, 'sales.cashsession.close')) THEN
    RAISE EXCEPTION 'Sem permissão para fechar caixa';
  END IF;

  -- Limpa contagens anteriores
  DELETE FROM public.sales_cash_session_counts WHERE session_id = _session_id;

  -- Para cada método de pagamento da empresa, calcula esperado a partir das vendas confirmadas
  -- realizadas pelo operador, com a conta financeira da sessão, no intervalo aberto..agora
  FOR pm IN SELECT id FROM public.fin_payment_methods
            WHERE company_id = s.company_id AND is_active = true LOOP
    SELECT COALESCE(SUM(sp.amount),0) INTO v_expected
    FROM public.sales_payments sp
    JOIN public.sales_orders so ON so.id = sp.order_id
    WHERE so.company_id = s.company_id
      AND so.status = 'confirmed'
      AND so.created_by = s.opened_by
      AND sp.account_id = s.account_id
      AND sp.payment_method_id = pm.id
      AND so.confirmed_at >= s.opened_at
      AND so.confirmed_at <= now();

    v_counted := COALESCE((
      SELECT (c->>'counted_amount')::numeric
      FROM jsonb_array_elements(COALESCE(_counts,'[]'::jsonb)) c
      WHERE (c->>'payment_method_id')::uuid = pm.id
      LIMIT 1
    ),0);

    INSERT INTO public.sales_cash_session_counts
      (session_id, payment_method_id, expected_amount, counted_amount, difference)
    VALUES (_session_id, pm.id, v_expected, v_counted, v_counted - v_expected);

    v_expected_total := v_expected_total + v_expected;
    v_counted_total  := v_counted_total  + v_counted;
  END LOOP;

  UPDATE public.sales_cash_sessions SET
    status = 'closed',
    closed_by = auth.uid(),
    closed_at = now(),
    closing_amount = v_counted_total,
    expected_total = v_expected_total,
    difference_total = v_counted_total - v_expected_total,
    notes = COALESCE(_notes, notes)
  WHERE id = _session_id;

  RETURN _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sales_cash_session_close(UUID, JSONB, TEXT) TO authenticated;

-- ---------------------------------------------------------
-- Permissions seed + role mapping
-- ---------------------------------------------------------
INSERT INTO public.permissions (code, description, module) VALUES
  ('sales.cashsession.read',  'Ver sessões de caixa',  'sales'),
  ('sales.cashsession.write', 'Abrir/editar sessão de caixa', 'sales'),
  ('sales.cashsession.close', 'Fechar caixa', 'sales')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profiles p
CROSS JOIN public.permissions perm
WHERE perm.code IN ('sales.cashsession.read','sales.cashsession.write','sales.cashsession.close')
  AND (
    p.is_master_profile = true
    OR p.slug IN ('gestor','admin','recepcao','financeiro')
  )
ON CONFLICT DO NOTHING;
