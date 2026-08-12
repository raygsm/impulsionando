do $$
declare
  v_tenant uuid;
  v_brand uuid;
  v_template uuid;
begin
  select id into v_tenant from public.communication_tenants where slug='chrismed' and active=true limit 1;
  if v_tenant is null then raise exception 'CHRISMED communication tenant not found'; end if;
  select id into v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at limit 1;

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'appointment.reminder.2h','appointment.reminder.2h','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now()
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Sua consulta começa em cerca de 2 horas','<p>Olá, {{patient_name}}. Sua consulta com {{professional_name}} será hoje às {{appointment_time}}.</p><p><a href="{{appointment_url}}">Ver consulta</a></p>','Olá, {{patient_name}}. Sua consulta com {{professional_name}} será hoje às {{appointment_time}}. Ver consulta: {{appointment_url}}',array['patient_name','professional_name','appointment_time','appointment_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'professional.registration.management','professional.registration.management','EMAIL','OPERATIONS','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now()
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Novo cadastro profissional aguardando análise','<p>Novo cadastro profissional recebido: <strong>{{professional_name}}</strong>.</p><p>Profissão: {{profession}}. Especialidades: {{specialties}}.</p><p><a href="{{management_url}}">Abrir gestão CHRISMED</a></p>','Novo cadastro profissional recebido: {{professional_name}}. Profissão: {{profession}}. Especialidades: {{specialties}}. Gestão: {{management_url}}',array['professional_name','management_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'appointment.confirmed.management','appointment.confirmed.management','EMAIL','OPERATIONS','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now()
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Nova consulta confirmada','<p>Consulta confirmada para {{patient_name}} em {{appointment_date}} às {{appointment_time}}.</p><p><a href="{{management_url}}">Abrir gestão CHRISMED</a></p>','Consulta confirmada para {{patient_name}} em {{appointment_date}} às {{appointment_time}}. Gestão: {{management_url}}',array['patient_name','appointment_date','appointment_time','management_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'pega_agenda.patient_reassigned','pega_agenda.patient_reassigned','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now()
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Atualização da sua consulta CHRISMED','<p>Olá, {{patient_name}}. Sua consulta permanece confirmada e será atendida por {{professional_name}} em {{appointment_date}} às {{appointment_time}}.</p><p><a href="{{appointment_url}}">Ver detalhes</a></p>','Olá, {{patient_name}}. Sua consulta permanece confirmada e será atendida por {{professional_name}} em {{appointment_date}} às {{appointment_time}}. Ver detalhes: {{appointment_url}}',array['patient_name','professional_name','appointment_date','appointment_time','appointment_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());
end $$;

create or replace function public.enqueue_chrismed_pega_agenda_preference_email()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_prof public.agenda_professionals%rowtype;
begin
  if new.accepts_substitution=true and (tg_op='INSERT' or old.accepts_substitution is distinct from new.accepts_substitution) then
    select * into v_prof from public.agenda_professionals where id=new.professional_id and is_active=true;
    if v_prof.id is not null and v_prof.email is not null then
      insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
      values(v_prof.company_id,'PEGA_AGENDA_OPT_IN','email',v_prof.email,jsonb_build_object('professional_id',v_prof.id,'professional_name',v_prof.name,'terms_version','pega-agenda-v1'),'pega-agenda-opt-in:'||v_prof.id||':pega-agenda-v1:email','pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br')
      on conflict(idempotency_key) do update set status='pending',attempts=0,last_error=null,available_at=now(),updated_at=now();
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enqueue_chrismed_pega_agenda_preference_email() from public,anon,authenticated;
grant execute on function public.enqueue_chrismed_pega_agenda_preference_email() to service_role;
drop trigger if exists trg_chrismed_pega_agenda_preference_email on public.agenda_professional_availability;
create trigger trg_chrismed_pega_agenda_preference_email after insert or update of accepts_substitution on public.agenda_professional_availability for each row execute function public.enqueue_chrismed_pega_agenda_preference_email();

create or replace function public.enqueue_chrismed_pega_agenda_claimed_professional_email()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_prof public.agenda_professionals%rowtype; v_slot public.agenda_open_slots%rowtype;
begin
  if new.status='accepted' and (tg_op='INSERT' or old.status is distinct from new.status) then
    select * into v_prof from public.agenda_professionals where id=new.professional_id and is_active=true;
    select * into v_slot from public.agenda_open_slots where id=new.open_slot_id;
    if v_prof.id is not null and v_prof.email is not null and v_slot.id is not null then
      insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
      values(v_prof.company_id,'PEGA_AGENDA_CLAIMED_PROFESSIONAL','email',v_prof.email,jsonb_build_object('professional_id',v_prof.id,'professional_name',v_prof.name,'slot_id',v_slot.id,'appointment_id',v_slot.appointment_id,'starts_at',v_slot.starts_at,'ends_at',v_slot.ends_at),'pega-agenda-claimed:'||v_slot.id||':professional:'||v_prof.id,'pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br')
      on conflict(idempotency_key) do nothing;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enqueue_chrismed_pega_agenda_claimed_professional_email() from public,anon,authenticated;
grant execute on function public.enqueue_chrismed_pega_agenda_claimed_professional_email() to service_role;
drop trigger if exists trg_chrismed_pega_agenda_claimed_professional_email on public.agenda_slot_offers;
create trigger trg_chrismed_pega_agenda_claimed_professional_email after insert or update of status on public.agenda_slot_offers for each row execute function public.enqueue_chrismed_pega_agenda_claimed_professional_email();

create or replace function public.chrismed_claim_communication_outbox(p_batch_size integer default 25)
returns setof public.chrismed_communication_outbox
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_batch_size < 1 or p_batch_size > 100 then raise exception 'invalid_batch_size'; end if;
  return query
  with picked as (
    select id from public.chrismed_communication_outbox
    where channel='email' and status in ('pending','failed') and available_at<=now() and attempts<5
    order by available_at,created_at
    for update skip locked
    limit p_batch_size
  )
  update public.chrismed_communication_outbox o
     set status='processing',attempts=o.attempts+1,updated_at=now()
    from picked p where o.id=p.id
  returning o.*;
end $$;
revoke all on function public.chrismed_claim_communication_outbox(integer) from public,anon,authenticated;
grant execute on function public.chrismed_claim_communication_outbox(integer) to service_role;
