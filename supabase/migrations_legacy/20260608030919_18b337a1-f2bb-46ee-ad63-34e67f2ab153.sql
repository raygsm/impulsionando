-- ============================================================
-- 1) QUOTES — remove UPDATE público; introduz token de aceite
-- ============================================================

DROP POLICY IF EXISTS "Anyone can update draft quote within 24h" ON public.quotes;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_key ON public.quotes(public_token);

-- Nenhuma UPDATE policy para anon/authenticated.
-- Todas as alterações passam pelas server functions usando supabaseAdmin (service_role bypassa RLS).
-- Master staff continua com SELECT/DELETE pela policy existente.

-- ============================================================
-- 2) AFF_PAYOUTS — remove self-insert; cria função com validação de saldo
-- ============================================================

DROP POLICY IF EXISTS aff_payouts_insert_self ON public.aff_payouts;

-- INSERT direto apenas para operadores com aff.payout.write (ou staff Impulsionando)
CREATE POLICY aff_payouts_insert_staff ON public.aff_payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    is_impulsionando_staff(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'aff.payout.write'))
  );

-- Função SECURITY DEFINER que afiliados chamam para solicitar payout
CREATE OR REPLACE FUNCTION public.aff_payout_request(
  _company_id uuid,
  _amount numeric,
  _pix_key text DEFAULT NULL,
  _bank_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _released numeric := 0;
  _paid numeric := 0;
  _pending numeric := 0;
  _available numeric;
  _payout_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '28000';
  END IF;
  IF NOT user_belongs_to_company(_uid, _company_id) THEN
    RAISE EXCEPTION 'Sem vínculo com a empresa' USING ERRCODE = '42501';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Valor inválido' USING ERRCODE = '22023';
  END IF;

  -- Saldo liberado = soma de comissões liberadas do próprio usuário, nessa empresa
  SELECT COALESCE(SUM(amount), 0) INTO _released
  FROM public.aff_commissions
  WHERE company_id = _company_id
    AND recipient_user_id = _uid
    AND released_at IS NOT NULL;

  -- Já pago (vinculado a payouts efetivamente pagos)
  SELECT COALESCE(SUM(p.amount), 0) INTO _paid
  FROM public.aff_payouts p
  WHERE p.company_id = _company_id
    AND p.recipient_user_id = _uid
    AND p.status = 'pago';

  -- Em aberto (solicitado/em análise/aprovado)
  SELECT COALESCE(SUM(p.amount), 0) INTO _pending
  FROM public.aff_payouts p
  WHERE p.company_id = _company_id
    AND p.recipient_user_id = _uid
    AND p.status IN ('solicitado','em_analise','aprovado');

  _available := _released - _paid - _pending;

  IF _amount > _available THEN
    RAISE EXCEPTION 'Valor solicitado (%) excede saldo disponível (%)', _amount, _available
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.aff_payouts(
    company_id, recipient_kind, recipient_user_id,
    amount, pix_key, bank_data, status, requested_at
  )
  VALUES (
    _company_id, 'afiliado', _uid,
    _amount, _pix_key, _bank_data, 'solicitado', now()
  )
  RETURNING id INTO _payout_id;

  RETURN _payout_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aff_payout_request(uuid, numeric, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aff_payout_request(uuid, numeric, text, jsonb) TO authenticated, service_role;

-- ============================================================
-- 3) Trava de regressão — quotes não pode voltar a aceitar UPDATE anon
-- ============================================================

CREATE OR REPLACE FUNCTION public.assert_quotes_no_anon_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname='public' AND tablename='quotes' AND cmd='UPDATE'
    AND 'anon' = ANY(roles);
  IF n > 0 THEN
    RAISE EXCEPTION 'SECURITY REGRESSION: quotes voltou a aceitar UPDATE anônimo (% policies)', n;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.assert_quotes_no_anon_update() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_quotes_no_anon_update() TO authenticated, service_role;

SELECT public.assert_quotes_no_anon_update();