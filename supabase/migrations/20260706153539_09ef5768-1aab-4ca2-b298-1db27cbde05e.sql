
CREATE OR REPLACE FUNCTION public.mp_expire_premium_trials()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired int := 0;
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
    UPDATE public.billing_contracts
       SET plan_id            = COALESCE(rec.previous_plan_id, v_essencial, plan_id),
           trial_started_at   = NULL,
           trial_ends_at      = NULL,
           trial_sku          = NULL,
           trial_source       = NULL,
           previous_plan_id   = NULL,
           updated_at         = now()
     WHERE id = rec.contract_id;

    UPDATE public.companies SET vitrine_enabled = false, updated_at = now()
     WHERE id = rec.company_id AND vitrine_enabled = true;

    UPDATE public.company_modules cm
       SET is_enabled = false, updated_at = now()
      FROM public.modules m
     WHERE cm.module_id = m.id
       AND cm.company_id = rec.company_id
       AND m.slug LIKE '%vitrine%'
       AND cm.is_enabled = true;

    INSERT INTO public.audit_logs (company_id, action, entity, entity_id, after)
    VALUES (rec.company_id, 'trial.premium.expired', 'billing_contracts', rec.contract_id,
            jsonb_build_object('sku', rec.trial_sku, 'source', rec.trial_source, 'expired_at', now()));

    v_expired := v_expired + 1;
  END LOOP;

  RETURN jsonb_build_object('expired', v_expired, 'ran_at', now());
END;
$$;
