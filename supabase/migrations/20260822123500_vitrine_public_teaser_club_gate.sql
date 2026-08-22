-- Public Vitrine must expose only teaser fields. Full company details require an authenticated Club session.

create or replace view public.companies_vitrine_teaser_public as
select
  id,
  name,
  trade_name,
  segment,
  tagline,
  description,
  public_slug
from public.companies_vitrine_public;

grant select on public.companies_vitrine_teaser_public to anon, authenticated;
grant all on public.companies_vitrine_teaser_public to service_role;

-- Prevent anonymous callers from bypassing the teaser through the previous full view.
revoke all on public.companies_vitrine_public from anon;
grant select on public.companies_vitrine_public to authenticated;
grant all on public.companies_vitrine_public to service_role;
