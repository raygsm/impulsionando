begin;
insert into public.communication_tenants(kind,slug,display_name,locale,timezone,settings,active)
values ('COMPANY','colors-saude','Colors Saúde','pt-BR','America/Sao_Paulo',jsonb_build_object('onboarding_status','PENDING_CONFIGURATION','identity_status','PENDING','sender_status','PENDING','agent_status','PENDING','source','codex_client_scaffold'),true)
on conflict (slug) do update set display_name=excluded.display_name,locale=excluded.locale,timezone=excluded.timezone,updated_at=now();
insert into public.communication_brands(tenant_id,name,hide_impulsionando_brand,settings)
select t.id,'Colors Saúde',false,jsonb_build_object('configuration_status','PENDING_IDENTITY','logo_status','PENDING','colors_status','PENDING','domain_status','PENDING','legal_status','PENDING','source','codex_client_scaffold')
from public.communication_tenants t where t.slug='colors-saude' and not exists(select 1 from public.communication_brands b where b.tenant_id=t.id and lower(b.name)=lower('Colors Saúde') and b.deleted_at is null);
insert into public.communication_audit_logs(tenant_id,actor_type,action,entity_type,entity_id,after_data)
select t.id,'SYSTEM','CLIENT_SCAFFOLD_CREATED','communication_tenant',t.id::text,jsonb_build_object('slug',t.slug,'display_name',t.display_name,'configuration_status','PENDING')
from public.communication_tenants t where t.slug='colors-saude' and not exists(select 1 from public.communication_audit_logs a where a.tenant_id=t.id and a.action='CLIENT_SCAFFOLD_CREATED');
commit;
