
-- Idempotent seed marker
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_menu_items_seed_key
  ON public.core_menu_items (((metadata->>'seed_key')))
  WHERE metadata ? 'seed_key';

-- Helper to upsert a menu item by seed_key
CREATE OR REPLACE FUNCTION public._seed_menu_item(
  _seed_key text,
  _label text,
  _icon text,
  _route text,
  _sort integer,
  _scope text,
  _audience text[],
  _niche_slugs text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.core_menu_items(
    label, icon, route, sort_order, scope, audience, niche_slugs, is_system, metadata
  ) VALUES (
    _label, _icon, _route, _sort, _scope, _audience, _niche_slugs, true,
    jsonb_build_object('seed_key', _seed_key)
  )
  ON CONFLICT ((metadata->>'seed_key')) WHERE metadata ? 'seed_key'
  DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route,
    sort_order = EXCLUDED.sort_order,
    scope = EXCLUDED.scope,
    audience = EXCLUDED.audience,
    niche_slugs = EXCLUDED.niche_slugs,
    updated_at = now();
END;
$$;

-- === SUPER ADMIN ===
SELECT public._seed_menu_item('sa.dashboard','Visão geral','LayoutDashboard','/core',10,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.empresas','Empresas','Building2','/companies',20,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.modulos','Módulos','Boxes','/core/modulos',30,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.planos','Planos','CreditCard','/core/planos',40,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.trials','Trials','Sparkles','/admin/trials',50,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.billing','Cobrança','Wallet','/admin/billing',60,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.bi','BI Master','LineChart','/bi/master',70,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.uptime','Uptime','Activity','/admin/uptime',80,'core',ARRAY['super_admin'],'{}');
SELECT public._seed_menu_item('sa.audit','Auditoria','ShieldCheck','/audit',90,'core',ARRAY['super_admin'],'{}');

-- === WHITE LABEL ===
SELECT public._seed_menu_item('wl.dashboard','Visão geral','LayoutDashboard','/core',10,'wl',ARRAY['white_label'],'{}');
SELECT public._seed_menu_item('wl.clientes','Clientes','Building2','/core/clientes',20,'wl',ARRAY['white_label'],'{}');
SELECT public._seed_menu_item('wl.implantacoes','Implantações','Wrench','/core/implantacoes',30,'wl',ARRAY['white_label'],'{}');
SELECT public._seed_menu_item('wl.financeiro','Financeiro','Wallet','/core/financeiro-master',40,'wl',ARRAY['white_label'],'{}');
SELECT public._seed_menu_item('wl.bi','BI da rede','LineChart','/bi/niches',50,'wl',ARRAY['white_label'],'{}');
SELECT public._seed_menu_item('wl.marketing','Marketing','Megaphone','/core/marketing-leads',60,'wl',ARRAY['white_label'],'{}');

-- === EMPRESA (base, todos os nichos) ===
SELECT public._seed_menu_item('co.dashboard','Visão geral','LayoutDashboard','/dashboard',10,'company',ARRAY['company'],'{}');
SELECT public._seed_menu_item('co.financeiro','Financeiro','Wallet','/finance',80,'company',ARRAY['company'],'{}');
SELECT public._seed_menu_item('co.bi','Relatórios','LineChart','/reports',90,'company',ARRAY['company'],'{}');
SELECT public._seed_menu_item('co.crm','CRM','Users','/crm',60,'company',ARRAY['company'],'{}');
SELECT public._seed_menu_item('co.settings','Configurações','Settings','/settings',100,'company',ARRAY['company'],'{}');

-- === EMPRESA: específicos por nicho ===
-- Clínicas
SELECT public._seed_menu_item('co.clinicas.agenda','Agenda','CalendarCheck','/agenda',20,'company',ARRAY['company'],ARRAY['clinicas']);
SELECT public._seed_menu_item('co.clinicas.pacientes','Pacientes','Heart','/customers',30,'company',ARRAY['company'],ARRAY['clinicas']);
SELECT public._seed_menu_item('co.clinicas.prontuario','Prontuários','FileText','/ehr',40,'company',ARRAY['company'],ARRAY['clinicas']);
-- Bares
SELECT public._seed_menu_item('co.bares.pdv','PDV','ShoppingCart','/sales',20,'company',ARRAY['company'],ARRAY['bares']);
SELECT public._seed_menu_item('co.bares.estoque','Estoque','Boxes','/inventory',30,'company',ARRAY['company'],ARRAY['bares']);
SELECT public._seed_menu_item('co.bares.reservas','Reservas','CalendarCheck','/agenda',40,'company',ARRAY['company'],ARRAY['bares']);
-- Microcervejarias
SELECT public._seed_menu_item('co.brew.producao','Produção','Beer','/inventory',20,'company',ARRAY['company'],ARRAY['microcervejarias']);
SELECT public._seed_menu_item('co.brew.estoque','Estoque','Boxes','/inventory/products',30,'company',ARRAY['company'],ARRAY['microcervejarias']);
SELECT public._seed_menu_item('co.brew.b2b','Vendas B2B','ShoppingCart','/sales',40,'company',ARRAY['company'],ARRAY['microcervejarias']);
-- Serviços
SELECT public._seed_menu_item('co.serv.os','Ordens de Serviço','Wrench','/agenda/appointments',20,'company',ARRAY['company'],ARRAY['servicos']);
SELECT public._seed_menu_item('co.serv.tecnicos','Técnicos','Users','/agenda/professionals',30,'company',ARRAY['company'],ARRAY['servicos']);
SELECT public._seed_menu_item('co.serv.orcamentos','Orçamentos','FileText','/orcamento',40,'company',ARRAY['company'],ARRAY['servicos']);
-- E-commerce
SELECT public._seed_menu_item('co.ec.pedidos','Pedidos','ShoppingCart','/sales/orders',20,'company',ARRAY['company'],ARRAY['ecommerce']);
SELECT public._seed_menu_item('co.ec.catalogo','Catálogo','Boxes','/inventory/products',30,'company',ARRAY['company'],ARRAY['ecommerce']);
SELECT public._seed_menu_item('co.ec.marketing','Marketing','Megaphone','/marketing/leads',40,'company',ARRAY['company'],ARRAY['ecommerce']);

-- === CONSUMIDOR ===
SELECT public._seed_menu_item('cn.dashboard','Início','Home','/consumidor',10,'consumer',ARRAY['consumer'],'{}');
SELECT public._seed_menu_item('cn.clinicas.consultas','Minhas consultas','CalendarCheck','/paciente',20,'consumer',ARRAY['consumer'],ARRAY['clinicas']);
SELECT public._seed_menu_item('cn.bares.fidelidade','Fidelidade','Sparkles','/consumidor',20,'consumer',ARRAY['consumer'],ARRAY['bares']);
SELECT public._seed_menu_item('cn.brew.clube','Clube da cervejaria','Beer','/consumidor',20,'consumer',ARRAY['consumer'],ARRAY['microcervejarias']);
SELECT public._seed_menu_item('cn.serv.os','Minhas OS','Wrench','/consumidor',20,'consumer',ARRAY['consumer'],ARRAY['servicos']);
SELECT public._seed_menu_item('cn.ec.pedidos','Meus pedidos','ShoppingCart','/consumidor',20,'consumer',ARRAY['consumer'],ARRAY['ecommerce']);

-- === Função: menu para audiência + nicho ===
CREATE OR REPLACE FUNCTION public.get_menu_for_audience(
  _audience text,
  _niche_slug text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  label text,
  icon text,
  route text,
  sort_order integer,
  scope text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT m.id, m.label, m.icon, m.route, m.sort_order, m.scope
  FROM public.core_menu_items m
  WHERE m.is_visible = true
    AND _audience = ANY (m.audience)
    AND (
      cardinality(m.niche_slugs) = 0
      OR (_niche_slug IS NOT NULL AND _niche_slug = ANY (m.niche_slugs))
    )
  ORDER BY m.sort_order, m.label;
$$;

GRANT EXECUTE ON FUNCTION public.get_menu_for_audience(text, text) TO authenticated, anon;
