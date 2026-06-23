
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES ('clientes', 'operacoes', 'Operações', 30, 'riomed-pos-z', 'Relatório Z/X POS', 71, '/admin/clientes/riomed/pos-relatorio', 'FileBarChart', 'Fechamento diário do caixa físico Rio Med (BOB) com exportação CSV', true)
ON CONFLICT DO NOTHING;
