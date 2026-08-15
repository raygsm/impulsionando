create or replace function public.current_user_company_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  with me as (
    select auth.uid() as user_id
  ), direct_role as (
    select ur.company_id, 1 as priority
    from public.user_roles ur, me
    where ur.user_id = me.user_id
    order by ur.created_at asc
    limit 1
  ), tenant_role as (
    select ct.company_id, 2 as priority
    from public.communication_tenant_members ctm
    join public.communication_tenants ct on ct.id = ctm.tenant_id
    join me on me.user_id = ctm.user_id
    where ct.company_id is not null
      and ct.active = true
      and ct.deleted_at is null
    order by ctm.created_at asc
    limit 1
  ), staff_master as (
    select public.master_company_id() as company_id, 3 as priority
    from me
    where public.is_impulsionando_staff(me.user_id)
       or public.is_super_admin(me.user_id)
  )
  select x.company_id
  from (
    select * from direct_role
    union all
    select * from tenant_role
    union all
    select * from staff_master
  ) x
  where x.company_id is not null
  order by x.priority
  limit 1
$$;

revoke all on function public.current_user_company_id() from public;
grant execute on function public.current_user_company_id() to authenticated, service_role;

comment on function public.current_user_company_id() is 'Resolve a empresa atual do usuário autenticado via vínculo empresarial, vínculo de tenant Core ou empresa master para staff/superadmin. Nunca usa auth.uid() como company_id.';

drop policy if exists talentos_candidato_visible_read on public.talentos_candidatos;
create policy talentos_candidato_visible_read
on public.talentos_candidatos
for select
to authenticated
using (
  ativo = true
  and visivel_rede = true
  and public.current_user_company_id() is not null
);

drop policy if exists talentos_company_settings_members on public.talentos_company_settings;
create policy talentos_company_settings_members
on public.talentos_company_settings
for all
to authenticated
using (public.user_belongs_to_company(auth.uid(), company_id))
with check (public.user_belongs_to_company(auth.uid(), company_id));

drop policy if exists talentos_vagas_company_members on public.talentos_vagas;
create policy talentos_vagas_company_members
on public.talentos_vagas
for all
to authenticated
using (public.user_belongs_to_company(auth.uid(), company_id))
with check (public.user_belongs_to_company(auth.uid(), company_id));

drop policy if exists talentos_matches_company_members on public.talentos_matches;
create policy talentos_matches_company_members
on public.talentos_matches
for all
to authenticated
using (public.user_belongs_to_company(auth.uid(), company_id))
with check (public.user_belongs_to_company(auth.uid(), company_id));