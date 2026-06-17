
-- 1) Nicho
INSERT INTO public.niches (slug, name, description, icon, is_active)
VALUES (
  'contabilidade-inteligente',
  'Contabilidade Inteligente',
  'Camada inteligente para escritórios de contabilidade: CRM, portal do cliente, documentos, obrigações, prazos, atendimento e BI — complementar aos sistemas contábeis tradicionais.',
  'Calculator',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true;

-- 2) Módulos
INSERT INTO public.modules (
  slug, name, description, icon, category, is_core, is_active, sort_order,
  status_tecnico, status_comercial, readiness_status,
  monthly_price, setup_fee, show_in_demo
) VALUES
  ('contab-crm','CRM Contábil','Leads, clientes, funis comerciais e de onboarding, follow-up e oportunidades de upsell para escritórios contábeis.','Users','Atendimento & Comunicação',false,true,10,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-portal-cliente','Portal do Cliente','Área exclusiva para o cliente do escritório acompanhar pendências, enviar documentos, ver guias e abrir solicitações.','Globe','Atendimento & Comunicação',false,true,20,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-documentos','Gestão de Documentos','Centraliza documentos recebidos, pendentes, recusados e arquivados, com categorias, status e trilha de auditoria.','FolderOpen','Operação',false,true,30,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-cobranca-docs','Cobrança Inteligente de Documentos','Régua automática D-7, D-3, D-1, D0 e atraso para clientes que não enviaram documentos, com histórico protegido.','BellRing','Atendimento & Comunicação',false,true,40,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-calendario-fiscal','Calendário Fiscal e Trabalhista','Agenda configurável de obrigações por cliente, regime tributário e departamento, com risco de atraso e responsáveis.','CalendarClock','Operação',false,true,50,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-irpf','Imposto de Renda PF','Jornada completa de IRPF: checklist, documentos, pendências, revisão, transmissão e acompanhamento de restituição.','FileText','Operação',false,true,60,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-atendimento-wpp','Atendimento Inteligente WhatsApp','Triagem por intenção e departamento (fiscal, DP, contábil, IRPF, comercial), consultas e abertura de chamados pelo WhatsApp.','MessageCircle','Atendimento & Comunicação',false,true,70,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-tarefas','Tarefas Internas Contábeis','Kanban, fila e calendário de tarefas por cliente, obrigação e departamento, com SLA e gargalos.','ListChecks','Operação',false,true,80,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-bi','BI Contábil','Dashboards do escritório: pendências, obrigações, SLA, produtividade, clientes críticos e oportunidades.','BarChart3','Gestão, Dados e Segurança',false,true,90,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-financeiro','Financeiro do Escritório','Honorários, mensalidades, serviços avulsos, boletos, PIX, inadimplência e relatórios financeiros do escritório.','Wallet','Vendas e Pagamentos',false,true,100,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-contratos-onboarding','Contratos & Onboarding','Propostas, contratos, assinatura, checklist documental e jornada de implantação de novos clientes.','FileSignature','Operação',false,true,110,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true),
  ('contab-comercial','Comercial & Marketing Contábil','Captação de leads, campanhas de IR, abertura de empresa, troca de contador, MEI e régua comercial.','Megaphone','Crescimento',false,true,120,'em_desenvolvimento','exclusivo_interno','em_desenvolvimento',197.99,197.99,true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 3) Vínculo nicho ↔ módulos
WITH n AS (SELECT id FROM public.niches WHERE slug = 'contabilidade-inteligente')
INSERT INTO public.core_niche_modules (niche_id, module_slug, is_recommended, is_optional, sort_order)
SELECT n.id, m.slug, true, m.optional, m.ord
FROM n,
(VALUES
  ('contab-crm', false, 10),
  ('contab-portal-cliente', false, 20),
  ('contab-documentos', false, 30),
  ('contab-calendario-fiscal', false, 40),
  ('contab-cobranca-docs', true, 50),
  ('contab-irpf', true, 60),
  ('contab-atendimento-wpp', true, 70),
  ('contab-tarefas', true, 80),
  ('contab-bi', true, 90),
  ('contab-financeiro', true, 100),
  ('contab-contratos-onboarding', true, 110),
  ('contab-comercial', true, 120)
) AS m(slug, optional, ord)
ON CONFLICT (niche_id, module_slug) DO UPDATE SET
  is_optional = EXCLUDED.is_optional,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 4) Menus do cockpit contábil (escopo niche, visíveis somente no nicho)
SELECT public._seed_menu_item('contab.dashboard','Cockpit Contábil','LayoutDashboard','/contabilidade/cockpit',10,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.clients','Clientes Contábeis','Users','/contabilidade/clientes',20,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.documents','Documentos','FolderOpen','/contabilidade/documentos',30,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.obligations','Obrigações','ClipboardList','/contabilidade/obrigacoes',40,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.calendar','Calendário Fiscal','CalendarClock','/contabilidade/calendario',50,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.tasks','Tarefas','ListChecks','/contabilidade/tarefas',60,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.attendance','Atendimento','MessageCircle','/contabilidade/atendimento',70,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.irpf','Imposto de Renda PF','FileText','/contabilidade/irpf',80,'niche',ARRAY['owner','manager','staff'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.finance','Financeiro','Wallet','/contabilidade/financeiro',90,'niche',ARRAY['owner','manager'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.contracts','Contratos','FileSignature','/contabilidade/contratos',100,'niche',ARRAY['owner','manager'],ARRAY['contabilidade-inteligente']);
SELECT public._seed_menu_item('contab.reports','Relatórios','BarChart3','/contabilidade/relatorios',110,'niche',ARRAY['owner','manager'],ARRAY['contabilidade-inteligente']);
