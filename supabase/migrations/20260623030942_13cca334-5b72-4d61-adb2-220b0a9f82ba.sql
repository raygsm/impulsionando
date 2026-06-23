
DO $$
DECLARE
  v_company uuid := '5bdcdef4-f0dc-4453-b935-a192ad514938';
  v_profile_gestor uuid := 'fcaf3905-2f47-4afa-b16e-0844b92706e5';
  v_profile_operador uuid := 'cb7c1e7f-9083-4451-a132-b8b320e81b85';
  v_sec_dir uuid; v_sec_ger uuid; v_sec_ven uuid;
  v_rogerio uuid;
  v_uid uuid;
  v_email text;
  v_name text;
  v_idx int;
  v_pass text := '123@Mudar';
  v_scopes_ger text[] := ARRAY[
    'riomed.dashboard.read','riomed.dashboard.manage',
    'riomed.team.manage','riomed.team.read',
    'riomed.report.read','riomed.report.export',
    'riomed.finance.read','riomed.invoice.read','riomed.payment.read',
    'riomed.commission.read','riomed.commission.manage',
    'riomed.quote.read','riomed.customer.read',
    'riomed.lead.read','riomed.crm.read','riomed.agenda.read'
  ];
  v_scopes_ven text[] := ARRAY[
    'riomed.lead.read','riomed.lead.write',
    'riomed.crm.read','riomed.crm.write',
    'riomed.agenda.read','riomed.agenda.write',
    'riomed.kanban.read','riomed.kanban.write',
    'riomed.quote.read','riomed.quote.write','riomed.quote.send',
    'riomed.customer.read','riomed.customer.write',
    'riomed.message.send','riomed.commission.read'
  ];
  v_scopes_dir text[] := ARRAY['riomed.*'];
  v_vendors text[] := ARRAY[
    'vendedor1.riomed@impulsionando.com.br|Vendedor 1 RioMed|V001',
    'vendedor2.riomed@impulsionando.com.br|Vendedor 2 RioMed|V002',
    'vendedor3.riomed@impulsionando.com.br|Vendedor 3 RioMed|V003',
    'vendedor4.riomed@impulsionando.com.br|Vendedor 4 RioMed|V004',
    'vendedor5.riomed@impulsionando.com.br|Vendedor 5 RioMed|V005'
  ];
  v_parts text[];
  v_scope text;
BEGIN
  -- ============ SETORES ============
  INSERT INTO public.sectors (company_id, name, code, description)
  VALUES (v_company, 'Diretoria', 'diretoria', 'Visão completa do negócio')
  ON CONFLICT (company_id, code) WHERE code IS NOT NULL DO UPDATE SET name=EXCLUDED.name
  RETURNING id INTO v_sec_dir;
  IF v_sec_dir IS NULL THEN SELECT id INTO v_sec_dir FROM public.sectors WHERE company_id=v_company AND code='diretoria'; END IF;

  INSERT INTO public.sectors (company_id, name, code, description)
  VALUES (v_company, 'Gerência', 'gerencia', 'Gestão operacional e financeira')
  ON CONFLICT (company_id, code) WHERE code IS NOT NULL DO UPDATE SET name=EXCLUDED.name
  RETURNING id INTO v_sec_ger;
  IF v_sec_ger IS NULL THEN SELECT id INTO v_sec_ger FROM public.sectors WHERE company_id=v_company AND code='gerencia'; END IF;

  INSERT INTO public.sectors (company_id, name, code, description)
  VALUES (v_company, 'Vendas', 'vendas', 'Equipe comercial — agenda, CRM e leads')
  ON CONFLICT (company_id, code) WHERE code IS NOT NULL DO UPDATE SET name=EXCLUDED.name
  RETURNING id INTO v_sec_ven;
  IF v_sec_ven IS NULL THEN SELECT id INTO v_sec_ven FROM public.sectors WHERE company_id=v_company AND code='vendas'; END IF;

  -- ============ HELPER: garantir Rogério (Diretoria) ============
  SELECT id INTO v_rogerio FROM auth.users WHERE email='riotrade@hotmail.com' LIMIT 1;
  IF v_rogerio IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, company_id, profile_id, display_name, email, is_active)
    VALUES (v_rogerio, v_company, v_profile_gestor, 'Rogério Junqueira', 'riotrade@hotmail.com', true)
    ON CONFLICT (user_id, company_id, profile_id) DO UPDATE SET is_active=true;

    INSERT INTO public.sector_members (company_id, sector_id, user_id, role_in_sector)
    VALUES (v_company, v_sec_dir, v_rogerio, 'lead')
    ON CONFLICT (company_id, sector_id, user_id) DO UPDATE SET role_in_sector='lead', is_active=true;

    FOREACH v_scope IN ARRAY v_scopes_dir LOOP
      INSERT INTO public.riomed_user_scopes (company_id, user_id, scope, notes)
      VALUES (v_company, v_rogerio, v_scope, 'Diretoria — acesso total')
      ON CONFLICT (company_id, user_id, scope) DO NOTHING;
    END LOOP;
  END IF;

  -- ============ GERÊNCIA ============
  v_email := 'gerencia.riomed@impulsionando.com.br';
  v_name := 'Gerência RioMed';
  SELECT id INTO v_uid FROM auth.users WHERE email=v_email LIMIT 1;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(v_pass, gen_salt('bf')), now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', v_name),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', v_uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password=crypt(v_pass, gen_salt('bf')),
      email_confirmed_at=COALESCE(email_confirmed_at, now()), updated_at=now(),
      raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('full_name', v_name)
    WHERE id=v_uid;
  END IF;

  INSERT INTO public.user_profiles (user_id, company_id, profile_id, display_name, email, is_active)
  VALUES (v_uid, v_company, v_profile_gestor, v_name, v_email, true)
  ON CONFLICT (user_id, company_id, profile_id) DO UPDATE SET is_active=true, display_name=EXCLUDED.display_name;

  INSERT INTO public.sector_members (company_id, sector_id, user_id, role_in_sector)
  VALUES (v_company, v_sec_ger, v_uid, 'lead')
  ON CONFLICT (company_id, sector_id, user_id) DO UPDATE SET role_in_sector='lead', is_active=true;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_uid AND role='gestor'::app_role AND company_id=v_company) THEN
    INSERT INTO public.user_roles (user_id, role, company_id) VALUES (v_uid, 'gestor'::app_role, v_company);
  END IF;

  FOREACH v_scope IN ARRAY v_scopes_ger LOOP
    INSERT INTO public.riomed_user_scopes (company_id, user_id, scope, notes)
    VALUES (v_company, v_uid, v_scope, 'Gerência RioMed')
    ON CONFLICT (company_id, user_id, scope) DO NOTHING;
  END LOOP;

  -- ============ VENDEDORES (loop 1..5) ============
  FOR v_idx IN 1..array_length(v_vendors,1) LOOP
    v_parts := string_to_array(v_vendors[v_idx], '|');
    v_email := v_parts[1];
    v_name := v_parts[2];

    SELECT id INTO v_uid FROM auth.users WHERE email=v_email LIMIT 1;
    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        v_email, crypt(v_pass, gen_salt('bf')), now(),
        jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', v_name),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now());
    ELSE
      UPDATE auth.users SET encrypted_password=crypt(v_pass, gen_salt('bf')),
        email_confirmed_at=COALESCE(email_confirmed_at, now()), updated_at=now(),
        raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('full_name', v_name)
      WHERE id=v_uid;
    END IF;

    INSERT INTO public.user_profiles (user_id, company_id, profile_id, display_name, email, is_active)
    VALUES (v_uid, v_company, v_profile_operador, v_name, v_email, true)
    ON CONFLICT (user_id, company_id, profile_id) DO UPDATE SET is_active=true, display_name=EXCLUDED.display_name;

    INSERT INTO public.sector_members (company_id, sector_id, user_id, role_in_sector)
    VALUES (v_company, v_sec_ven, v_uid, 'member')
    ON CONFLICT (company_id, sector_id, user_id) DO UPDATE SET is_active=true;

    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_uid AND role='operador'::app_role AND company_id=v_company) THEN
      INSERT INTO public.user_roles (user_id, role, company_id) VALUES (v_uid, 'operador'::app_role, v_company);
    END IF;

    FOREACH v_scope IN ARRAY v_scopes_ven LOOP
      INSERT INTO public.riomed_user_scopes (company_id, user_id, scope, notes)
      VALUES (v_company, v_uid, v_scope, 'Vendedor RioMed')
      ON CONFLICT (company_id, user_id, scope) DO NOTHING;
    END LOOP;

    INSERT INTO public.riomed_sellers (company_id, user_id, full_name, email, seller_code, commission_rate, status)
    VALUES (v_company, v_uid, v_name, v_email, v_parts[3], 5.00, 'active')
    ON CONFLICT (company_id, email) DO UPDATE SET user_id=EXCLUDED.user_id, full_name=EXCLUDED.full_name, status='active';
  END LOOP;
END $$;
