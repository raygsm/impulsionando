INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES ('impulsionando','seguranca','Segurança & Governança',60,'tenant_lifecycle','Lifecycle de Tenants',40,'/admin/lifecycle','Archive','Provisionar, suspender, reativar e arquivar tenants com auditoria.',true)
ON CONFLICT DO NOTHING;