ALTER TABLE public.core_incidents
  ADD COLUMN IF NOT EXISTS postmortem_summary text,
  ADD COLUMN IF NOT EXISTS postmortem_root_cause text,
  ADD COLUMN IF NOT EXISTS postmortem_impact text,
  ADD COLUMN IF NOT EXISTS postmortem_mitigation text,
  ADD COLUMN IF NOT EXISTS postmortem_lessons text,
  ADD COLUMN IF NOT EXISTS postmortem_action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS postmortem_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS postmortem_author uuid;

INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES ('impulsionando', 'seguranca_governanca', 'Segurança & Governança', 90, 'postmortems', 'Postmortems', 96, '/admin/postmortems', 'FileText', 'Postmortems de incidentes resolvidos (resumo, causa raiz, ações).', 'staff', true)
ON CONFLICT DO NOTHING;