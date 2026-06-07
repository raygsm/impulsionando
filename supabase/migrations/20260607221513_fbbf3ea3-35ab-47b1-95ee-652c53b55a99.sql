UPDATE public.modules
SET readiness_status = 'certificado',
    certified_at = now(),
    certified_by = (SELECT user_id FROM public.user_profiles up
                    JOIN public.profiles p ON p.id = up.profile_id
                    WHERE p.slug = 'super-admin-impulsionando' AND up.is_active = true
                    ORDER BY up.created_at LIMIT 1),
    current_version = COALESCE(current_version, '1.0.0'),
    last_version_at = COALESCE(last_version_at, now()),
    updated_at = now()
WHERE is_active = true;

INSERT INTO public.module_versions (module_id, version, released_at, notes, released_by)
SELECT m.id, '1.0.0', now(),
       'Versão inicial certificada para produção.',
       (SELECT user_id FROM public.user_profiles up
        JOIN public.profiles p ON p.id = up.profile_id
        WHERE p.slug = 'super-admin-impulsionando' AND up.is_active = true
        ORDER BY up.created_at LIMIT 1)
FROM public.modules m
WHERE m.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.module_versions mv WHERE mv.module_id = m.id AND mv.version = '1.0.0');