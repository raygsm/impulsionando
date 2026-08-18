-- HOMOLOGACAO ONLY — Impulsionando Core / Vitrine.
-- Objetivo: impedir que acesso direto às tabelas exponha free_data, paid_data,
-- avaliações detalhadas ou estoque. Produção só após front homologado + E2E + autorização.

begin;

-- 1) Superfície pública mínima: sem avaliações, sem free_data, sem paid_data, sem estoque.
create or replace view public.core_showcase_public_v2 as
select
  p.company_id,
  p.public_name,
  p.tagline,
  p.short_description,
  p.logo_url,
  p.cover_url,
  p.website_url,
  p.primary_taxonomy_id,
  p.public_data
from public.core_client_showcase_profiles p
where p.published = true
  and p.showcase_authorized = true
  and p.opted_out_at is null;

-- 2) Não permitir leitura direta das fontes sensíveis por consumidores.
revoke select on table public.core_client_showcase_profiles from anon, authenticated;
revoke select on table public.core_client_reviews from anon, authenticated;
revoke select on table public.core_showcase_free_v1 from anon, authenticated;
revoke select on table public.core_showcase_paid_v1 from anon, authenticated;
revoke select on table public.core_showcase_inventory_paid_v1 from anon, authenticated;

grant select on table public.core_showcase_public_v2 to anon, authenticated;
grant select on table public.core_showcase_free_v1 to service_role;
grant select on table public.core_showcase_paid_v1 to service_role;
grant select on table public.core_showcase_inventory_paid_v1 to service_role;

-- 3) Resolver nível efetivo do Clube no servidor.
create or replace function public.core_showcase_effective_tier()
returns text
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_tier text;
begin
  if auth.uid() is null then
    return 'PUBLIC';
  end if;

  select m.tier
    into v_tier
  from public.core_club_memberships m
  where m.user_id = auth.uid()
    and m.status = 'ACTIVE'
    and (m.paid_until is null or m.paid_until > now())
  order by case m.tier when 'CLUB_PAID' then 1 when 'CLUB_FREE' then 2 else 9 end
  limit 1;

  if v_tier = 'CLUB_PAID' then return 'CLUB_PAID'; end if;
  if v_tier = 'CLUB_FREE' then return 'CLUB_FREE'; end if;
  return 'PUBLIC';
end;
$$;
revoke execute on function public.core_showcase_effective_tier() from public, anon;
grant execute on function public.core_showcase_effective_tier() to authenticated;

-- 4) Catálogo Free: perfil ampliado + resumo de reputação, nunca avaliação detalhada/estoque.
create or replace function public.core_get_showcase_free()
returns setof public.core_showcase_free_v1
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.core_club_memberships m
    where m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.tier in ('CLUB_FREE','CLUB_PAID')
      and (m.paid_until is null or m.paid_until > now())
  ) then
    raise exception 'CLUB_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;
  return query select * from public.core_showcase_free_v1;
end;
$$;
revoke execute on function public.core_get_showcase_free() from public, anon;
grant execute on function public.core_get_showcase_free() to authenticated;

-- 5) Catálogo Pago: dados completos autorizados pela empresa.
create or replace function public.core_get_showcase_paid()
returns setof public.core_showcase_paid_v1
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.core_club_memberships m
    where m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.tier = 'CLUB_PAID'
      and (m.paid_until is null or m.paid_until > now())
  ) then
    raise exception 'CLUB_PAID_REQUIRED' using errcode = '42501';
  end if;
  return query select * from public.core_showcase_paid_v1;
end;
$$;
revoke execute on function public.core_get_showcase_paid() from public, anon;
grant execute on function public.core_get_showcase_paid() to authenticated;

-- 6) Avaliações detalhadas: exclusivamente Clube Pago e apenas quando a empresa autorizou.
create or replace function public.core_get_company_reviews_paid(p_company_id uuid)
returns table(
  id uuid,
  company_id uuid,
  rating numeric,
  title text,
  body text,
  verified_interaction boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.core_club_memberships m
    where m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.tier = 'CLUB_PAID'
      and (m.paid_until is null or m.paid_until > now())
  ) then
    raise exception 'CLUB_PAID_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.core_client_showcase_profiles p
    where p.company_id = p_company_id
      and p.published = true
      and p.showcase_authorized = true
      and p.opted_out_at is null
      and p.show_reviews_to_paid = true
  ) then
    return;
  end if;

  return query
  select r.id, r.company_id, r.rating, r.title, r.body, r.verified_interaction, r.created_at
  from public.core_client_reviews r
  where r.company_id = p_company_id
    and r.status = 'APPROVED'
  order by r.created_at desc;
end;
$$;
revoke execute on function public.core_get_company_reviews_paid(uuid) from public, anon;
grant execute on function public.core_get_company_reviews_paid(uuid) to authenticated;

-- 7) Gestão do perfil: empresa só acessa seu próprio perfil; staff da Impulsionando pode auditar.
create or replace function public.core_get_company_showcase_profile(p_company_id uuid)
returns setof public.core_client_showcase_profiles
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_impulsionando_staff(auth.uid()) and not exists (
    select 1
    from public.communication_tenant_members m
    join public.communication_tenants t on t.id = m.tenant_id
    where m.user_id = auth.uid()
      and t.company_id = p_company_id
      and t.active = true
  ) then
    raise exception 'COMPANY_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  return query
  select p.* from public.core_client_showcase_profiles p where p.company_id = p_company_id;
end;
$$;
revoke execute on function public.core_get_company_showcase_profile(uuid) from public, anon;
grant execute on function public.core_get_company_showcase_profile(uuid) to authenticated;

-- 8) Opt-in/opt-out continua explícito e auditável; nunca depende de update direto do navegador.
revoke execute on function public.core_set_showcase_authorization(uuid, boolean, text) from public, anon;
grant execute on function public.core_set_showcase_authorization(uuid, boolean, text) to authenticated;

commit;
