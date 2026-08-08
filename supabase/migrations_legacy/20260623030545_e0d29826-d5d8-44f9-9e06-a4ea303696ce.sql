
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES ('clientes', 'visao', 'Visão Geral', 1, 'riomed-master-dashboard', 'Dashboard MASTER', 1, '/admin/clientes/riomed/master-dashboard', 'Crown', 'Visão total Rio Med com switch de persona (vendedor/gerente/técnico/financeiro)', 'admin', true)
ON CONFLICT DO NOTHING;
