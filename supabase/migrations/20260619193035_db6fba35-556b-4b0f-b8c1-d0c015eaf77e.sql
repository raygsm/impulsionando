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
      lower(c.domain)    = lower(_host)
      OR lower(c.subdomain) = lower(split_part(_host, '.', 1))
    )
  ORDER BY (lower(c.domain) = lower(_host)) DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_tenant_by_host(text) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO anon, authenticated, service_role;