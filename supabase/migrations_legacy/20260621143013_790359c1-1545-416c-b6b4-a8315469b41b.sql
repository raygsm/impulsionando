
CREATE OR REPLACE FUNCTION public.ensure_impulsionando_test_customer(_company_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := '907cdfca-9edb-4d4b-a537-6a9b47fa69a6';
  v_email text := 'raygsmonnerat@gmail.com';
  v_customer_id uuid;
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
  ELSE
    INSERT INTO public.customers (company_id, name, email, tags, is_active, notes)
    VALUES (_company_id,'Raygs Monnerat (Cliente Teste Impulsionando)', v_email,
            ARRAY['impulsionando_test','cliente_teste_master'], true,
            'Cliente-teste padrão Impulsionando: navega/testa funcionalidades, pushes, avisos e campanhas como cliente real.')
    RETURNING id INTO v_customer_id;
  END IF;

  -- Ativar todas as preferências de notificação (push/email/whatsapp/sms/inapp × categorias)
  INSERT INTO public.notification_preferences (user_id, company_id, category, channel, enabled)
  SELECT v_user_id, _company_id, cat, ch, true
  FROM (VALUES ('all'),('marketing'),('transactional'),('campaign'),('reminder')) AS cats(cat)
  CROSS JOIN (VALUES ('push'),('email'),('whatsapp'),('sms'),('inapp')) AS chans(ch)
  ON CONFLICT DO NOTHING;

  RETURN v_customer_id;
END; $$;

INSERT INTO public.runtime_events (level, scope, message, context)
VALUES ('info','core.governance',
        'Cliente-teste Impulsionando: notification_preferences integradas ao auto-seed',
        jsonb_build_object(
          'test_customer_email','raygsmonnerat@gmail.com',
          'channels',ARRAY['push','email','whatsapp','sms','inapp'],
          'categories',ARRAY['all','marketing','transactional','campaign','reminder']));
