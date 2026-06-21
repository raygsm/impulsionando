
INSERT INTO public.consumer_profiles (user_id, full_name, marketing_optin, current_level)
SELECT '907cdfca-9edb-4d4b-a537-6a9b47fa69a6'::uuid,
       'Raygs Monnerat (Cliente Teste Impulsionando)', true, 'explorador'
WHERE NOT EXISTS (SELECT 1 FROM public.consumer_profiles WHERE user_id='907cdfca-9edb-4d4b-a537-6a9b47fa69a6');

INSERT INTO public.consumer_memberships (user_id, plan, status, amount_cents, cycle, started_at, current_period_start, current_period_end)
SELECT '907cdfca-9edb-4d4b-a537-6a9b47fa69a6'::uuid,'premium','active',0,'monthly', now(), now(), now() + interval '100 years'
WHERE NOT EXISTS (SELECT 1 FROM public.consumer_memberships WHERE user_id='907cdfca-9edb-4d4b-a537-6a9b47fa69a6' AND status='active');

CREATE OR REPLACE FUNCTION public.ensure_impulsionando_test_customer(_company_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text := 'raygsmonnerat@gmail.com'; v_customer_id uuid;
BEGIN
  IF _company_id IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_customer_id FROM public.customers
   WHERE company_id=_company_id AND lower(email)=v_email LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    UPDATE public.customers
       SET is_active=true,
           tags=(SELECT ARRAY(SELECT DISTINCT unnest(tags || ARRAY['impulsionando_test','cliente_teste_master']))),
           updated_at=now()
     WHERE id=v_customer_id;
    RETURN v_customer_id;
  END IF;
  INSERT INTO public.customers (company_id, name, email, tags, is_active, notes)
  VALUES (_company_id,'Raygs Monnerat (Cliente Teste Impulsionando)', v_email,
          ARRAY['impulsionando_test','cliente_teste_master'], true,
          'Cliente-teste padrão Impulsionando: navega/testa funcionalidades, pushes, avisos e campanhas como cliente real.')
  RETURNING id INTO v_customer_id;
  RETURN v_customer_id;
END; $$;

REVOKE ALL ON FUNCTION public.ensure_impulsionando_test_customer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_impulsionando_test_customer(uuid) TO authenticated, service_role;

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.companies
     WHERE COALESCE(is_master,false)=false AND COALESCE(is_active,true)=true
       AND COALESCE(environment::text,'real')='real'
       AND name NOT ILIKE '%E2E%' AND name NOT ILIKE '%arquivada%'
  LOOP PERFORM public.ensure_impulsionando_test_customer(r.id); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.tg_companies_seed_test_customer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_master,false)=false AND COALESCE(NEW.is_active,true)=true
     AND COALESCE(NEW.environment::text,'real')='real'
     AND COALESCE(NEW.name,'') NOT ILIKE '%E2E%'
  THEN PERFORM public.ensure_impulsionando_test_customer(NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS companies_seed_impulsionando_test_customer ON public.companies;
CREATE TRIGGER companies_seed_impulsionando_test_customer
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_companies_seed_test_customer();

INSERT INTO public.runtime_events (level, scope, message, context)
VALUES ('info','core.governance',
        'Cliente-teste padrão Impulsionando ativado em todos os tenants',
        jsonb_build_object(
          'master_admin_email','raygs@hotmail.com',
          'test_customer_email','raygsmonnerat@gmail.com',
          'test_customer_user_id','907cdfca-9edb-4d4b-a537-6a9b47fa69a6',
          'backfill','all real, non-master, non-demo, non-E2E companies',
          'autoseed_on_new_company',true));
