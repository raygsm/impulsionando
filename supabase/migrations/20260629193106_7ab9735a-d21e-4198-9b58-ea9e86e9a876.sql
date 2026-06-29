
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando', 'security', 'Segurança & Governança', 90, 'impersonation_audit', 'Auditoria de Impersonação', 50, '/admin/impersonation-audit', 'ShieldAlert', 'Log de início/encerramento de impersonações', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM public.core_admin_menu WHERE route = '/admin/impersonation-audit');
