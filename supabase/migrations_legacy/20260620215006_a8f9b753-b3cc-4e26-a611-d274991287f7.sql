
-- =========================================================================
-- MOTOR DE RECEBIMENTO E REPASSE (REVENUE SHARE) — Fase 1: Fundação
-- =========================================================================

-- 1) core_monetization_models -----------------------------------------------
CREATE TABLE public.core_monetization_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model TEXT NOT NULL CHECK (model IN ('saas','revshare','hybrid')),
  monthly_fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (monthly_fee_cents >= 0),
  setup_fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (setup_fee_cents >= 0),
  min_payout_cents BIGINT NOT NULL DEFAULT 0 CHECK (min_payout_cents >= 0),
  payout_frequency TEXT NOT NULL DEFAULT 'instant'
    CHECK (payout_frequency IN ('instant','daily','weekly','biweekly','monthly')),
  covered_events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  signature_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, version)
);
CREATE INDEX core_monetization_models_company_active_idx
  ON public.core_monetization_models(company_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_monetization_models TO authenticated;
GRANT ALL ON public.core_monetization_models TO service_role;
ALTER TABLE public.core_monetization_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant reads own monetization model"
  ON public.core_monetization_models FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "staff manages monetization models"
  ON public.core_monetization_models FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 2) core_revshare_rates ----------------------------------------------------
CREATE TABLE public.core_revshare_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.core_monetization_models(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('sale','rent','recurring','service','subscription','event','product')),
  percent_bps INTEGER NOT NULL CHECK (percent_bps >= 0 AND percent_bps <= 10000),
  min_bps INTEGER CHECK (min_bps IS NULL OR (min_bps >= 0 AND min_bps <= 10000)),
  max_bps INTEGER CHECK (max_bps IS NULL OR (max_bps >= 0 AND max_bps <= 10000)),
  provider_account_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (model_id, event_type)
);
CREATE INDEX core_revshare_rates_company_idx
  ON public.core_revshare_rates(company_id, event_type) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_revshare_rates TO authenticated;
GRANT ALL ON public.core_revshare_rates TO service_role;
ALTER TABLE public.core_revshare_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant reads own revshare rates"
  ON public.core_revshare_rates FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "staff manages revshare rates"
  ON public.core_revshare_rates FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 3) core_payout_events -----------------------------------------------------
CREATE TABLE public.core_payout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.core_monetization_models(id) ON DELETE SET NULL,
  rate_id UUID REFERENCES public.core_revshare_rates(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('sale','rent','recurring','service','subscription','event','product')),
  gross_cents BIGINT NOT NULL CHECK (gross_cents >= 0),
  fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  net_cents BIGINT NOT NULL DEFAULT 0,
  percent_bps_applied INTEGER NOT NULL DEFAULT 0,
  rule_version INTEGER NOT NULL DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'mercadopago'
    CHECK (provider IN ('mercadopago','asaas','stripe','manual')),
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','refunded','chargeback','cancelled','failed')),
  reference_table TEXT,
  reference_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX core_payout_events_company_occurred_idx
  ON public.core_payout_events(company_id, occurred_at DESC);
CREATE INDEX core_payout_events_status_idx
  ON public.core_payout_events(status, occurred_at DESC);
CREATE INDEX core_payout_events_provider_payment_idx
  ON public.core_payout_events(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

GRANT SELECT ON public.core_payout_events TO authenticated;
GRANT ALL ON public.core_payout_events TO service_role;
ALTER TABLE public.core_payout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant reads own payout events"
  ON public.core_payout_events FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

-- 4) core_payout_ledger -----------------------------------------------------
CREATE TABLE public.core_payout_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_cents BIGINT NOT NULL DEFAULT 0,
  fee_cents BIGINT NOT NULL DEFAULT 0,
  net_cents BIGINT NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','paid','failed','cancelled')),
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_payout_id TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX core_payout_ledger_company_period_idx
  ON public.core_payout_ledger(company_id, period_end DESC);
CREATE INDEX core_payout_ledger_status_idx
  ON public.core_payout_ledger(status, period_end DESC);

GRANT SELECT ON public.core_payout_ledger TO authenticated;
GRANT ALL ON public.core_payout_ledger TO service_role;
ALTER TABLE public.core_payout_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant reads own payout ledger"
  ON public.core_payout_ledger FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

-- 5) Triggers ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.core_monetization_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_core_monetization_models_touch
  BEFORE UPDATE ON public.core_monetization_models
  FOR EACH ROW EXECUTE FUNCTION public.core_monetization_touch();

CREATE TRIGGER trg_core_revshare_rates_touch
  BEFORE UPDATE ON public.core_revshare_rates
  FOR EACH ROW EXECUTE FUNCTION public.core_monetization_touch();

CREATE TRIGGER trg_core_payout_events_touch
  BEFORE UPDATE ON public.core_payout_events
  FOR EACH ROW EXECUTE FUNCTION public.core_monetization_touch();

CREATE TRIGGER trg_core_payout_ledger_touch
  BEFORE UPDATE ON public.core_payout_ledger
  FOR EACH ROW EXECUTE FUNCTION public.core_monetization_touch();

-- Mantém net_cents coerente com gross - fee em core_payout_events
CREATE OR REPLACE FUNCTION public.core_payout_events_compute_net()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.net_cents = GREATEST(NEW.gross_cents - NEW.fee_cents, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_core_payout_events_compute_net
  BEFORE INSERT OR UPDATE OF gross_cents, fee_cents ON public.core_payout_events
  FOR EACH ROW EXECUTE FUNCTION public.core_payout_events_compute_net();

-- 6) View agregada para dashboards -----------------------------------------
CREATE OR REPLACE VIEW public.core_monetization_dashboard
WITH (security_invoker = true)
AS
SELECT
  e.company_id,
  date_trunc('month', e.occurred_at) AS period_month,
  e.event_type,
  COUNT(*) FILTER (WHERE e.status = 'approved') AS approved_count,
  COALESCE(SUM(e.gross_cents) FILTER (WHERE e.status = 'approved'), 0) AS gross_cents,
  COALESCE(SUM(e.fee_cents) FILTER (WHERE e.status = 'approved'), 0) AS fee_cents,
  COALESCE(SUM(e.net_cents) FILTER (WHERE e.status = 'approved'), 0) AS net_cents,
  COALESCE(SUM(e.gross_cents) FILTER (WHERE e.status IN ('refunded','chargeback')), 0) AS reversed_cents
FROM public.core_payout_events e
GROUP BY e.company_id, date_trunc('month', e.occurred_at), e.event_type;

GRANT SELECT ON public.core_monetization_dashboard TO authenticated;
GRANT SELECT ON public.core_monetization_dashboard TO service_role;

-- 7) Seed de modelos para clientes-chave conhecidos -------------------------
-- Garrido = SaaS puro (Plano Full R$ 1.621/mês), demais começam como SaaS
-- até o assistente de implantação coletar os percentuais reais.
INSERT INTO public.core_monetization_models
  (company_id, model, monthly_fee_cents, payout_frequency, covered_events, is_active, notes)
SELECT
  c.id,
  'saas',
  CASE
    WHEN lower(c.name) LIKE '%garrido%' THEN 162100
    ELSE 0
  END,
  'instant',
  ARRAY[]::TEXT[],
  true,
  'Bootstrap inicial — defina percentuais via assistente de implantação se for migrar para Revenue Share.'
FROM public.companies c
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.core_monetization_models m WHERE m.company_id = c.id
  );
