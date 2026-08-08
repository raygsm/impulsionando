DO $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT id INTO v_company_id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'RioMed company not found; skipping.';
    RETURN;
  END IF;

  UPDATE public.core_tenant_identity
     SET metadata = jsonb_set(
            jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{social,facebook}',
              to_jsonb('https://www.facebook.com/RIOMEDBOLIVIA'::text),
              true
            ),
            '{social,facebook_handle}',
            to_jsonb('RIOMEDBOLIVIA'::text),
            true
          ),
         updated_at = now()
   WHERE company_id = v_company_id;

  UPDATE public.core_tenant_identity
     SET metadata = jsonb_set(
            metadata,
            '{ai_assistant,official_channels,facebook}',
            to_jsonb('https://www.facebook.com/RIOMEDBOLIVIA'::text),
            true
          )
   WHERE company_id = v_company_id
     AND metadata ? 'ai_assistant';
END $$;