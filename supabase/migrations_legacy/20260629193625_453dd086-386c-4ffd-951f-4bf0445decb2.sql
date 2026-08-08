
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando', 'catalogo_produto', 'Catálogo & Produto', 20, 'flags_tenants', 'Flags por Tenant', 22, '/admin/flags-tenants', 'ToggleRight', 'Overrides de feature flags por cliente', 'staff', true
WHERE NOT EXISTS (SELECT 1 FROM public.core_admin_menu WHERE route = '/admin/flags-tenants');
