
INSERT INTO public.niches (slug, name, description, icon, macro_slug, is_active)
VALUES ('medico-hospitalar', 'Médico-Hospitalar',
        'Equipamentos médicos, locação, home care, assistência técnica e suprimentos hospitalares',
        'stethoscope', 'saude', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  macro_slug = EXCLUDED.macro_slug, is_active = true, updated_at = now();

DO $$
DECLARE
  v_niche_id uuid;
  v_company_id uuid;
BEGIN
  SELECT id INTO v_niche_id FROM public.niches WHERE slug = 'medico-hospitalar';
  SELECT id INTO v_company_id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (
      name, legal_name, trade_name, niche_id, company_kind, segment, subnicho_slug,
      subdomain, domain, website,
      email, commercial_email, support_email, financial_email,
      address_city, address_state, primary_color, secondary_color,
      environment, status, is_active, is_demo, is_master,
      release_channel, status_commercial, status_financial, status_technical, migration_status
    ) VALUES (
      'RioMed','RioMed Equipos Médicos S.R.L.','RioMed',
      v_niche_id,'real','medico-hospitalar','medico-hospitalar',
      'riomed','riomed.impulsionando.com.br','https://riomed.impulsionando.com.br',
      'contacto@riomed.impulsionando.com.br','ventas@riomed.impulsionando.com.br',
      'soporte@riomed.impulsionando.com.br','finanzas@riomed.impulsionando.com.br',
      'Santa Cruz de la Sierra','BO','#0F4C81','#E63946',
      'real','active',true,false,false,
      'stable','ativa','adimplente','operacional','native'
    ) RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.core_tenant_identity (company_id, subdomain, root_domain, dns_status, ssl_status, metadata)
  VALUES (v_company_id,'riomed','impulsionando.com.br','pending','pending',
          jsonb_build_object('country','BO','language','es-BO','currency','BOB',
            'plan','enterprise','taxa_intermediacao_pct',0.75,
            'aliases', ARRAY['ventas','soporte','alquiler','mantenimiento']))
  ON CONFLICT (company_id) DO UPDATE SET
    metadata = public.core_tenant_identity.metadata || EXCLUDED.metadata, updated_at = now();

  INSERT INTO public.company_modules (company_id, module_id, is_enabled, enabled_at, installed_at)
  SELECT v_company_id, m.id, true, now(), now() FROM public.modules m
  WHERE m.slug IN ('dashboard','administracao','crm','erp','estoque','financeiro',
    'commerce','agenda','automacao','bi','area_cliente','configuracoes','auditoria',
    'perfis','usuarios','setores','unidades','empresas','nichos')
  ON CONFLICT (company_id, module_id) DO UPDATE SET is_enabled = true, enabled_at = now();

  INSERT INTO public.crm_pipelines (company_id, name, description, is_default, sort_order, is_active) VALUES
    (v_company_id,'Vendas','Funil comercial — venda direta de equipamentos e suprimentos',true,1,true),
    (v_company_id,'Locação','Funil de locação de camas, equipamentos e home care',false,2,true),
    (v_company_id,'Assistência Técnica','Chamados, manutenção e ordens de serviço',false,3,true),
    (v_company_id,'B2B','Clínicas, hospitais, distribuidores e governo',false,4,true)
  ON CONFLICT DO NOTHING;

  WITH p AS (SELECT id FROM public.crm_pipelines WHERE company_id = v_company_id AND name='Vendas')
  INSERT INTO public.crm_stages (company_id, pipeline_id, name, sort_order, color)
  SELECT v_company_id, p.id, s.name, s.ord, s.color FROM p,
    (VALUES ('Novo lead',1,'#94a3b8'),('Atendimento iniciado',2,'#60a5fa'),('Produto identificado',3,'#38bdf8'),
            ('Orçamento enviado',4,'#fbbf24'),('Negociação',5,'#f59e0b'),('Pagamento pendente',6,'#fb923c'),
            ('Pedido confirmado',7,'#22c55e'),('Separação',8,'#10b981'),('Entregue',9,'#059669'),
            ('Pós-venda',10,'#0ea5e9'),('Perdido',11,'#ef4444')) AS s(name,ord,color)
  ON CONFLICT DO NOTHING;

  WITH p AS (SELECT id FROM public.crm_pipelines WHERE company_id = v_company_id AND name='Locação')
  INSERT INTO public.crm_stages (company_id, pipeline_id, name, sort_order, color)
  SELECT v_company_id, p.id, s.name, s.ord, s.color FROM p,
    (VALUES ('Nova solicitação',1,'#94a3b8'),('Disponibilidade consultada',2,'#60a5fa'),('Documentação pendente',3,'#fbbf24'),
            ('Pagamento pendente',4,'#fb923c'),('Entrega agendada',5,'#a855f7'),('Equipamento em uso',6,'#22c55e'),
            ('Renovação',7,'#0ea5e9'),('Devolução',8,'#f59e0b'),('Vistoria',9,'#10b981'),('Finalizado',10,'#059669')) AS s(name,ord,color)
  ON CONFLICT DO NOTHING;

  WITH p AS (SELECT id FROM public.crm_pipelines WHERE company_id = v_company_id AND name='Assistência Técnica')
  INSERT INTO public.crm_stages (company_id, pipeline_id, name, sort_order, color)
  SELECT v_company_id, p.id, s.name, s.ord, s.color FROM p,
    (VALUES ('Chamado aberto',1,'#94a3b8'),('Triagem',2,'#60a5fa'),('Diagnóstico',3,'#fbbf24'),
            ('Orçamento',4,'#f59e0b'),('Aprovação',5,'#a855f7'),('Manutenção',6,'#0ea5e9'),
            ('Teste',7,'#10b981'),('Finalizado',8,'#22c55e'),('Entregue',9,'#059669')) AS s(name,ord,color)
  ON CONFLICT DO NOTHING;

  WITH p AS (SELECT id FROM public.crm_pipelines WHERE company_id = v_company_id AND name='B2B')
  INSERT INTO public.crm_stages (company_id, pipeline_id, name, sort_order, color)
  SELECT v_company_id, p.id, s.name, s.ord, s.color FROM p,
    (VALUES ('Prospect',1,'#94a3b8'),('Contato',2,'#60a5fa'),('Reunião',3,'#a855f7'),
            ('Orçamento',4,'#fbbf24'),('Negociação',5,'#f59e0b'),('Contrato',6,'#10b981'),
            ('Pedido recorrente',7,'#0ea5e9'),('Carteira ativa',8,'#059669')) AS s(name,ord,color)
  ON CONFLICT DO NOTHING;
END $$;

INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES ('clientes','directory','Diretório',20,'cliente_riomed','RioMed (BO)',10,
        '/admin/clientes/riomed','stethoscope',
        'Tenant RioMed — equipamentos médicos, locação, home care e AT (Bolívia)','super',true)
ON CONFLICT (vertente, group_key, item_key) DO UPDATE SET
  item_label = EXCLUDED.item_label, route = EXCLUDED.route, icon = EXCLUDED.icon,
  description = EXCLUDED.description, enabled = true, updated_at = now();
