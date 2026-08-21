-- Keep module-update notifications aligned with canonical communication tenants.
create or replace function public.core_prepare_module_update_notifications(
  p_module_version_id uuid,
  p_learn_more_url text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_mv public.core_module_versions%rowtype;
  v_module public.modules%rowtype;
  v_count integer := 0;
begin
  select * into v_mv from public.core_module_versions where id=p_module_version_id;
  if v_mv.id is null then raise exception 'module_version_not_found'; end if;
  if v_mv.status <> 'RELEASED' then raise exception 'module_version_not_released'; end if;
  select * into v_module from public.modules where id=v_mv.module_id;

  insert into public.core_module_update_notifications(
    module_version_id,company_id,tenant_id,module_id,rollout_target_id,
    recipient_email,recipient_name,subject,body_text,learn_more_url,status,metadata
  )
  select
    v_mv.id, rt.company_id, t.id, v_module.id, rt.id,
    coalesce(nullif(trim(t.settings->>'primary_email'),''), nullif(trim(c.email),'')),
    coalesce(nullif(trim(t.display_name),''), c.name),
    'Há novidades no módulo ' || v_module.name,
    'Atualizamos o módulo ' || v_module.name || '. ' || v_mv.summary ||
      case when p_learn_more_url is not null then E'\n\nConheça: ' || p_learn_more_url else '' end,
    p_learn_more_url,
    case when coalesce(nullif(trim(t.settings->>'primary_email'),''), nullif(trim(c.email),'')) is null
      then 'SKIPPED' else 'PENDING' end,
    jsonb_build_object('module_slug',v_module.slug,'version',v_mv.version,'change_type',v_mv.change_type,'rollout_verified',true)
  from public.core_module_rollout_targets rt
  join public.core_module_rollouts r on r.id=rt.rollout_id and r.module_version_id=v_mv.id
  join public.companies c on c.id=rt.company_id
  left join lateral (
    select ct.id,ct.settings,ct.display_name
    from public.communication_tenants ct
    where ct.company_id=rt.company_id and ct.active=true and ct.deleted_at is null
    order by ct.created_at asc, ct.id asc
    limit 1
  ) t on true
  where rt.status='VERIFIED'
  on conflict(module_version_id,company_id) do update set
    recipient_email=excluded.recipient_email,
    recipient_name=excluded.recipient_name,
    subject=excluded.subject,
    body_text=excluded.body_text,
    learn_more_url=excluded.learn_more_url,
    status=case when core_module_update_notifications.status in ('SENT','DELIVERED')
      then core_module_update_notifications.status else excluded.status end,
    metadata=excluded.metadata,
    updated_at=now();

  get diagnostics v_count=row_count;
  return jsonb_build_object('module_version_id',v_mv.id,'module_slug',v_module.slug,'prepared',v_count);
end;
$function$;
