INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES ('impulsionando','master','Visão Master',1,'exec_cockpit','Dashboard Executivo',1,'/admin/executivo','Sparkles','Cockpit-mestre cross-tenant com KPIs consolidados (receita, base, conversão, churn, N8N).',true)
ON CONFLICT DO NOTHING;