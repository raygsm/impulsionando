-- Guarantees the four CHRISMED delivery/Pega-Agenda templates after the
-- universal communication Core exists. Idempotent by tenant/template/locale.
do $m$
declare
  v_tenant uuid;
  v_brand uuid;
  v_template uuid;
begin
  if to_regclass('public.communication_tenants') is null
     or to_regclass('public.communication_brands') is null
     or to_regclass('public.communication_templates') is null
     or to_regclass('public.communication_template_versions') is null then
    raise exception 'communication_core_required_for_chrismed_delivery_seed';
  end if;

  select id into strict v_tenant from public.communication_tenants where slug='chrismed' and active=true;
  select id into v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at limit 1;

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'appointment.reminder.2h','appointment.reminder.2h','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set brand_id=excluded.brand_id,event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Sua consulta começa em cerca de 2 horas','<p>Olá, {{patient_name}}. Sua consulta com {{professional_name}} será hoje às {{appointment_time}}.</p><p><a href="{{appointment_url}}">Ver consulta</a></p>','Olá, {{patient_name}}. Sua consulta com {{professional_name}} será hoje às {{appointment_time}}. Ver consulta: {{appointment_url}}',array['patient_name','professional_name','appointment_time','appointment_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'professional.registration.management','professional.registration.management','EMAIL','OPERATIONS','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set brand_id=excluded.brand_id,event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Novo cadastro profissional aguardando análise','<p>Novo cadastro profissional recebido: <strong>{{professional_name}}</strong>.</p><p>Profissão: {{profession}}. Especialidades: {{specialties}}.</p><p><a href="{{management_url}}">Abrir gestão CHRISMED</a></p>','Novo cadastro profissional recebido: {{professional_name}}. Profissão: {{profession}}. Especialidades: {{specialties}}. Gestão: {{management_url}}',array['professional_name','management_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'appointment.confirmed.management','appointment.confirmed.management','EMAIL','OPERATIONS','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set brand_id=excluded.brand_id,event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Nova consulta confirmada','<p>Consulta confirmada para {{patient_name}} em {{appointment_date}} às {{appointment_time}}.</p><p><a href="{{management_url}}">Abrir gestão CHRISMED</a></p>','Consulta confirmada para {{patient_name}} em {{appointment_date}} às {{appointment_time}}. Gestão: {{management_url}}',array['patient_name','appointment_date','appointment_time','management_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  values(v_tenant,v_brand,'pega_agenda.patient_reassigned','pega_agenda.patient_reassigned','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1)
  on conflict(tenant_id,template_key,locale) do update set brand_id=excluded.brand_id,event_type=excluded.event_type,status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null
  returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,html_template,text_template,required_variables,approval_status,published_at)
  values(v_tenant,v_template,1,'Atualização da sua consulta CHRISMED','<p>Olá, {{patient_name}}. Sua consulta permanece confirmada e será atendida por {{professional_name}} em {{appointment_date}} às {{appointment_time}}.</p><p><a href="{{appointment_url}}">Ver detalhes</a></p>','Olá, {{patient_name}}. Sua consulta permanece confirmada e será atendida por {{professional_name}} em {{appointment_date}} às {{appointment_time}}. Ver detalhes: {{appointment_url}}',array['patient_name','professional_name','appointment_date','appointment_time','appointment_url'],'APPROVED',now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',published_at=coalesce(public.communication_template_versions.published_at,now());
end
$m$;
