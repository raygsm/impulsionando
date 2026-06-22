-- Atualiza número SAC Rio Med para +591 3 3246171 em todas as ocorrências de metadados
UPDATE public.core_tenant_identity
SET metadata = jsonb_set(
      metadata,
      '{phones}',
      to_jsonb(ARRAY['+591 3 3246171','+591 72631063'])
    ),
    updated_at = now()
WHERE subdomain = 'riomed';

-- Substitui ocorrências antigas em strings dentro do JSON (catalog, scripts, etc.)
UPDATE public.core_tenant_identity
SET metadata = (replace(replace(metadata::text,
        '+591 332 461 71', '+591 3 3246171'),
        '+59133246171',    '+59133246171'))::jsonb,
    updated_at = now()
WHERE subdomain = 'riomed';