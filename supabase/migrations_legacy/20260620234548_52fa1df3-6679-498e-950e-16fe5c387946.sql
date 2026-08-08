
INSERT INTO public.core_menu_items (
  id, label, route, icon, audience, scope, sort_order, is_visible, is_system
) VALUES (
  gen_random_uuid(),
  'Novo Tenant',
  '/core/tenants/novo',
  'Building2',
  ARRAY['core']::text[],
  'core',
  25,
  true,
  true
)
ON CONFLICT DO NOTHING;
