-- HOMOLOGACAO: normalize agent federation without changing customer-facing behavior.
-- Existing specialized agents remain tenant-scoped and active.

begin;

do $$
declare
  v_root uuid;
  v_agent uuid;
begin
  select a.id into v_root
  from public.communication_agents a
  join public.communication_tenants t on t.id=a.tenant_id
  where t.slug='impulsionando' and a.name='Impulsionito' and a.active=true
  limit 1;

  if v_root is null then
    raise exception 'impulsionito_root_not_found';
  end if;

  -- WMP Milito is already a client runtime but was missing the root linkage.
  select a.id into v_agent
  from public.communication_agents a
  join public.communication_tenants t on t.id=a.tenant_id
  where t.slug='wmp' and a.name='Milito'
  limit 1;
  if v_agent is not null then
    update public.communication_agent_runtime
      set root_agent_id=v_root,
          system_prompt_ref=coalesce(system_prompt_ref,'wmp/milito/v1'),
          updated_at=now()
      where agent_id=v_agent;
  end if;

  -- Ana Madú has the visible agent but no runtime row. Create only the missing runtime metadata.
  select a.id into v_agent
  from public.communication_agents a
  join public.communication_tenants t on t.id=a.tenant_id
  where t.slug='anamadu' and a.name in ('Annita','Anita')
  limit 1;
  if v_agent is not null and not exists(select 1 from public.communication_agent_runtime where agent_id=v_agent) then
    insert into public.communication_agent_runtime(
      agent_id,agent_key,root_agent_id,instance_type,system_prompt_ref,knowledge_scope,
      model_policy,privacy_policy,handoff_policy,capabilities,config,active
    ) values (
      v_agent,'anamadu-annita',v_root,'CLIENT_INSTANCE','anamadu/annita/v1','tenant',
      '{}'::jsonb,'{}'::jsonb,'{}'::jsonb,
      '{"crm":true,"sales":true,"support":true,"web_chat":true,"omnichannel":true,"human_handoff":true}'::jsonb,
      '{}'::jsonb,true
    );
  end if;
end $$;

commit;
