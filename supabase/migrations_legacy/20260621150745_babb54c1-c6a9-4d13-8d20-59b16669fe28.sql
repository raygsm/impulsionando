
-- ============================================================================
-- FASE 5 — NOTA FISCAL AUTOMÁTICA (Receita de Intermediação)
-- ============================================================================

-- 1) Configuração do EMISSOR (Impulsionando) --------------------------------
CREATE TABLE IF NOT EXISTS public.core_fiscal_issuer_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  legal_name text NOT NULL,
  trade_name text,
  cnpj text NOT NULL,
  ie text,
  im text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  service_code text NOT NULL,        -- código LC 116/03 (ex: 1.07, 17.06)
  service_description text NOT NULL DEFAULT 'Taxa de Intermediação Digital — Plataforma Impulsionando',
  cnae text,
  tax_regime text NOT NULL DEFAULT 'simples_nacional'
    CHECK (tax_regime IN ('simples_nacional','lucro_presumido','lucro_real','mei')),
  iss_rate numeric(6,4) NOT NULL DEFAULT 0.0500,
  iss_withheld_default boolean NOT NULL DEFAULT false,
  pis_rate numeric(6,4) NOT NULL DEFAULT 0.0000,
  cofins_rate numeric(6,4) NOT NULL DEFAULT 0.0000,
  ir_rate numeric(6,4) NOT NULL DEFAULT 0.0000,
  csll_rate numeric(6,4) NOT NULL DEFAULT 0.0000,
  provider text NOT NULL DEFAULT 'focus_nfe'
    CHECK (provider IN ('focus_nfe','enotas','migrate','nfse_io','manual','custom')),
  environment text NOT NULL DEFAULT 'homologation'
    CHECK (environment IN ('homologation','production')),
  rps_serie text NOT NULL DEFAULT '1',
  next_rps_number bigint NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.core_fiscal_issuer_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.core_fiscal_issuer_config TO authenticated;
GRANT ALL ON public.core_fiscal_issuer_config TO service_role;

ALTER TABLE public.core_fiscal_issuer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal issuer read authenticated"
  ON public.core_fiscal_issuer_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "fiscal issuer admin manage"
  ON public.core_fiscal_issuer_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) NF emitidas --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.core_fiscal_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES public.core_fiscal_issuer_config(id),
  -- Tenant beneficiário do serviço de intermediação (tomador da NF)
  beneficiary_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  beneficiary_legal_name text NOT NULL,
  beneficiary_cnpj text,
  beneficiary_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Vínculo com o cálculo de receita que originou esta NF
  revenue_calculation_id uuid REFERENCES public.core_revenue_calculations(id) ON DELETE SET NULL,
  reference_kind text,           -- ex: 'mp_order', 'mpago_payment'
  reference_id text,
  -- Valores (apenas a fatia de intermediação)
  service_amount numeric(14,2) NOT NULL CHECK (service_amount >= 0),
  iss_amount    numeric(14,2) NOT NULL DEFAULT 0,
  pis_amount    numeric(14,2) NOT NULL DEFAULT 0,
  cofins_amount numeric(14,2) NOT NULL DEFAULT 0,
  ir_amount     numeric(14,2) NOT NULL DEFAULT 0,
  csll_amount   numeric(14,2) NOT NULL DEFAULT 0,
  net_amount    numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  -- Metadados fiscais
  service_code text NOT NULL,
  service_description text NOT NULL,
  iss_withheld boolean NOT NULL DEFAULT false,
  rps_serie text NOT NULL,
  rps_number bigint NOT NULL,
  nf_number text,
  nf_verification_code text,
  nf_url text,
  nf_xml_url text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','issued','rejected','cancelled','replaced','failed')),
  status_message text,
  issued_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  replaced_by_invoice_id uuid REFERENCES public.core_fiscal_invoices(id) ON DELETE SET NULL,
  provider text NOT NULL,
  environment text NOT NULL,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_count int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rps_serie, rps_number),
  UNIQUE (provider, nf_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_fiscal_invoices TO authenticated;
GRANT ALL ON public.core_fiscal_invoices TO service_role;

ALTER TABLE public.core_fiscal_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal invoices read authenticated"
  ON public.core_fiscal_invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "fiscal invoices admin manage"
  ON public.core_fiscal_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_fiscal_invoices_status
  ON public.core_fiscal_invoices(status, created_at);
CREATE INDEX IF NOT EXISTS idx_core_fiscal_invoices_beneficiary
  ON public.core_fiscal_invoices(beneficiary_company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_core_fiscal_invoices_calc
  ON public.core_fiscal_invoices(revenue_calculation_id);

-- 3) Eventos da NF ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.core_fiscal_invoice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.core_fiscal_invoices(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('requested','sent_to_provider','provider_accepted','provider_rejected',
                          'issued','cancelled','replaced','retry_scheduled','failed','webhook_received')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.core_fiscal_invoice_events TO authenticated;
GRANT ALL ON public.core_fiscal_invoice_events TO service_role;

ALTER TABLE public.core_fiscal_invoice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal events read authenticated"
  ON public.core_fiscal_invoice_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "fiscal events admin manage"
  ON public.core_fiscal_invoice_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_fiscal_invoice_events_invoice
  ON public.core_fiscal_invoice_events(invoice_id, created_at);

-- 4) Enqueue: cria NF a partir de um cálculo de receita ----------------------
CREATE OR REPLACE FUNCTION public.enqueue_fiscal_invoice(_calc_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _calc       public.core_revenue_calculations;
  _issuer     public.core_fiscal_issuer_config;
  _beneficiary public.companies;
  _service_amount numeric(14,2);
  _iss numeric(14,2);
  _pis numeric(14,2);
  _cofins numeric(14,2);
  _ir numeric(14,2);
  _csll numeric(14,2);
  _net numeric(14,2);
  _rps_n bigint;
  _existing uuid;
  _invoice_id uuid;
BEGIN
  SELECT * INTO _calc FROM public.core_revenue_calculations WHERE id = _calc_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'calc_not_found: %', _calc_id;
  END IF;

  -- idempotência por cálculo
  SELECT id INTO _existing FROM public.core_fiscal_invoices
   WHERE revenue_calculation_id = _calc_id
     AND status NOT IN ('cancelled','rejected','replaced','failed')
   LIMIT 1;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  -- emissor ativo (apenas 1 esperado)
  SELECT * INTO _issuer FROM public.core_fiscal_issuer_config
   WHERE is_active LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'fiscal_issuer_not_configured';
  END IF;

  -- beneficiário = tenant da venda
  SELECT * INTO _beneficiary FROM public.companies WHERE id = _calc.company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'beneficiary_company_not_found: %', _calc.company_id;
  END IF;

  -- NF é APENAS sobre a fatia da Impulsionando
  _service_amount := COALESCE(_calc.impulsionando_fee_amount, 0);
  IF _service_amount <= 0 THEN
    -- nada a faturar
    RETURN NULL;
  END IF;

  _iss    := ROUND(_service_amount * _issuer.iss_rate,    2);
  _pis    := ROUND(_service_amount * _issuer.pis_rate,    2);
  _cofins := ROUND(_service_amount * _issuer.cofins_rate, 2);
  _ir     := ROUND(_service_amount * _issuer.ir_rate,     2);
  _csll   := ROUND(_service_amount * _issuer.csll_rate,   2);
  _net    := _service_amount
             - (CASE WHEN _issuer.iss_withheld_default THEN _iss ELSE 0 END)
             - _pis - _cofins - _ir - _csll;

  -- reserva próximo RPS atomicamente
  UPDATE public.core_fiscal_issuer_config
     SET next_rps_number = next_rps_number + 1,
         updated_at = now()
   WHERE id = _issuer.id
   RETURNING next_rps_number - 1 INTO _rps_n;

  INSERT INTO public.core_fiscal_invoices (
    issuer_id, beneficiary_company_id, beneficiary_legal_name, beneficiary_cnpj,
    beneficiary_address, revenue_calculation_id, reference_kind, reference_id,
    service_amount, iss_amount, pis_amount, cofins_amount, ir_amount, csll_amount, net_amount,
    service_code, service_description, iss_withheld,
    rps_serie, rps_number, status, provider, environment
  ) VALUES (
    _issuer.id, _beneficiary.id,
    COALESCE(_beneficiary.legal_name, _beneficiary.name),
    _beneficiary.document,
    jsonb_build_object(
      'line', _beneficiary.address_line,
      'city', _beneficiary.address_city,
      'state', _beneficiary.address_state,
      'zip',  _beneficiary.address_zip,
      'neighborhood', _beneficiary.address_neighborhood
    ),
    _calc.id, _calc.source_kind, _calc.source_id::text,
    _service_amount, _iss, _pis, _cofins, _ir, _csll, _net,
    _issuer.service_code, _issuer.service_description, _issuer.iss_withheld_default,
    _issuer.rps_serie, _rps_n, 'queued', _issuer.provider, _issuer.environment
  ) RETURNING id INTO _invoice_id;

  INSERT INTO public.core_fiscal_invoice_events (invoice_id, event_type, payload, message)
  VALUES (_invoice_id, 'requested',
          jsonb_build_object('calc_id', _calc.id, 'rps', _issuer.rps_serie || '/' || _rps_n),
          'NF enfileirada a partir do cálculo de receita');

  INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
  VALUES ('info', 'core.fiscal', 'fiscal_invoice.queued',
          jsonb_build_object('invoice_id', _invoice_id, 'calc_id', _calc.id,
                             'service_amount', _service_amount),
          _beneficiary.id, now());

  RETURN _invoice_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_fiscal_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_fiscal_invoice(uuid) TO authenticated, service_role;

-- 5) Finalização explícita de cálculo (helper) -------------------------------
CREATE OR REPLACE FUNCTION public.finalize_revenue_calculation(_calc_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _invoice_id uuid;
BEGIN
  UPDATE public.core_revenue_calculations
     SET status = 'finalized', updated_at = now()
   WHERE id = _calc_id AND status <> 'finalized';
  -- trigger abaixo cuida do enqueue; mas chamamos direto para devolver o id
  _invoice_id := public.enqueue_fiscal_invoice(_calc_id);
  RETURN _invoice_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_revenue_calculation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_revenue_calculation(uuid) TO authenticated, service_role;

-- 6) Trigger: ao virar 'finalized', enfileira NF -----------------------------
CREATE OR REPLACE FUNCTION public.trg_revenue_calc_emit_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'finalized'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'finalized')
     AND COALESCE(NEW.impulsionando_fee_amount, 0) > 0 THEN
    BEGIN
      PERFORM public.enqueue_fiscal_invoice(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
      VALUES ('error', 'core.fiscal', 'fiscal_invoice.enqueue_failed',
              jsonb_build_object('calc_id', NEW.id, 'error', SQLERRM),
              NEW.company_id, now());
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revenue_calc_emit_invoice ON public.core_revenue_calculations;
CREATE TRIGGER trg_revenue_calc_emit_invoice
  AFTER INSERT OR UPDATE OF status ON public.core_revenue_calculations
  FOR EACH ROW EXECUTE FUNCTION public.trg_revenue_calc_emit_invoice();

-- updated_at
DROP TRIGGER IF EXISTS trg_core_fiscal_issuer_updated_at ON public.core_fiscal_issuer_config;
CREATE TRIGGER trg_core_fiscal_issuer_updated_at
  BEFORE UPDATE ON public.core_fiscal_issuer_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_core_fiscal_invoices_updated_at ON public.core_fiscal_invoices;
CREATE TRIGGER trg_core_fiscal_invoices_updated_at
  BEFORE UPDATE ON public.core_fiscal_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) View de status ----------------------------------------------------------
CREATE OR REPLACE VIEW public.v_fiscal_invoices_summary AS
SELECT
  i.id, i.status, i.beneficiary_company_id,
  c.name AS beneficiary_name, c.document AS beneficiary_cnpj,
  i.service_amount, i.iss_amount, i.net_amount,
  i.rps_serie || '/' || i.rps_number AS rps,
  i.nf_number, i.nf_url, i.provider, i.environment,
  i.created_at, i.issued_at, i.cancelled_at
FROM public.core_fiscal_invoices i
LEFT JOIN public.companies c ON c.id = i.beneficiary_company_id;

ALTER VIEW public.v_fiscal_invoices_summary SET (security_invoker = true);
GRANT SELECT ON public.v_fiscal_invoices_summary TO authenticated;

-- 8) Seed: emissor Impulsionando em homologação ------------------------------
INSERT INTO public.core_fiscal_issuer_config
  (legal_name, trade_name, cnpj, service_code, service_description,
   tax_regime, iss_rate, provider, environment, rps_serie)
SELECT
  'Impulsionando Tecnologia LTDA', 'Impulsionando',
  '00000000000000', '1.07',
  'Taxa de Intermediação Digital — Plataforma Impulsionando',
  'simples_nacional', 0.0500, 'focus_nfe', 'homologation', '1'
WHERE NOT EXISTS (SELECT 1 FROM public.core_fiscal_issuer_config);
