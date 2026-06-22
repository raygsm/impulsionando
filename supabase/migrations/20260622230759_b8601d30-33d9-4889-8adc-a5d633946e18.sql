
ALTER TABLE public.core_tenant_identity
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS published_commit text;

UPDATE public.core_tenant_identity
SET
  published_at = COALESCE(
    published_at,
    NULLIF(metadata->>'published_at','')::timestamp with time zone
  ),
  published_commit = COALESCE(
    published_commit,
    NULLIF(metadata->>'published_commit','')
  )
WHERE metadata ? 'published_at' OR metadata ? 'published_commit';
