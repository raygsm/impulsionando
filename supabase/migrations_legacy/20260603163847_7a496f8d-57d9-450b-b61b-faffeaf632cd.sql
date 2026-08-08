
INSERT INTO public.permissions (code, description, module) VALUES
  ('report.read', 'Visualizar relatórios consolidados', 'reports')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE perm.code = 'report.read'
  AND p.slug IN ('admin-impulsionando','admin-unidade','gestor-empresa','financeiro','auditor','suporte-impulsionando')
ON CONFLICT DO NOTHING;
