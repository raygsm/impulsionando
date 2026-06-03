
INSERT INTO public.permissions (code, module, description)
VALUES ('bi.read', 'bi', 'Acessar dashboards consolidados Master/Nicho/Cliente')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, pe.id
FROM public.profiles p
CROSS JOIN public.permissions pe
WHERE pe.code = 'bi.read'
  AND p.slug IN (
    'super-admin-impulsionando',
    'admin-impulsionando',
    'suporte-impulsionando',
    'gestor-empresa',
    'admin-unidade',
    'financeiro',
    'auditor'
  )
ON CONFLICT (profile_id, permission_id) DO NOTHING;
