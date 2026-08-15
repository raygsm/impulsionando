-- CHRISMED management communication routing.
-- Primary management mailbox remains sac@chrismed.com.br.
-- Administrative/operational copies also go to Dra. Christiane Alencar.
insert into public.company_settings(company_id,key,value,updated_at)
select c.id,'comms.management_primary_email',to_jsonb('sac@chrismed.com.br'::text),now()
from public.companies c where lower(c.name)='chrismed'
on conflict (company_id,key) do update set value=excluded.value,updated_at=now();

insert into public.company_settings(company_id,key,value,updated_at)
select c.id,'comms.management_copy_emails','["chrissalencar@yahoo.com.br"]'::jsonb,now()
from public.companies c where lower(c.name)='chrismed'
on conflict (company_id,key) do update set value=excluded.value,updated_at=now();

insert into public.company_settings(company_id,key,value,updated_at)
select c.id,'comms.management_copy_policy','{"enabled":true,"scope":"operational_and_administrative","clinical_sensitive_mode":"metadata_only","primary":"sac@chrismed.com.br","copies":["chrissalencar@yahoo.com.br"]}'::jsonb,now()
from public.companies c where lower(c.name)='chrismed'
on conflict (company_id,key) do update set value=excluded.value,updated_at=now();

create or replace function public.get_chrismed_management_emails()
returns table(primary_email text, copy_emails jsonb, clinical_sensitive_mode text)
language sql stable security definer set search_path=public
as $$
  select
    coalesce((select value #>> '{}' from public.company_settings where company_id=(select id from public.companies where lower(name)='chrismed' limit 1) and key='comms.management_primary_email'),'sac@chrismed.com.br'),
    coalesce((select value from public.company_settings where company_id=(select id from public.companies where lower(name)='chrismed' limit 1) and key='comms.management_copy_emails'),'[]'::jsonb),
    coalesce((select value->>'clinical_sensitive_mode' from public.company_settings where company_id=(select id from public.companies where lower(name)='chrismed' limit 1) and key='comms.management_copy_policy'),'metadata_only');
$$;
revoke all on function public.get_chrismed_management_emails() from public,anon;
grant execute on function public.get_chrismed_management_emails() to authenticated,service_role;