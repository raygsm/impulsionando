
INSERT INTO public.core_menu_items (
  id, label, route, icon, audience, scope, sort_order, is_visible, is_system
) VALUES (
  gen_random_uuid(),
  'BI Ecossistema',
  '/core/bi-ecossistema',
  'BarChart3',
  ARRAY['core']::text[],
  'core',
  20,
  true,
  true
)
ON CONFLICT DO NOTHING;
