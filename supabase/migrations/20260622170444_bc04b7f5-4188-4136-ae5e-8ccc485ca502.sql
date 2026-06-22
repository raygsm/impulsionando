-- Grava logo oficial Rio Med na identidade do tenant e na empresa
UPDATE public.core_tenant_identity
SET metadata = jsonb_set(metadata, '{logo_url}', to_jsonb('/__l5e/assets-v1/4066b94d-f9a6-431a-81f4-82a420c64bc3/riomed-logo.png'::text)),
    updated_at = now()
WHERE subdomain = 'riomed';

UPDATE public.companies
SET logo_url = '/__l5e/assets-v1/4066b94d-f9a6-431a-81f4-82a420c64bc3/riomed-logo.png',
    updated_at = now()
WHERE id = (SELECT company_id FROM public.core_tenant_identity WHERE subdomain='riomed');