INSERT INTO public.core_menu_items (
  id, label, route, icon, audience, scope, sort_order, is_visible, is_system
) VALUES (
  gen_random_uuid(),
  'Domínios & Convites',
  '/core/tenants/dominios',
  'Globe',
  ARRAY['core']::text[],
  'core',
  26,
  true,
  true
)
ON CONFLICT DO NOTHING;