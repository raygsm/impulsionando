INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando','operacao','Operação & Logística',6,'cockpit_automacoes','Cockpit de Automações',6,
       '/admin/operacoes-automacoes','Workflow',
       'Workflows N8N (reenfileirar), feature flags do Core e inspetor de webhooks com replay.',
       'admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_admin_menu
  WHERE vertente='impulsionando' AND item_key='cockpit_automacoes'
);