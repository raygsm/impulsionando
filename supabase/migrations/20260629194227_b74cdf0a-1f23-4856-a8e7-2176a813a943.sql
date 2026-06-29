
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando', 'financeiro', 'Financeiro', 30, 'faturamento_unificado', 'Faturamento Unificado', 5, '/admin/faturamento', 'DollarSign', 'MRR, contratos e faturas cross-tenant', 'staff', true
WHERE NOT EXISTS (SELECT 1 FROM public.core_admin_menu WHERE route = '/admin/faturamento');
