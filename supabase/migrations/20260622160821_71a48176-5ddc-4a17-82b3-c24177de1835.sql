DO $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT id INTO v_company_id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'RioMed company not found; skipping.';
    RETURN;
  END IF;

  UPDATE public.companies
     SET phone = '+591 3 324 6171', updated_at = now()
   WHERE id = v_company_id;

  UPDATE public.core_tenant_identity
     SET metadata = metadata || jsonb_build_object(
       'official_links', jsonb_build_object(
         'linktree',     'https://linktr.ee/rio_med',
         'whatsapp',     'https://wa.me/59133246171',
         'whatsapp_e164','+59133246171',
         'ventas',       'https://linktr.ee/VentasRioMed',
         'catalogos',    'https://drive.google.com/drive/folders/1sYJc105MVpoTo1Oo4rEPP9hB-oMvuGch?usp=sharing',
         'maps',         'https://maps.app.goo.gl/MU9TayFyrC5iSzXx5'
       ),
       'social', jsonb_build_object(
         'instagram', 'https://www.instagram.com/rio_med/',
         'facebook',  'https://www.facebook.com/RioMedEquiposMedicos',
         'tiktok',    'https://www.tiktok.com/@rio_med'
       ),
       'tagline_es', 'Equipos Médicos — venta, alquiler, home care y asistencia técnica',
       'source_linktree_verified_at', to_jsonb(now())
     ),
     updated_at = now()
   WHERE company_id = v_company_id;
END $$;