
INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES
  ('impulsionando', 'platform', 'Plataforma & Infra', 2, 'status_subscribers', 'Inscritos do Status', 50, '/admin/status-subscribers', 'Mail', 'Gestão de inscrições da página pública /status e broadcasts manuais', true),
  ('impulsionando', 'platform', 'Plataforma & Infra', 2, 'maintenance', 'Janelas de Manutenção', 55, '/admin/maintenance', 'CalendarClock', 'Programação e divulgação de manutenções na página pública /status', true)
ON CONFLICT DO NOTHING;
