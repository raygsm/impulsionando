-- Staging-only patch: Phase 4 tenant resolve + Phase 3 support_ticket_seq (operator apply)
-- Target project: aamorcqznimmleafavai (STAGING — never prod arygtqrdpcdkwnuwsgmm)
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- Or: DATABASE_URL=postgresql://... npm run staging:apply:db-patch

-- ── 1. companies columns (CRM restore may lack branding fields) ─────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Backfill domain from subdomain where missing (impulsionando hosts)
UPDATE public.companies
SET domain = subdomain || '.impulsionando.com.br',
    updated_at = now()
WHERE subdomain IS NOT NULL
  AND subdomain <> ''
  AND (domain IS NULL OR domain = '');

-- ── 2. resolve_tenant_by_host RPC ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_tenant_by_host(_host text)
RETURNS TABLE (
  id uuid,
  name text,
  subdomain text,
  domain text,
  primary_color text,
  secondary_color text,
  logo_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.subdomain,
    c.domain,
    c.primary_color,
    c.secondary_color,
    c.logo_url,
    c.is_active
  FROM public.companies c
  WHERE c.is_active = true
    AND _host IS NOT NULL
    AND (
      lower(c.domain) = lower(_host)
      OR lower(c.subdomain) = lower(split_part(_host, '.', 1))
    )
  ORDER BY (lower(c.domain) = lower(_host)) DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_tenant_by_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO anon, authenticated, service_role;

-- ── 3. support_ticket_seq GRANT (Phase 3 optional fix) ──────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'support_ticket_seq' AND c.relkind = 'S'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_seq TO service_role;
  END IF;
END $$;

-- ── 4. PostgREST schema cache reload (Supabase) ─────────────────────────────
NOTIFY pgrst, 'reload schema';
