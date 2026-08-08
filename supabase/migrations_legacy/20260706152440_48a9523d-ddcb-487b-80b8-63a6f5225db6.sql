
-- 1) Colunas de trial no contrato de cobrança
ALTER TABLE public.billing_contracts
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_sku        TEXT,
  ADD COLUMN IF NOT EXISTS trial_source     TEXT,
  ADD COLUMN IF NOT EXISTS previous_plan_id UUID REFERENCES public.billing_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_billing_contracts_trial_ends
  ON public.billing_contracts (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- 2) Função para expirar trials vencidos (idempotente)
CREATE OR REPLACE FUNCTION public.mp_expire_premium_trials()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired int := 0;
  v_vitrine_off int := 0;
  v_essencial uuid;
  rec RECORD;
BEGIN
  SELECT id INTO v_essencial FROM public.billing_plans WHERE code = 'essencial' LIMIT 1;

  FOR rec IN
    SELECT bc.id AS contract_id, bc.company_id, bc.plan_id, bc.previous_plan_id, bc.trial_sku, bc.trial_source
      FROM public.billing_contracts bc
     WHERE bc.trial_ends_at IS NOT NULL
       AND bc.trial_ends_at <= now()
       AND bc.trial_sku IS NOT NULL
  LOOP
    -- 2.1 Volta ao plano anterior (fallback Essencial)
    UPDATE public.billing_contracts
       SET plan_id            = COALESCE(rec.previous_plan_id, v_essencial, plan_id),
           trial_started_at   = NULL,
           trial_ends_at      = NULL,
           trial_sku          = NULL,
           trial_source       = NULL,
           previous_plan_id   = NULL,
           updated_at         = now()
     WHERE id = rec.contract_id;

    -- 2.2 Desliga Vitrine da empresa
    UPDATE public.companies SET vitrine_enabled = false, updated_at = now()
     WHERE id = rec.company_id AND vitrine_enabled = true;
    GET DIAGNOSTICS v_vitrine_off = ROW_COUNT;

    -- 2.3 Desabilita módulos vitrine em company_modules
    UPDATE public.company_modules cm
       SET is_enabled = false, disabled_at = now()
      FROM public.modules m
     WHERE cm.module_id = m.id
       AND cm.company_id = rec.company_id
       AND m.slug LIKE '%vitrine%'
       AND cm.is_enabled = true;

    -- 2.4 Audit
    INSERT INTO public.audit_logs (company_id, action, entity, entity_id, after)
    VALUES (rec.company_id, 'trial.premium.expired', 'billing_contracts', rec.contract_id,
            jsonb_build_object('sku', rec.trial_sku, 'source', rec.trial_source, 'expired_at', now()));

    v_expired := v_expired + 1;
  END LOOP;

  RETURN jsonb_build_object('expired', v_expired, 'ran_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.mp_expire_premium_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_expire_premium_trials() TO service_role;

-- 3) Health do webhook MP (sem expor segredos)
CREATE OR REPLACE FUNCTION public.mp_get_webhook_health()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'events_24h', (SELECT count(*) FROM public.mp_webhook_log WHERE received_at >= now() - interval '24 hours'),
    'events_7d',  (SELECT count(*) FROM public.mp_webhook_log WHERE received_at >= now() - interval '7 days'),
    'errors_7d',  (SELECT count(*) FROM public.mp_webhook_log WHERE received_at >= now() - interval '7 days' AND error IS NOT NULL),
    'last_event_at', (SELECT max(received_at) FROM public.mp_webhook_log),
    'last_topic',   (SELECT topic FROM public.mp_webhook_log ORDER BY received_at DESC LIMIT 1)
  );
$$;

REVOKE ALL ON FUNCTION public.mp_get_webhook_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_get_webhook_health() TO service_role, authenticated;
