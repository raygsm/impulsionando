-- Resolve public tenant hosts from the canonical Core identity while retaining
-- legacy custom-domain compatibility during the migration window.
create or replace function public.resolve_tenant_by_host(_host text)
returns table (
  id uuid,
  name text,
  subdomain text,
  domain text,
  primary_color text,
  secondary_color text,
  logo_url text,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    coalesce(i.subdomain, c.subdomain) as subdomain,
    c.domain,
    c.primary_color,
    c.secondary_color,
    c.logo_url,
    c.is_active
  from public.companies c
  left join public.core_tenant_identity i on i.company_id = c.id
  where c.is_active = true
    and _host is not null
    and (
      lower(c.domain) = lower(_host)
      or lower(coalesce(i.subdomain, c.subdomain)) = lower(split_part(_host, '.', 1))
    )
  order by (lower(c.domain) = lower(_host)) desc
  limit 1;
$$;

revoke all on function public.resolve_tenant_by_host(text) from public;
grant execute on function public.resolve_tenant_by_host(text) to anon, authenticated, service_role;
