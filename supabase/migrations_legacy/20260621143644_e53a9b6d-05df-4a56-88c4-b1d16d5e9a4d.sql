
-- =====================================================================
-- FASE 1 — MOTOR FINANCEIRO CENTRAL IMPULSIONANDO (v2 — schema real)
-- =====================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE public.payment_method_kind AS ENUM ('pix','credit_card','boleto','debit_card','wallet','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fee_rule_scope AS ENUM ('global','niche','company','product','service','subscription','affiliate','coproducer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_schedule_basis AS ENUM ('business_days','calendar_days');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.revenue_calc_status AS ENUM ('draft','final','recalculated','voided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. core_fee_rules
CREATE TABLE IF NOT EXISTS public.core_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.fee_rule_scope NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  niche_id uuid,
  product_id uuid,
  method public.payment_method_kind,
  percent_bps integer NOT NULL DEFAULT 0,
  fixed_cents bigint NOT NULL DEFAULT 0,
  min_cents bigint NOT NULL DEFAULT 0,
  max_cents bigint,
  priority integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT core_fee_rules_percent_bps_chk CHECK (percent_bps BETWEEN 0 AND 10000)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_fee_rules TO authenticated;
GRANT ALL ON public.core_fee_rules TO service_role;
ALTER TABLE public.core_fee_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_rules_admin_all" ON public.core_fee_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "fee_rules_company_read" ON public.core_fee_rules
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (SELECT ur.company_id FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_core_fee_rules_lookup
  ON public.core_fee_rules (scope, company_id, niche_id, product_id, method, active);

-- 3. core_payout_schedule_rules
CREATE TABLE IF NOT EXISTS public.core_payout_schedule_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.fee_rule_scope NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  niche_id uuid,
  product_id uuid,
  method public.payment_method_kind,
  delay_days integer NOT NULL,
  basis public.payout_schedule_basis NOT NULL DEFAULT 'business_days',
  reserve_bps integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT core_payout_delay_chk CHECK (delay_days >= 0 AND delay_days <= 365)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_payout_schedule_rules TO authenticated;
GRANT ALL ON public.core_payout_schedule_rules TO service_role;
ALTER TABLE public.core_payout_schedule_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_rules_admin_all" ON public.core_payout_schedule_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "payout_rules_company_read" ON public.core_payout_schedule_rules
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (SELECT ur.company_id FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_core_payout_rules_lookup
  ON public.core_payout_schedule_rules (scope, company_id, niche_id, method, active);

-- 4. core_revenue_calculations
CREATE TABLE IF NOT EXISTS public.core_revenue_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status public.revenue_calc_status NOT NULL DEFAULT 'final',
  method public.payment_method_kind NOT NULL,
  gross_cents bigint NOT NULL,
  coupon_cents bigint NOT NULL DEFAULT 0,
  gateway_fee_cents bigint NOT NULL DEFAULT 0,
  impulsionando_fee_cents bigint NOT NULL DEFAULT 0,
  affiliate_commission_cents bigint NOT NULL DEFAULT 0,
  coproducer_commission_cents bigint NOT NULL DEFAULT 0,
  reserve_cents bigint NOT NULL DEFAULT 0,
  net_cents bigint NOT NULL,
  fee_rule_id uuid REFERENCES public.core_fee_rules(id),
  schedule_rule_id uuid REFERENCES public.core_payout_schedule_rules(id),
  captured_at timestamptz NOT NULL,
  release_date date NOT NULL,
  input_hash text NOT NULL,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id, version)
);

GRANT SELECT ON public.core_revenue_calculations TO authenticated;
GRANT ALL ON public.core_revenue_calculations TO service_role;
ALTER TABLE public.core_revenue_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rev_calc_admin_all" ON public.core_revenue_calculations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "rev_calc_company_read" ON public.core_revenue_calculations
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT ur.company_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_rev_calc_company ON public.core_revenue_calculations (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rev_calc_source  ON public.core_revenue_calculations (source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_rev_calc_release ON public.core_revenue_calculations (release_date) WHERE status = 'final';

CREATE OR REPLACE FUNCTION public.core_rev_calc_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status NOT IN ('voided','recalculated') AND OLD.status = 'final' THEN
      RAISE EXCEPTION 'core_revenue_calculations: snapshot final é imutável (use nova versão)';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rev_calc_immutable ON public.core_revenue_calculations;
CREATE TRIGGER trg_rev_calc_immutable
  BEFORE UPDATE ON public.core_revenue_calculations
  FOR EACH ROW EXECUTE FUNCTION public.core_rev_calc_immutable();

-- 5. FUNÇÕES DE APOIO
CREATE OR REPLACE FUNCTION public.add_business_days(start_ts timestamptz, n_days integer)
RETURNS date
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  d date := (start_ts AT TIME ZONE 'America/Sao_Paulo')::date;
  added integer := 0;
BEGIN
  WHILE added < n_days LOOP
    d := d + 1;
    IF EXTRACT(ISODOW FROM d) < 6 THEN
      added := added + 1;
    END IF;
  END LOOP;
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.resolve_fee_rule(
  _company_id uuid, _niche_id uuid, _product_id uuid,
  _method public.payment_method_kind, _at timestamptz DEFAULT now()
) RETURNS public.core_fee_rules
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT *
  FROM public.core_fee_rules r
  WHERE r.active = true
    AND (r.starts_at IS NULL OR r.starts_at <= _at)
    AND (r.ends_at   IS NULL OR r.ends_at   > _at)
    AND (r.method IS NULL OR r.method = _method)
    AND (
      (r.scope = 'product' AND r.product_id = _product_id) OR
      (r.scope = 'company' AND r.company_id = _company_id) OR
      (r.scope = 'niche'   AND r.niche_id   = _niche_id)   OR
      (r.scope = 'global')
    )
  ORDER BY
    CASE r.scope WHEN 'product' THEN 1 WHEN 'company' THEN 2 WHEN 'niche' THEN 3 WHEN 'global' THEN 4 ELSE 9 END,
    CASE WHEN r.method IS NOT NULL THEN 0 ELSE 1 END,
    r.priority ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resolve_payout_schedule(
  _company_id uuid, _niche_id uuid, _product_id uuid,
  _method public.payment_method_kind, _at timestamptz DEFAULT now()
) RETURNS public.core_payout_schedule_rules
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT *
  FROM public.core_payout_schedule_rules r
  WHERE r.active = true
    AND (r.starts_at IS NULL OR r.starts_at <= _at)
    AND (r.ends_at   IS NULL OR r.ends_at   > _at)
    AND (r.method IS NULL OR r.method = _method)
    AND (
      (r.scope = 'product' AND r.product_id = _product_id) OR
      (r.scope = 'company' AND r.company_id = _company_id) OR
      (r.scope = 'niche'   AND r.niche_id   = _niche_id)   OR
      (r.scope = 'global')
    )
  ORDER BY
    CASE r.scope WHEN 'product' THEN 1 WHEN 'company' THEN 2 WHEN 'niche' THEN 3 WHEN 'global' THEN 4 ELSE 9 END,
    CASE WHEN r.method IS NOT NULL THEN 0 ELSE 1 END,
    r.priority ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.compute_payout_release_date(
  _captured_at timestamptz, _company_id uuid, _niche_id uuid,
  _product_id uuid, _method public.payment_method_kind
) RETURNS date
LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE
  rule public.core_payout_schedule_rules;
BEGIN
  rule := public.resolve_payout_schedule(_company_id,_niche_id,_product_id,_method,_captured_at);
  IF rule.id IS NULL THEN
    IF _method = 'pix' THEN
      RETURN public.add_business_days(_captured_at, 5);
    ELSIF _method = 'credit_card' THEN
      RETURN (_captured_at AT TIME ZONE 'America/Sao_Paulo')::date + 36;
    ELSE
      RETURN (_captured_at AT TIME ZONE 'America/Sao_Paulo')::date + 7;
    END IF;
  END IF;

  IF rule.basis = 'business_days' THEN
    RETURN public.add_business_days(_captured_at, rule.delay_days);
  ELSE
    RETURN (_captured_at AT TIME ZONE 'America/Sao_Paulo')::date + rule.delay_days;
  END IF;
END $$;

-- 6. MOTOR PRINCIPAL
CREATE OR REPLACE FUNCTION public.calc_transaction_split(
  _source_table text, _source_id uuid
) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_pay record;
  v_company_id uuid;
  v_niche_id uuid;
  v_product_id uuid;
  v_method public.payment_method_kind;
  v_gross bigint := 0;
  v_coupon bigint := 0;
  v_gateway bigint := 0;
  v_imp bigint := 0;
  v_affiliate bigint := 0;
  v_coprod bigint := 0;
  v_reserve bigint := 0;
  v_net bigint := 0;
  v_captured timestamptz;
  v_after_coupon bigint;
  v_after_gateway bigint;
  v_after_imp bigint;
  v_after_aff bigint;
  v_fee_rule public.core_fee_rules;
  v_sched public.core_payout_schedule_rules;
  v_release date;
  v_next_version integer;
  v_calc_id uuid;
  v_hash text;
  v_legs jsonb := '[]'::jsonb;
  v_meta jsonb := '{}'::jsonb;
BEGIN
  IF _source_table <> 'mpago_payments' THEN
    RAISE EXCEPTION 'calc_transaction_split: source_table % ainda não suportado', _source_table;
  END IF;

  SELECT * INTO v_pay FROM public.mpago_payments WHERE id = _source_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment % não encontrado', _source_id; END IF;

  v_company_id := v_pay.company_id;
  v_captured   := COALESCE(v_pay.approved_at, v_pay.paid_at, v_pay.created_at, now());

  v_method := CASE LOWER(COALESCE(v_pay.payment_method, ''))
    WHEN 'pix' THEN 'pix'::public.payment_method_kind
    WHEN 'credit_card' THEN 'credit_card'::public.payment_method_kind
    WHEN 'debit_card' THEN 'debit_card'::public.payment_method_kind
    WHEN 'ticket' THEN 'boleto'::public.payment_method_kind
    WHEN 'bolbradesco' THEN 'boleto'::public.payment_method_kind
    WHEN 'boleto' THEN 'boleto'::public.payment_method_kind
    WHEN 'account_money' THEN 'wallet'::public.payment_method_kind
    ELSE 'other'::public.payment_method_kind
  END;

  v_gross := COALESCE(v_pay.amount_cents, 0);

  SELECT niche_id INTO v_niche_id FROM public.companies WHERE id = v_company_id;

  v_meta := jsonb_build_object(
    'provider','mercadopago',
    'mp_payment_id', v_pay.mp_payment_id,
    'payment_method', v_pay.payment_method,
    'context_type', v_pay.context_type,
    'context_id', v_pay.context_id
  );

  -- 1) bruto
  v_legs := v_legs || jsonb_build_object('step','gross','cents',v_gross);

  -- 2) cupom
  v_after_coupon := GREATEST(v_gross - v_coupon, 0);

  -- 3) gateway (taxa MP — sem campo dedicado por enquanto; pode vir no metadata futuramente)
  v_after_gateway := GREATEST(v_after_coupon - v_gateway, 0);

  -- 4) retenção Impulsionando
  v_fee_rule := public.resolve_fee_rule(v_company_id, v_niche_id, v_product_id, v_method, v_captured);
  IF v_fee_rule.id IS NOT NULL THEN
    v_imp := (v_after_gateway * v_fee_rule.percent_bps / 10000) + v_fee_rule.fixed_cents;
    IF v_imp < v_fee_rule.min_cents THEN v_imp := v_fee_rule.min_cents; END IF;
    IF v_fee_rule.max_cents IS NOT NULL AND v_imp > v_fee_rule.max_cents THEN v_imp := v_fee_rule.max_cents; END IF;
    IF v_imp > v_after_gateway THEN v_imp := v_after_gateway; END IF;
  END IF;
  v_after_imp := GREATEST(v_after_gateway - v_imp, 0);
  v_legs := v_legs || jsonb_build_object(
    'step','impulsionando_fee','cents',-v_imp,'subtotal',v_after_imp,
    'rule_id', v_fee_rule.id, 'rule_scope', v_fee_rule.scope,
    'percent_bps', v_fee_rule.percent_bps
  );

  -- 5) afiliados (link via aff_sales/aff_commissions pelo mp_payment_id em metadata da sale)
  SELECT COALESCE(SUM((c.amount * 100)::bigint), 0)
    INTO v_affiliate
  FROM public.aff_commissions c
  JOIN public.aff_sales s ON s.id = c.sale_id
  WHERE c.company_id = v_company_id
    AND c.status IN ('pending','approved','released')
    AND COALESCE(s.metadata->>'mp_payment_id', '') = COALESCE(v_pay.mp_payment_id, '_none_');
  v_affiliate := COALESCE(v_affiliate, 0);
  IF v_affiliate > v_after_imp THEN v_affiliate := v_after_imp; END IF;
  v_after_aff := GREATEST(v_after_imp - v_affiliate, 0);
  IF v_affiliate > 0 THEN
    v_legs := v_legs || jsonb_build_object('step','affiliate_commission','cents',-v_affiliate,'subtotal',v_after_aff);
  END IF;

  -- 6) coprodutores
  WITH cps AS (
    SELECT COALESCE(SUM(GREATEST(
      ((v_after_imp * COALESCE(cp.participation_pct,0))::numeric / 100)::bigint,
      COALESCE((cp.fixed_amount * 100)::bigint, 0)
    )),0)::bigint AS total
    FROM public.aff_coproducers cp
    WHERE cp.company_id = v_company_id
      AND cp.status = 'active'
      AND (cp.starts_at IS NULL OR cp.starts_at <= v_captured)
      AND (cp.ends_at   IS NULL OR cp.ends_at   >  v_captured)
  )
  SELECT total INTO v_coprod FROM cps;
  v_coprod := COALESCE(v_coprod, 0);
  IF v_coprod > v_after_aff THEN v_coprod := v_after_aff; END IF;
  IF v_coprod > 0 THEN
    v_legs := v_legs || jsonb_build_object('step','coproducer_commission','cents',-v_coprod,'subtotal',v_after_aff - v_coprod);
  END IF;

  -- 7) reserva
  v_sched := public.resolve_payout_schedule(v_company_id, v_niche_id, v_product_id, v_method, v_captured);
  IF v_sched.id IS NOT NULL AND v_sched.reserve_bps > 0 THEN
    v_reserve := ((v_after_aff - v_coprod) * v_sched.reserve_bps / 10000);
    v_legs := v_legs || jsonb_build_object('step','reserve','cents',-v_reserve,'bps',v_sched.reserve_bps);
  END IF;

  -- 8) líquido
  v_net := GREATEST(v_after_aff - v_coprod - v_reserve, 0);
  v_legs := v_legs || jsonb_build_object('step','net','cents',v_net);

  v_release := public.compute_payout_release_date(v_captured, v_company_id, v_niche_id, v_product_id, v_method);

  SELECT COALESCE(MAX(version),0)+1 INTO v_next_version
  FROM public.core_revenue_calculations
  WHERE source_table = _source_table AND source_id = _source_id;

  UPDATE public.core_revenue_calculations
    SET status = 'recalculated'
    WHERE source_table = _source_table AND source_id = _source_id AND status = 'final';

  v_hash := encode(digest(
    _source_table || ':' || _source_id::text || ':' || v_gross || ':' || v_coupon || ':' ||
    v_gateway || ':' || v_imp || ':' || v_affiliate || ':' || v_coprod || ':' || v_reserve ||
    ':' || v_net || ':' || v_next_version, 'sha256'
  ), 'hex');

  INSERT INTO public.core_revenue_calculations (
    company_id, source_table, source_id, version, status, method,
    gross_cents, coupon_cents, gateway_fee_cents, impulsionando_fee_cents,
    affiliate_commission_cents, coproducer_commission_cents, reserve_cents, net_cents,
    fee_rule_id, schedule_rule_id, captured_at, release_date,
    input_hash, legs, metadata
  ) VALUES (
    v_company_id, _source_table, _source_id, v_next_version, 'final', v_method,
    v_gross, v_coupon, v_gateway, v_imp,
    v_affiliate, v_coprod, v_reserve, v_net,
    v_fee_rule.id, v_sched.id, v_captured, v_release,
    v_hash, v_legs, v_meta
  ) RETURNING id INTO v_calc_id;

  INSERT INTO public.core_payout_events (
    company_id, event_type, gross_cents, fee_cents, net_cents,
    percent_bps_applied, rule_version, provider, provider_payment_id,
    status, reference_table, reference_id, occurred_at, approved_at, metadata
  ) VALUES (
    v_company_id, 'split_calculated', v_gross, v_imp, v_net,
    COALESCE(v_fee_rule.percent_bps,0), v_next_version, 'mercadopago', v_pay.mp_payment_id,
    'final', _source_table, _source_id, now(), v_captured,
    jsonb_build_object('calc_id', v_calc_id, 'release_date', v_release, 'legs', v_legs)
  );

  RETURN v_calc_id;
END $$;

-- 7. TRIGGER em mpago_payments
CREATE OR REPLACE FUNCTION public.trg_mpago_payment_approved()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    BEGIN
      PERFORM public.calc_transaction_split('mpago_payments', NEW.id);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
      VALUES ('error','core.fin','calc_split_failed',
              jsonb_build_object('payment_id', NEW.id, 'error', SQLERRM),
              NEW.company_id, now());
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_mpago_payments_calc_split ON public.mpago_payments;
CREATE TRIGGER trg_mpago_payments_calc_split
  AFTER INSERT OR UPDATE OF status ON public.mpago_payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_mpago_payment_approved();

-- 8. SEED
INSERT INTO public.core_fee_rules (scope, percent_bps, fixed_cents, priority, notes)
SELECT 'global', 500, 0, 1000, 'Default global Impulsionando — 5%'
WHERE NOT EXISTS (SELECT 1 FROM public.core_fee_rules WHERE scope='global' AND method IS NULL);

INSERT INTO public.core_payout_schedule_rules (scope, method, delay_days, basis, priority, notes)
SELECT 'global','pix',5,'business_days',1000,'PIX — 5 dias úteis'
WHERE NOT EXISTS (SELECT 1 FROM public.core_payout_schedule_rules WHERE scope='global' AND method='pix');

INSERT INTO public.core_payout_schedule_rules (scope, method, delay_days, basis, priority, notes)
SELECT 'global','credit_card',36,'calendar_days',1000,'Cartão — D+36'
WHERE NOT EXISTS (SELECT 1 FROM public.core_payout_schedule_rules WHERE scope='global' AND method='credit_card');

-- 9. updated_at triggers
DROP TRIGGER IF EXISTS trg_fee_rules_updated ON public.core_fee_rules;
CREATE TRIGGER trg_fee_rules_updated BEFORE UPDATE ON public.core_fee_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payout_rules_updated ON public.core_payout_schedule_rules;
CREATE TRIGGER trg_payout_rules_updated BEFORE UPDATE ON public.core_payout_schedule_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Audit
INSERT INTO public.runtime_events (level, scope, message, context, occurred_at)
VALUES ('info','core.fin','phase1_installed',
  jsonb_build_object(
    'phase','1',
    'tables', jsonb_build_array('core_fee_rules','core_payout_schedule_rules','core_revenue_calculations'),
    'defaults', jsonb_build_object('global_fee_pct',5,'pix_business_days',5,'credit_card_calendar_days',36)
  ),
  now()
);
