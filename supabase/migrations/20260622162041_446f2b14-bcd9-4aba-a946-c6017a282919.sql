INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES ('clientes','directory','Diretório',20,'cliente_riomed_assistente','RioMed · Assistente',11,
        '/admin/clientes/riomed/assistente','bot',
        'Prompt operacional e catálogo por audiência do assistente virtual RioMed (es-BO)','super',true)
ON CONFLICT (vertente, group_key, item_key) DO UPDATE SET
  item_label = EXCLUDED.item_label, route = EXCLUDED.route, icon = EXCLUDED.icon,
  description = EXCLUDED.description, enabled = true, updated_at = now();