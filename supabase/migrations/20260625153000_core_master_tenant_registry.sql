-- Core Impulsionando: official tenant registry and master access hardening.
-- Safe characteristics:
-- - no DROP, TRUNCATE or DELETE;
-- - idempotent inserts/updates only;
-- - does not change frontend or business rules;
-- - keeps existing tenant data whenever it is already present.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS vitrine_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_kind text,
  ADD COLUMN IF NOT EXISTS status_commercial text,
  ADD COLUMN IF NOT EXISTS status_financial text,
  ADD COLUMN IF NOT EXISTS status_technical text,
  ADD COLUMN IF NOT EXISTS release_channel text NOT NULL DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS migration_status text NOT NULL DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS subnicho_slug text;

INSERT INTO public.niches (slug, name, description, icon, is_active)
VALUES
  ('core-saas', 'Core SaaS', 'Operacao master Impulsionando e multi-tenant.', 'shield', true),
  ('saude', 'Saude', 'Clinicas, consultorios, atendimento, agenda e operacao de saude.', 'stethoscope', true),
  ('imobiliaria', 'Imobiliaria', 'Carteira imobiliaria, leads, visitas e vitrine de imoveis.', 'home', true),
  ('eventos', 'Eventos', 'Eventos, parceiros, producao, agenda e repasses.', 'ticket', true),
  ('servicos', 'Servicos', 'Operacoes comerciais, atendimento e automacao.', 'briefcase', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true,
  updated_at = now();

INSERT INTO public.modules (slug, name, description, icon, category, is_core, is_active, sort_order)
VALUES
  ('erp', 'ERP', 'Gestao operacional, financeira, usuarios, permissoes, contratos e auditoria.', 'briefcase', 'Gestao', true, true, 10),
  ('crm', 'CRM', 'Leads, clientes, funis, relacionamento, atendimento e pos-venda.', 'users', 'Atendimento e Vendas', true, true, 20),
  ('automacao', 'Automacao e Comunicacao', 'WhatsApp, e-mail, IA, webhooks, follow-ups e filas de atendimento.', 'bot', 'Atendimento e Vendas', true, true, 30),
  ('agenda', 'Agenda e Reservas', 'Agenda, reservas, disponibilidade, reagendamento e confirmacoes.', 'calendar', 'Atendimento e Vendas', true, true, 40),
  ('commerce', 'Commerce e Pagamentos', 'Checkout, Mercado Pago, Pix, assinaturas, faturas e baixa automatica.', 'credit-card', 'Operacao', true, true, 50),
  ('estoque', 'Estoque e Fornecedores', 'Produtos, servicos, insumos, compras, fornecedores e reposicao.', 'boxes', 'Operacao', true, true, 60),
  ('saude', 'Saude e Prontuario', 'Pacientes, consultas, prontuario, exames, documentos e area do paciente.', 'stethoscope', 'Operacao', true, true, 70),
  ('eventos', 'Eventos e Ingressos', 'Eventos, ingressos, check-in, convidados e pos-evento.', 'ticket', 'Crescimento', true, true, 80),
  ('bi', 'BI e Dashboards', 'Indicadores, relatorios, dashboards executivos e inteligencia por tenant.', 'bar-chart', 'Gestao', true, true, 90),
  ('white_label', 'White Label e Franquias Digitais', 'Marca propria, gestao multiempresa, planos, repasses e operacao de parceiros.', 'layers', 'Plataforma', true, true, 100),
  ('area_cliente', 'Area do Cliente', 'Portal do cliente, paciente, aluno, participante ou consumidor.', 'user-circle', 'Plataforma', true, true, 110),
  ('parceiros', 'Parceiros', 'Rede de parceiros, agenda integrada, contratos, repasses e reputacao.', 'handshake', 'Operacao', true, true, 120)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  is_core = EXCLUDED.is_core,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

DO $$
DECLARE
  v_master_id uuid;
  v_company_id uuid;
  v_user_id uuid;
  v_profile_id uuid;
  v_record record;
  v_modules text[];
BEGIN
  SELECT id INTO v_master_id
  FROM public.companies
  WHERE is_master = true
  ORDER BY created_at
  LIMIT 1;

  IF v_master_id IS NULL THEN
    INSERT INTO public.companies (
      name, legal_name, trade_name, is_master, is_active, is_demo, status,
      niche_id, company_kind, status_commercial, status_financial, status_technical,
      public_slug, subdomain, domain, website, release_channel, migration_status
    )
    VALUES (
      'Impulsionando', 'Impulsionando Sistemas', 'Impulsionando',
      true, true, false, 'active',
      (SELECT id FROM public.niches WHERE slug = 'core-saas'),
      'interna', 'ativa', 'adimplente', 'operacional',
      'impulsionando', 'impulsionando', 'impulsionando.com.br',
      'https://impulsionando.com.br', 'stable', 'native'
    )
    RETURNING id INTO v_master_id;
  ELSE
    UPDATE public.companies
    SET
      name = COALESCE(NULLIF(name, ''), 'Impulsionando'),
      legal_name = COALESCE(legal_name, 'Impulsionando Sistemas'),
      trade_name = COALESCE(trade_name, 'Impulsionando'),
      company_kind = 'interna',
      status_commercial = 'ativa',
      status_financial = 'adimplente',
      status_technical = 'operacional',
      public_slug = COALESCE(public_slug, 'impulsionando'),
      subdomain = COALESCE(subdomain, 'impulsionando'),
      domain = COALESCE(domain, 'impulsionando.com.br'),
      website = COALESCE(website, 'https://impulsionando.com.br'),
      release_channel = COALESCE(release_channel, 'stable'),
      migration_status = COALESCE(migration_status, 'native'),
      is_active = true,
      updated_at = now()
    WHERE id = v_master_id;
  END IF;

  INSERT INTO public.core_tenant_identity (company_id, subdomain, root_domain, dns_status, ssl_status, metadata)
  VALUES (
    v_master_id, 'impulsionando', 'impulsionando.com.br', 'pending', 'pending',
    jsonb_build_object(
      'role', 'core-master',
      'source', 'core_master_tenant_registry',
      'dashboard', 'master',
      'can_manage_all_tenants', true
    )
  )
  ON CONFLICT (company_id) DO UPDATE SET
    metadata = public.core_tenant_identity.metadata || EXCLUDED.metadata,
    updated_at = now();

  FOR v_record IN
    SELECT *
    FROM (VALUES
      ('riomed', 'RioMed', 'RioMed', 'saude', 'medico-hospitalar',
       ARRAY['erp','crm','automacao','agenda','commerce','estoque','saude','bi','area_cliente']::text[]),
      ('chrismed', 'Chrismed', 'Chrismed', 'saude', 'clinica',
       ARRAY['erp','crm','automacao','agenda','commerce','saude','bi','area_cliente']::text[]),
      ('imobiliaria-garrido', 'Imobiliaria Garrido', 'Imobiliaria Garrido', 'imobiliaria', 'imobiliaria',
       ARRAY['erp','crm','automacao','agenda','commerce','bi','area_cliente']::text[]),
      ('wmp', 'WMP', 'WMP', 'eventos', 'eventos',
       ARRAY['erp','crm','automacao','agenda','commerce','eventos','parceiros','bi','area_cliente']::text[]),
      ('dqa', 'DQA', 'DQA', 'servicos', 'servicos',
       ARRAY['erp','crm','automacao','commerce','bi','area_cliente']::text[])
    ) AS t(public_slug, name, trade_name, niche_slug, subnicho_slug, module_slugs)
  LOOP
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE public_slug = v_record.public_slug
       OR subdomain = v_record.public_slug
       OR lower(name) = lower(v_record.name)
    ORDER BY created_at
    LIMIT 1;

    IF v_company_id IS NULL THEN
      INSERT INTO public.companies (
        name, legal_name, trade_name, is_master, is_active, is_demo, status,
        niche_id, company_kind, status_commercial, status_financial, status_technical,
        public_slug, subdomain, domain, website, release_channel, migration_status,
        subnicho_slug
      )
      VALUES (
        v_record.name, v_record.name, v_record.trade_name,
        false, true, false, 'active',
        (SELECT id FROM public.niches WHERE slug = v_record.niche_slug),
        'real', 'ativa', 'adimplente', 'operacional',
        v_record.public_slug,
        CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'garrido' ELSE v_record.public_slug END,
        CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'garrido.impulsionando.com.br' ELSE v_record.public_slug || '.impulsionando.com.br' END,
        CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'https://garrido.impulsionando.com.br' ELSE 'https://' || v_record.public_slug || '.impulsionando.com.br' END,
        'stable', 'native', v_record.subnicho_slug
      )
      RETURNING id INTO v_company_id;
    ELSE
      UPDATE public.companies
      SET
        trade_name = COALESCE(public.companies.trade_name, v_record.trade_name),
        legal_name = COALESCE(public.companies.legal_name, v_record.name),
        niche_id = COALESCE(public.companies.niche_id, (SELECT id FROM public.niches WHERE slug = v_record.niche_slug)),
        company_kind = COALESCE(public.companies.company_kind, 'real'),
        status_commercial = COALESCE(public.companies.status_commercial, 'ativa'),
        status_financial = COALESCE(public.companies.status_financial, 'adimplente'),
        status_technical = COALESCE(public.companies.status_technical, 'operacional'),
        public_slug = COALESCE(public.companies.public_slug, v_record.public_slug),
        subdomain = COALESCE(
          public.companies.subdomain,
          CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'garrido' ELSE v_record.public_slug END
        ),
        domain = COALESCE(
          public.companies.domain,
          CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'garrido.impulsionando.com.br' ELSE v_record.public_slug || '.impulsionando.com.br' END
        ),
        website = COALESCE(
          public.companies.website,
          CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'https://garrido.impulsionando.com.br' ELSE 'https://' || v_record.public_slug || '.impulsionando.com.br' END
        ),
        release_channel = COALESCE(public.companies.release_channel, 'stable'),
        migration_status = COALESCE(public.companies.migration_status, 'native'),
        subnicho_slug = COALESCE(public.companies.subnicho_slug, v_record.subnicho_slug),
        is_active = true,
        updated_at = now()
      WHERE id = v_company_id;
    END IF;

    INSERT INTO public.core_tenant_identity (company_id, subdomain, root_domain, dns_status, ssl_status, metadata)
    VALUES (
      v_company_id,
      CASE WHEN v_record.public_slug = 'imobiliaria-garrido' THEN 'garrido' ELSE v_record.public_slug END,
      'impulsionando.com.br',
      'pending',
      'pending',
      jsonb_build_object(
        'role', 'managed-tenant',
        'source', 'core_master_tenant_registry',
        'canonical_slug', v_record.public_slug,
        'managed_by', 'impulsionando',
        'dashboard_control', jsonb_build_object(
          'plans', true,
          'modules', true,
          'tools', true,
          'agenda', true,
          'upgrade_downgrade', true,
          'support_impersonation', true
        )
      )
    )
    ON CONFLICT (company_id) DO UPDATE SET
      subdomain = EXCLUDED.subdomain,
      root_domain = EXCLUDED.root_domain,
      metadata = public.core_tenant_identity.metadata || EXCLUDED.metadata,
      updated_at = now();

    v_modules := v_record.module_slugs;
    INSERT INTO public.company_modules (company_id, module_id, is_enabled, enabled_at, installed_at)
    SELECT v_company_id, m.id, true, now(), COALESCE(cm.installed_at, now())
    FROM public.modules m
    LEFT JOIN public.company_modules cm ON cm.company_id = v_company_id AND cm.module_id = m.id
    WHERE m.slug = ANY(v_modules)
    ON CONFLICT (company_id, module_id) DO UPDATE SET
      is_enabled = true,
      enabled_at = COALESCE(public.company_modules.enabled_at, now()),
      installed_at = COALESCE(public.company_modules.installed_at, now()),
      updated_at = now();

    INSERT INTO public.company_settings (company_id, key, value, value_type)
    VALUES (
      v_company_id,
      'core.master_control',
      jsonb_build_object(
        'managed_by', 'impulsionando',
        'master_dashboard', true,
        'can_install_modules', true,
        'can_install_out_of_plan_tools', true,
        'can_upgrade_downgrade_plan', true,
        'can_install_agenda', true,
        'canonical_slug', v_record.public_slug
      ),
      'json'
    )
    ON CONFLICT (company_id, key) DO UPDATE SET
      value = COALESCE(public.company_settings.value, '{}'::jsonb) || EXCLUDED.value,
      value_type = 'json',
      updated_at = now();
  END LOOP;

  INSERT INTO public.profiles (slug, name, description, is_master_profile)
  VALUES (
    'super-admin-impulsionando',
    'Super Admin Impulsionando',
    'Acesso master ao Core Impulsionando e a todos os tenants gerenciados.',
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_master_profile = true,
    updated_at = now();

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('ricks@hotmail.com')
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE slug = 'super-admin-impulsionando'
  LIMIT 1;

  IF v_user_id IS NOT NULL AND v_master_id IS NOT NULL AND v_profile_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      user_id, company_id, profile_id, display_name, email, is_active
    )
    VALUES (
      v_user_id, v_master_id, v_profile_id, 'Ricks', 'ricks@hotmail.com', true
    )
    ON CONFLICT (user_id, company_id, profile_id) DO UPDATE SET
      display_name = COALESCE(public.user_profiles.display_name, EXCLUDED.display_name),
      email = EXCLUDED.email,
      is_active = true,
      updated_at = now();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
