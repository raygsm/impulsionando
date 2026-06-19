-- 1) Remove customer.anonymize from recepcao (LGPD anonymization should be
--    restricted to gestor/admin profiles; recepcao is operational front-desk).
DELETE FROM public.profile_permissions
WHERE profile_id = '87e0595a-2cc9-45b5-8df0-4e288b191728'
  AND permission_id = (SELECT id FROM public.permissions WHERE code = 'customer.anonymize');

-- 2) Grant contracts.read to gestor-empresa so tenant managers can view their
--    own contract documents (storage RLS gates by this permission).
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT 'fcaf3905-2f47-4afa-b16e-0844b92706e5', id
FROM public.permissions
WHERE code = 'contracts.read'
ON CONFLICT DO NOTHING;