
-- 1) Sync plans com salário mínimo vigente
CREATE OR REPLACE FUNCTION public.sync_plan_prices_from_minimum_wage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wage numeric;
  v_essencial numeric;
  v_completo numeric;
  v_full numeric;
BEGIN
  SELECT (value->>'amount')::numeric INTO v_wage
  FROM core_settings WHERE key = 'minimum_wage';

  IF v_wage IS NULL OR v_wage <= 0 THEN
    RAISE EXCEPTION 'minimum_wage not configured in core_settings';
  END IF;

  v_essencial := round(v_wage * 0.5, 2);
  v_completo  := round(v_wage * 1.0, 2);
  v_full      := round(v_wage * 2.0, 2);

  UPDATE billing_plans SET recurring_amount = v_essencial, setup_fee = v_essencial, updated_at = now()
    WHERE code = 'essencial-mensal';
  UPDATE billing_plans SET recurring_amount = v_completo,  setup_fee = v_completo,  updated_at = now()
    WHERE code = 'completo-mensal';
  UPDATE billing_plans SET recurring_amount = v_full,      setup_fee = v_full,      updated_at = now()
    WHERE code = 'full';

  RETURN jsonb_build_object(
    'wage', v_wage,
    'essencial', v_essencial,
    'completo',  v_completo,
    'full',      v_full,
    'synced_at', now()
  );
END;
$$;

-- 2) Cortesia por N dias em uma empresa
CREATE OR REPLACE FUNCTION public.set_company_courtesy_plan(
  _company_id uuid,
  _plan_code text,
  _days int DEFAULT 30,
  _notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_contract_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM billing_plans WHERE code = _plan_code;
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'plan % not found', _plan_code;
  END IF;

  INSERT INTO billing_contracts (
    company_id, plan_id, start_date, due_day, next_due_date,
    recurring_amount, status, notes, trial_started_at, trial_ends_at, trial_sku, trial_source
  ) VALUES (
    _company_id, v_plan_id, current_date, 5, (current_date + _days),
    0, 'courtesy', coalesce(_notes, format('Cortesia %s dias', _days)),
    now(), now() + make_interval(days => _days), _plan_code, 'admin_courtesy'
  )
  ON CONFLICT (company_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'courtesy',
    trial_started_at = EXCLUDED.trial_started_at,
    trial_ends_at = EXCLUDED.trial_ends_at,
    trial_sku = EXCLUDED.trial_sku,
    trial_source = EXCLUDED.trial_source,
    recurring_amount = 0,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING id INTO v_contract_id;

  PERFORM log_admin_action(
    'billing.courtesy_activated', 'billing_contracts', v_contract_id::text,
    NULL, jsonb_build_object('plan_code', _plan_code, 'days', _days),
    jsonb_build_object('company_id', _company_id, 'notes', _notes),
    _company_id, NULL, NULL, 'notice', 'billing'
  );

  RETURN v_contract_id;
END;
$$;

-- 3) Ajusta preços com salário mínimo atual
SELECT public.sync_plan_prices_from_minimum_wage();

-- 4) Cadastra Colors Saúde
INSERT INTO public.companies (
  name, legal_name, trade_name, is_master, is_active, status,
  niche_id, segment, subdomain, website, support_email, environment
) VALUES (
  'Colors Saúde',
  'Grupo Colors Ltda.',
  'Colors Saúde',
  false, true, 'active',
  'a6696010-9178-4082-9a17-32e4378fc0b8',
  'Saúde e Suplementação',
  'colors',
  'https://colors.impulsionando.com.br',
  'sac@grupocolors.com.br',
  'real'
)
ON CONFLICT DO NOTHING;

-- 5) Vincula Mozart como super admin da Colors
INSERT INTO public.user_profiles (user_id, company_id, profile_id, display_name, email, is_active)
SELECT
  '73285c6d-7c8a-421d-b94c-7f24a59f54a0',
  c.id,
  '6fbbb7e6-01ae-447f-bd66-85aeba9f54c4',
  'Mozart Silva Neto',
  'mozartsn@yahoo.com.br',
  true
FROM public.companies c
WHERE c.subdomain = 'colors'
ON CONFLICT DO NOTHING;

-- 6) Ativa cortesia Full por 30 dias na Colors
SELECT public.set_company_courtesy_plan(
  (SELECT id FROM public.companies WHERE subdomain = 'colors'),
  'full',
  30,
  'Cortesia inicial Colors Saúde — plano Full por 30 dias'
);
