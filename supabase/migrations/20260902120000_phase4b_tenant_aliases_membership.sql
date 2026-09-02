-- Phase 4B — tenant slug aliases + membership helper + resolve upgrade
-- Authority: docs/reengineering/04-migration/phase-4/TENANT-ALIAS-INVENTORY.md

CREATE TABLE IF NOT EXISTS public.core_tenant_slug_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alias_slug text NOT NULL,
  alias_kind text NOT NULL DEFAULT 'compatibility'
    CHECK (alias_kind IN ('canonical', 'compatibility', 'communication_slug', 'route_slug')),
  is_canonical boolean NOT NULL DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT core_tenant_slug_aliases_alias_slug_unique UNIQUE (alias_slug)
);

CREATE INDEX IF NOT EXISTS idx_core_tenant_slug_aliases_company
  ON public.core_tenant_slug_aliases(company_id);

COMMENT ON TABLE public.core_tenant_slug_aliases IS
  'Deterministic slug aliases for tenant resolution — no silent merge';

ALTER TABLE public.core_tenant_slug_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS core_tenant_slug_aliases_read ON public.core_tenant_slug_aliases;
CREATE POLICY core_tenant_slug_aliases_read ON public.core_tenant_slug_aliases
  FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.company_id = core_tenant_slug_aliases.company_id
    )
  );

GRANT SELECT ON public.core_tenant_slug_aliases TO authenticated;
GRANT ALL ON public.core_tenant_slug_aliases TO service_role;

CREATE OR REPLACE FUNCTION public.user_has_company_membership(_user uuid, _company uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user
      AND ur.company_id = _company
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_company_membership(uuid, uuid)
  TO authenticated, service_role;

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
  WITH host_norm AS (
    SELECT lower(trim(_host)) AS h
  ),
  direct AS (
    SELECT c.*
    FROM public.companies c, host_norm hn
    WHERE c.is_active = true
      AND hn.h IS NOT NULL
      AND hn.h <> ''
      AND (
        lower(c.domain) = hn.h
        OR lower(c.subdomain) = lower(split_part(hn.h, '.', 1))
      )
    ORDER BY (lower(c.domain) = hn.h) DESC
    LIMIT 1
  ),
  via_alias AS (
    SELECT c.*
    FROM public.companies c
    JOIN public.core_tenant_slug_aliases a ON a.company_id = c.id
    CROSS JOIN host_norm hn
    WHERE c.is_active = true
      AND hn.h IS NOT NULL
      AND hn.h <> ''
      AND lower(a.alias_slug) = lower(split_part(hn.h, '.', 1))
      AND NOT EXISTS (SELECT 1 FROM direct)
    ORDER BY a.is_canonical DESC
    LIMIT 1
  ),
  picked AS (
    SELECT * FROM direct
    UNION ALL
    SELECT * FROM via_alias
    LIMIT 1
  )
  SELECT
    p.id,
    p.name,
    p.subdomain,
    p.domain,
    p.primary_color,
    p.secondary_color,
    p.logo_url,
    p.is_active
  FROM picked p;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO anon, authenticated, service_role;
