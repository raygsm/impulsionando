INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES ('impulsionando','seguranca','Segurança & Governança',60,'rbac_tenants','RBAC por Tenant',30,'/admin/rbac','Shield','Gerencie papéis (user_roles) de cada usuário em cada tenant.',true)
ON CONFLICT DO NOTHING;