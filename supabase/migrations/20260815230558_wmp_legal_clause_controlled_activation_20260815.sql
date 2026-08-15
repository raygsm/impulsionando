create or replace function public.create_wmp_legal_clause_draft(p_clause_key text,p_title text,p_body text,p_parameters jsonb default '{}'::jsonb)
returns public.wmp_legal_clause_versions
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare v_tenant uuid; v_version integer; v_row public.wmp_legal_clause_versions%rowtype;
begin
  select id into v_tenant from public.communication_tenants where slug='wmp' and active=true limit 1;
  if v_tenant is null then raise exception 'wmp_tenant_not_found'; end if;
  if not private.is_tenant_member(v_tenant,array['OWNER','ADMIN']) then raise exception 'not_authorized'; end if;
  if length(trim(coalesce(p_clause_key,'')))<2 or length(trim(coalesce(p_clause_key,'')))>80 then raise exception 'invalid_clause_key'; end if;
  if length(trim(coalesce(p_title,'')))<3 or length(trim(coalesce(p_title,'')))>240 then raise exception 'invalid_clause_title'; end if;
  if length(trim(coalesce(p_body,'')))<20 then raise exception 'legal_clause_body_too_short'; end if;
  select coalesce(max(version),0)+1 into v_version from public.wmp_legal_clause_versions where tenant_id=v_tenant and clause_key=lower(trim(p_clause_key));
  insert into public.wmp_legal_clause_versions(tenant_id,clause_key,version,title,body,parameters,status,effective_from,effective_until,created_by)
  values(v_tenant,lower(trim(p_clause_key)),v_version,trim(p_title),trim(p_body),coalesce(p_parameters,'{}'::jsonb),'DRAFT',null,null,auth.uid()) returning * into v_row;
  insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,after_data)
  values(v_tenant,auth.uid(),'wmp_legal_clause_versions',v_row.id,'LEGAL_DRAFT_CREATED',jsonb_build_object('clause_key',v_row.clause_key,'version',v_row.version,'title',v_row.title));
  return v_row;
end
$function$;

create or replace function public.activate_wmp_legal_clause(p_clause_id uuid,p_confirm boolean default false)
returns public.wmp_legal_clause_versions
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare v_tenant uuid; v_current public.wmp_legal_clause_versions%rowtype; v_now timestamptz:=now(); v_row public.wmp_legal_clause_versions%rowtype;
begin
  if p_confirm is not true then raise exception 'explicit_confirmation_required'; end if;
  select * into v_current from public.wmp_legal_clause_versions where id=p_clause_id for update;
  if v_current.id is null then raise exception 'clause_not_found'; end if;
  v_tenant:=v_current.tenant_id;
  if not private.is_tenant_member(v_tenant,array['OWNER','ADMIN']) then raise exception 'not_authorized'; end if;
  if length(trim(coalesce(v_current.body,'')))<20 then raise exception 'legal_clause_body_too_short'; end if;
  update public.wmp_legal_clause_versions
     set status='SUPERSEDED',effective_until=v_now
   where tenant_id=v_tenant and clause_key=v_current.clause_key and status='ACTIVE' and id<>v_current.id;
  update public.wmp_legal_clause_versions
     set status='ACTIVE',effective_from=coalesce(effective_from,v_now),effective_until=null
   where id=v_current.id returning * into v_row;
  insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,after_data)
  values(v_tenant,auth.uid(),'wmp_legal_clause_versions',v_row.id,'LEGAL_CLAUSE_ACTIVATED',jsonb_build_object('clause_key',v_row.clause_key,'version',v_row.version,'activated_at',v_now));
  return v_row;
end
$function$;

revoke all on function public.create_wmp_legal_clause_draft(text,text,text,jsonb) from public,anon;
grant execute on function public.create_wmp_legal_clause_draft(text,text,text,jsonb) to authenticated;
revoke all on function public.activate_wmp_legal_clause(uuid,boolean) from public,anon;
grant execute on function public.activate_wmp_legal_clause(uuid,boolean) to authenticated;
