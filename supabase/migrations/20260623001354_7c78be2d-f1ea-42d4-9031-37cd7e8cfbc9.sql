
CREATE TABLE IF NOT EXISTS public.riomed_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  sector TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_role_templates TO authenticated;
GRANT ALL ON public.riomed_role_templates TO service_role;
ALTER TABLE public.riomed_role_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "riomed_role_templates_read" ON public.riomed_role_templates;
CREATE POLICY "riomed_role_templates_read"
  ON public.riomed_role_templates FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );
DROP POLICY IF EXISTS "riomed_role_templates_admin_write" ON public.riomed_role_templates;
CREATE POLICY "riomed_role_templates_admin_write"
  ON public.riomed_role_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS riomed_role_templates_set_updated ON public.riomed_role_templates;
CREATE TRIGGER riomed_role_templates_set_updated
  BEFORE UPDATE ON public.riomed_role_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.riomed_role_templates (code, label, sector, scopes, description, is_system, display_order)
VALUES
  ('admin_core',    'Admin Core',            'core',       ARRAY['*'],                                                          'Acesso total ao Core Impulsionando.', true, 0),
  ('suporte_impuls','Suporte Impulsionando', 'core',       ARRAY['support.read','support.respond','tenant.read'],               'Equipe de suporte com acesso de leitura e atendimento.', true, 1),
  ('admin_riomed', 'Admin RioMed',           'gestao',     ARRAY['riomed.*'],                                                   'Administrador do tenant RioMed.', true, 2),
  ('diretor',      'Diretor',                'gestao',     ARRAY['riomed.dashboard.*','riomed.report.*','riomed.finance.read'], 'Visão executiva de todos os dashboards e relatórios.', true, 3),
  ('gerente',      'Gerente',                'gestao',     ARRAY['riomed.dashboard.read','riomed.team.manage','riomed.report.read'], 'Gestão de equipes e operações.', true, 4),
  ('vendedor',     'Vendedor',               'comercial',  ARRAY['riomed.quote.*','riomed.customer.*','riomed.commission.read'],'Acesso ao funil comercial e às próprias comissões.', true, 5),
  ('atendimento',  'Atendimento',            'comercial',  ARRAY['riomed.lead.*','riomed.message.send','riomed.customer.read'], 'SDR / atendimento ao cliente.', true, 6),
  ('estoque',      'Estoque',                'estoque',    ARRAY['riomed.stock.*','riomed.product.read','riomed.warehouse.*'],  'Controle de estoque e armazéns.', true, 7),
  ('financeiro',   'Financeiro',             'financeiro', ARRAY['riomed.invoice.*','riomed.payment.*','riomed.fiscal.*'],      'Faturamento, cobrança e fiscal.', true, 8),
  ('tecnico',      'Técnico',                'tecnico',    ARRAY['riomed.os.*','riomed.maintenance.*','riomed.rental.read'],    'Assistência técnica.', true, 9),
  ('logistica',    'Logística',              'logistica',  ARRAY['riomed.shipping.*','riomed.order.dispatch','riomed.route.*'], 'Operação de fretes e despachos.', true, 10),
  ('marketing',    'Marketing',              'marketing',  ARRAY['riomed.campaign.*','riomed.lead.read','riomed.template.*'],   'Campanhas, jornadas e templates.', true, 11),
  ('visualizador', 'Visualizador',           'gestao',     ARRAY['riomed.dashboard.read'],                                       'Acesso somente leitura aos dashboards.', true, 12)
ON CONFLICT (company_id, code) DO NOTHING;

ALTER TABLE public.mp_suppliers DROP CONSTRAINT IF EXISTS mp_suppliers_supplier_type_check;
ALTER TABLE public.mp_suppliers ADD CONSTRAINT mp_suppliers_supplier_type_check
  CHECK (supplier_type IN (
    'microcervejaria','distribuidor','vinicola','cafe_especial','destilaria','alimentos_artesanais',
    'medico_hospitalar','equipamentos_medicos','farmacia','outros'
  ));

INSERT INTO public.mp_suppliers (company_id, supplier_type, display_name, description, status)
SELECT c.id, 'medico_hospitalar', COALESCE(c.name,'RioMed'),
       'Equipamentos e suprimentos médico-hospitalares — venda e locação.', 'active'
FROM public.companies c
WHERE lower(c.name) LIKE 'riomed%'
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT * FROM (VALUES
  ('clientes','riomed','RioMed',10,'riomed_dashboards','Dashboards RioMed',20,'/admin/clientes/riomed/dashboards','LayoutDashboard','Hub consolidado por área: geral, comercial, estoque, marketing, locação, AT, Core.','admin',true),
  ('clientes','riomed','RioMed',10,'riomed_permissoes','Perfis & Permissões',21,'/admin/clientes/riomed/permissoes','ShieldCheck','13 perfis de sistema e atribuição a usuários.','admin',true),
  ('clientes','riomed','RioMed',10,'riomed_marketplace','Marketplace RioMed',22,'/admin/clientes/riomed/marketplace','Store','Publicação no Marketplace Impulsionando (categoria Médico-hospitalar).','admin',true)
) AS v(vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_admin_menu m
  WHERE m.vertente = v.vertente AND m.item_key = v.item_key
);
