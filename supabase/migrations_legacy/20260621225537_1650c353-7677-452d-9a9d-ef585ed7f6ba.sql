
-- 1. Seed regra global padrão (idempotente)
INSERT INTO public.core_fee_rules (scope, method, percent_bps, fixed_cents, min_cents, priority, active, notes)
SELECT 'global'::fee_rule_scope, 'other'::payment_method_kind, 50, 0, 0, 0, true,
       'Taxa de Intermediação Digital padrão — Marketplace B2B Impulsionando (0,50%)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_fee_rules
  WHERE scope = 'global' AND active = true
    AND notes ILIKE '%Intermediação Digital%'
);

-- 2. Resolver de bps por escopo
CREATE OR REPLACE FUNCTION public.resolve_intermediation_bps(
  _provider_company_id uuid,
  _niche_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bps integer;
  _now timestamptz := now();
BEGIN
  SELECT percent_bps INTO _bps
  FROM public.core_fee_rules
  WHERE active = true
    AND (starts_at IS NULL OR starts_at <= _now)
    AND (ends_at IS NULL OR ends_at >= _now)
    AND (
      (scope = 'company' AND company_id = _provider_company_id)
      OR (scope = 'niche'   AND niche_id   = _niche_id AND _niche_id IS NOT NULL)
      OR (scope = 'global')
    )
  ORDER BY
    CASE scope WHEN 'company' THEN 1 WHEN 'niche' THEN 2 WHEN 'global' THEN 3 ELSE 9 END,
    priority DESC NULLS LAST,
    created_at DESC
  LIMIT 1;

  RETURN COALESCE(_bps, 50);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_intermediation_bps(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_intermediation_bps(uuid, uuid) TO authenticated, service_role;

-- 3. Enfileirar intermediação a partir de um engagement
CREATE OR REPLACE FUNCTION public.enqueue_marketplace_intermediation(_engagement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _eng record;
  _niche_id uuid;
  _bps integer;
  _fee_cents bigint;
  _net_cents bigint;
  _calc_id uuid;
  _existing uuid;
BEGIN
  SELECT * INTO _eng
  FROM public.eco_marketplace_engagements
  WHERE id = _engagement_id;

  IF _eng.id IS NULL THEN
    RAISE EXCEPTION 'engagement % não encontrado', _engagement_id;
  END IF;

  IF _eng.gmv_cents IS NULL OR _eng.gmv_cents <= 0 THEN
    RETURN NULL;
  END IF;

  -- Idempotência: já existe cálculo para este engagement?
  SELECT id INTO _existing
  FROM public.core_revenue_calculations
  WHERE source_table = 'eco_marketplace_engagements'
    AND source_id    = _eng.id
  LIMIT 1;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  SELECT niche_id INTO _niche_id FROM public.companies WHERE id = _eng.provider_company_id;

  _bps := COALESCE(_eng.intermediation_fee_bps, public.resolve_intermediation_bps(_eng.provider_company_id, _niche_id));
  _fee_cents := GREATEST(0, ROUND((_eng.gmv_cents::numeric * _bps::numeric) / 10000.0))::bigint;
  _net_cents := GREATEST(0, _eng.gmv_cents::bigint - _fee_cents);

  UPDATE public.eco_marketplace_engagements
     SET intermediation_fee_bps   = _bps,
         intermediation_fee_cents = _fee_cents,
         updated_at = now()
   WHERE id = _eng.id;

  INSERT INTO public.core_revenue_calculations (
    company_id, source_table, source_id, version, status, method,
    gross_cents, coupon_cents, gateway_fee_cents, impulsionando_fee_cents,
    affiliate_commission_cents, coproducer_commission_cents, reserve_cents, net_cents,
    captured_at, release_date, input_hash, legs, metadata
  ) VALUES (
    _eng.provider_company_id, 'eco_marketplace_engagements', _eng.id, 1,
    'final'::revenue_calc_status, 'other'::payment_method_kind,
    _eng.gmv_cents::bigint, 0, 0, _fee_cents,
    0, 0, 0, _net_cents,
    COALESCE(_eng.completed_at, now()),
    (COALESCE(_eng.completed_at, now())::date),
    encode(digest('eng:' || _eng.id::text || ':' || _eng.gmv_cents::text || ':' || _bps::text, 'sha256'), 'hex'),
    jsonb_build_array(jsonb_build_object(
      'leg', 'intermediation',
      'gmv_cents', _eng.gmv_cents,
      'bps', _bps,
      'fee_cents', _fee_cents,
      'net_cents', _net_cents
    )),
    jsonb_build_object(
      'kind', 'marketplace_intermediation',
      'engagement_id', _eng.id,
      'requester_company_id', _eng.requester_company_id,
      'provider_company_id', _eng.provider_company_id,
      'quote_id', _eng.quote_id,
      'request_id', _eng.request_id
    )
  )
  RETURNING id INTO _calc_id;

  RETURN _calc_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_marketplace_intermediation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_marketplace_intermediation(uuid) TO authenticated, service_role;

-- 4. Trigger: ao virar 'completed', enfileira intermediação (failure-soft)
CREATE OR REPLACE FUNCTION public.trg_eco_engagement_intermediation_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
     AND COALESCE(NEW.gmv_cents, 0) > 0 THEN
    BEGIN
      PERFORM public.enqueue_marketplace_intermediation(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.runtime_events (scope, level, message, context)
      VALUES ('marketplace.intermediation', 'error',
              'falha ao enfileirar intermediação: ' || SQLERRM,
              jsonb_build_object('engagement_id', NEW.id, 'sqlstate', SQLSTATE));
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_eco_engagement_intermediation ON public.eco_marketplace_engagements;
CREATE TRIGGER trg_eco_engagement_intermediation
AFTER INSERT OR UPDATE OF status, gmv_cents
ON public.eco_marketplace_engagements
FOR EACH ROW EXECUTE FUNCTION public.trg_eco_engagement_intermediation_fn();

-- 5. View consolidada de GMV
CREATE OR REPLACE VIEW public.v_marketplace_gmv_summary
WITH (security_invoker = true) AS
SELECT
  e.provider_company_id AS company_id,
  c.name                AS company_name,
  c.niche_id,
  date_trunc('month', COALESCE(e.completed_at, e.created_at))::date AS period_month,
  count(*)                                       AS engagements_count,
  count(*) FILTER (WHERE e.status = 'completed') AS completed_count,
  COALESCE(sum(e.gmv_cents) FILTER (WHERE e.status = 'completed'), 0)::bigint                AS gmv_cents,
  COALESCE(sum(e.intermediation_fee_cents) FILTER (WHERE e.status = 'completed'), 0)::bigint AS intermediation_fee_cents,
  CASE
    WHEN COALESCE(sum(e.gmv_cents) FILTER (WHERE e.status = 'completed'), 0) > 0
    THEN ROUND( (sum(e.intermediation_fee_cents) FILTER (WHERE e.status='completed'))::numeric
              / (sum(e.gmv_cents) FILTER (WHERE e.status='completed'))::numeric * 10000.0 )::integer
    ELSE NULL
  END AS effective_bps
FROM public.eco_marketplace_engagements e
JOIN public.companies c ON c.id = e.provider_company_id
GROUP BY e.provider_company_id, c.name, c.niche_id,
         date_trunc('month', COALESCE(e.completed_at, e.created_at));

GRANT SELECT ON public.v_marketplace_gmv_summary TO authenticated, service_role;
