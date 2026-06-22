-- core_admin_menu: árvore parametrizável de navegação master
CREATE TABLE public.core_admin_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertente text NOT NULL CHECK (vertente IN ('impulsionando','clientes')),
  group_key text NOT NULL,
  group_label text NOT NULL,
  group_order int NOT NULL DEFAULT 0,
  item_key text NOT NULL,
  item_label text NOT NULL,
  item_order int NOT NULL DEFAULT 0,
  route text NOT NULL,
  icon text,
  description text,
  required_role text DEFAULT 'super',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertente, group_key, item_key)
);

GRANT SELECT ON public.core_admin_menu TO authenticated;
GRANT ALL ON public.core_admin_menu TO service_role;

ALTER TABLE public.core_admin_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lê menu admin"
  ON public.core_admin_menu FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff escreve menu admin"
  ON public.core_admin_menu FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TRIGGER trg_core_admin_menu_updated
  BEFORE UPDATE ON public.core_admin_menu
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial: vertente IMPULSIONANDO
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description) VALUES
('impulsionando','master','Visão Master',1,'overview','Overview Executivo',1,'/admin/master','LayoutDashboard','MRR, ARR, GMV, churn, NPS, uptime global'),
('impulsionando','master','Visão Master',1,'cohort','Cohort & Retention',2,'/admin/cohort-retention','LineChart','Análise de coortes'),
('impulsionando','master','Visão Master',1,'unit-eco','Unit Economics',3,'/admin/unit-economics','TrendingUp','CAC, LTV, payback'),
('impulsionando','master','Visão Master',1,'health','Health Score Global',4,'/admin/health-score','Activity','Saúde consolidada por tenant'),
('impulsionando','platform','Plataforma & Infra',2,'observabilidade','Observabilidade',1,'/core/observabilidade','Server','SLO, uptime, runtime'),
('impulsionando','platform','Plataforma & Infra',2,'uptime','Uptime',2,'/admin/uptime','Activity','Monitoramento de endpoints'),
('impulsionando','platform','Plataforma & Infra',2,'dominios','Domínios & Subdomínios',3,'/core/dominios','Globe','DNS e custom domains'),
('impulsionando','platform','Plataforma & Infra',2,'diagnostico','Diagnóstico Geral',4,'/core/diagnostico-geral','Gauge','Health da plataforma'),
('impulsionando','integrations','Integrações & Credenciais',3,'cofre','Cofre de Credenciais',1,'/admin/cofre-credenciais','ShieldCheck','Status mascarado (nunca exibe valor)'),
('impulsionando','integrations','Integrações & Credenciais',3,'mp','Mercado Pago',2,'/admin/integracoes/mercado-pago','Wallet','Status, webhook, link externo'),
('impulsionando','integrations','Integrações & Credenciais',3,'n8n','n8n',3,'/admin/n8n-console','Workflow','Console e execuções'),
('impulsionando','integrations','Integrações & Credenciais',3,'webhooks','Webhooks',4,'/admin/inbox-eventos','Activity','Inbox de eventos'),
('impulsionando','security','Segurança & Governança',4,'audit','Audit Trail',1,'/admin/audit-trail','ShieldCheck','Trilha de auditoria global'),
('impulsionando','security','Segurança & Governança',4,'lgpd','LGPD',2,'/admin/governance-lgpd-health','ShieldCheck','Consents, exports, deleções'),
('impulsionando','security','Segurança & Governança',4,'security','Segurança & Compliance',3,'/admin/security-compliance','ShieldCheck','RLS, vulnerabilidades'),
('impulsionando','security','Segurança & Governança',4,'sla','SLA Compliance',4,'/admin/sla-compliance','ShieldCheck','Cumprimento de SLA'),
('impulsionando','erp','ERP Impulsionando',5,'erp','ERP Financeiro',1,'/erp-financeiro','Wallet','DRE, fluxo de caixa, conciliação'),
('impulsionando','erp','ERP Impulsionando',5,'billing','Billing & Régua',2,'/admin/billing','CreditCard','Cobranças e inadimplência'),
('impulsionando','erp','ERP Impulsionando',5,'contracts','Contratos Recorrentes',3,'/admin/billing-contracts','ScrollText','Contratos ativos'),
('impulsionando','erp','ERP Impulsionando',5,'pix','PIX Pendentes',4,'/admin/pix-pendentes','QrCode','Pagamentos pendentes'),
('impulsionando','erp','ERP Impulsionando',5,'repasses','Repasses',5,'/core/repasses','ArrowLeftRight','Payouts a fornecedores/afiliados'),
('impulsionando','erp','ERP Impulsionando',5,'treasury','Treasury Forecast',6,'/admin/treasury-forecast','Banknote','Projeção de caixa'),
('impulsionando','catalog','Catálogo & Produto',6,'modulos','Catálogo de Módulos',1,'/core/modulos','Boxes','Módulos globais e versionamento'),
('impulsionando','catalog','Catálogo & Produto',6,'planos','Catálogo de Planos',2,'/core/planos','BadgeDollarSign','Planos por nicho'),
('impulsionando','catalog','Catálogo & Produto',6,'niche-plans','Planos por Nicho',3,'/admin/niche-plans','Tags','Configuração por nicho'),
('impulsionando','catalog','Catálogo & Produto',6,'templates','Templates Globais',4,'/core/templates','FileCode','Templates de mensagem e página'),
('impulsionando','catalog','Catálogo & Produto',6,'flags','Feature Flags',5,'/core/flags','Flag','Toggles por tenant'),
('impulsionando','catalog','Catálogo & Produto',6,'releases','Releases',6,'/core/releases','RefreshCw','Versionamento e publicação'),
('impulsionando','growth','Comercial & Crescimento',7,'leads','Leads do Site',1,'/marketing/leads','Inbox','Leads inbound'),
('impulsionando','growth','Comercial & Crescimento',7,'funil','Funil 360°',2,'/admin/funil-360','Filter','Conversão ponta-a-ponta'),
('impulsionando','growth','Comercial & Crescimento',7,'marketplace','Marketplace Master',3,'/admin/marketplace-ops','TrendingUp','GMV e taxa global'),
('impulsionando','growth','Comercial & Crescimento',7,'demos','Demos & Insights',4,'/core/demos','FlaskConical','Pré-venda'),
('impulsionando','growth','Comercial & Crescimento',7,'briefings','Briefings',5,'/core/briefings','ClipboardList','Discovery comercial');

-- Seed inicial: vertente CLIENTES
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description) VALUES
('clientes','directory','Diretório de Tenants',1,'list','Todos os Tenants',1,'/companies','Building2','Lista canônica de clientes'),
('clientes','directory','Diretório de Tenants',1,'cockpit','Cockpit de Tenants',2,'/admin/cockpit-tenants','Building2','Visão consolidada'),
('clientes','directory','Diretório de Tenants',1,'wl','White-Label Tenants',3,'/admin/white-label-tenants','Layers','Marcas WL'),
('clientes','lifecycle','Ciclo de Vida',2,'novo','Novo Tenant',1,'/core/tenants/novo','Plus','Wizard de provisionamento'),
('clientes','lifecycle','Ciclo de Vida',2,'importar','Importar em Lote',2,'/core/importar-clientes','UserPlus','Migração de clientes'),
('clientes','lifecycle','Ciclo de Vida',2,'implantacoes','Implantações',3,'/core/implantacoes','Rocket','Onboarding em andamento'),
('clientes','lifecycle','Ciclo de Vida',2,'trials','Trials (7d)',4,'/admin/trials','Sparkles','Período de avaliação'),
('clientes','operation','Operação por Tenant',3,'modules','Módulos',1,'/modules','Boxes','Módulos por tenant'),
('clientes','operation','Operação por Tenant',3,'users','Usuários',2,'/users','Users','Usuários por tenant'),
('clientes','operation','Operação por Tenant',3,'permissions','Permissões',3,'/access-profiles','KeyRound','Perfis e overrides'),
('clientes','operation','Operação por Tenant',3,'automations','Automações n8n',4,'/core/integracoes/n8n','Workflow','Fluxos por tenant'),
('clientes','financial','Financeiro do Cliente',4,'consolidado','Financeiro Consolidado',1,'/core/financeiro-consolidado','Banknote','Faturamento por cliente'),
('clientes','financial','Financeiro do Cliente',4,'commissions','Comissões por Cliente',2,'/admin/customer-success','Percent','Comissões e repasses'),
('clientes','financial','Financeiro do Cliente',4,'churn','Churn Radar',3,'/admin/churn-radar','ShieldCheck','Risco de cancelamento'),
('clientes','financial','Financeiro do Cliente',4,'expansion','Expansion & Upsell',4,'/admin/expansion-engine','Rocket','Oportunidades de expansão'),
('clientes','customize','Conteúdo & Personalização',5,'menus','Menus & Navegação',1,'/core/menus','Layers','Menus por cliente'),
('clientes','customize','Conteúdo & Personalização',5,'paginas','Páginas de Marketing',2,'/core/marketing-pages','FileCode','Páginas customizadas'),
('clientes','customize','Conteúdo & Personalização',5,'params','Parâmetros do Core',3,'/core/parametros','SettingsIcon','Settings por cliente'),
('clientes','customize','Conteúdo & Personalização',5,'reguas','Réguas de Funil',4,'/admin/funil-reguas','Workflow','Réguas por nicho'),
('clientes','audience','Inteligência de Público',6,'observa','Conversion Funnel',1,'/admin/conversion-funnel','Filter','Conversão por tenant'),
('clientes','audience','Inteligência de Público',6,'feira','Feira de Leads',2,'/core/feira-leads','Store','Leads B2B'),
('clientes','audience','Inteligência de Público',6,'pricing','Pricing Intelligence',3,'/admin/pricing-intelligence','BadgeDollarSign','Análise de preço'),
('clientes','audience','Inteligência de Público',6,'dq','Data Quality & Dedupe',4,'/admin/data-quality','Copy','Qualidade dos dados');