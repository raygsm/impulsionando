-- Transactional templates for management-proposed appointment changes.
do $m$
declare
  v_tenant uuid; v_brand uuid; v_actor uuid; v_template uuid;
begin
  select id into strict v_tenant from public.communication_tenants where slug='chrismed' and active=true;
  select id into strict v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at limit 1;
  select id into v_actor from auth.users where lower(email)='raygs@hotmail.com' limit 1;

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version,created_by)
  values(v_tenant,v_brand,'appointment.reschedule.proposed','appointment.reschedule.proposed','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1,v_actor)
  on conflict(tenant_id,template_key,locale) do update set status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,variables_schema,required_variables,optional_variables,fallback_values,approval_status,created_by,approved_by,published_at)
  values(v_tenant,v_template,1,
    'CHRISMED propõe um novo horário — sua autorização é necessária',
    'Seu horário atual não será alterado sem o seu aceite expresso.',
    '<p>Olá, {{patient_name}}.</p><p>A CHRISMED gostaria de propor uma mudança no seu agendamento.</p><p><strong>Horário atualmente confirmado:</strong> {{old_appointment_date}} às {{old_appointment_time}}<br><strong>Novo horário proposto:</strong> {{proposed_appointment_date}} às {{proposed_appointment_time}}</p><p><strong>Nada será alterado sem a sua autorização.</strong> Se você concordar, clique no botão abaixo. Se não concordar, basta não clicar: seu horário atual permanece confirmado.</p><p><a href="{{accept_url}}" style="display:inline-block;padding:13px 20px;background:#006b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Aceitar novo horário</a></p><p style="font-size:13px">Este link expira em {{expires_at_local}}.</p>',
    'Olá, {{patient_name}}.\n\nA CHRISMED propõe alterar seu agendamento de {{old_appointment_date}} às {{old_appointment_time}} para {{proposed_appointment_date}} às {{proposed_appointment_time}}.\n\nNada será alterado sem sua autorização. Se concordar, aceite aqui: {{accept_url}}\n\nSe não concordar, basta não clicar. Seu horário atual permanece confirmado.\n\nLink válido até {{expires_at_local}}.',
    '{}'::jsonb,array['patient_name','old_appointment_date','old_appointment_time','proposed_appointment_date','proposed_appointment_time','accept_url','expires_at_local'], '{}'::text[],'{}'::jsonb,'APPROVED',v_actor,v_actor,now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,preheader_template=excluded.preheader_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',approved_by=v_actor,published_at=now();

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version,created_by)
  values(v_tenant,v_brand,'appointment.reschedule.accepted','appointment.reschedule.accepted','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1,v_actor)
  on conflict(tenant_id,template_key,locale) do update set status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,variables_schema,required_variables,optional_variables,fallback_values,approval_status,created_by,approved_by,published_at)
  values(v_tenant,v_template,1,
    'Novo horário confirmado — CHRISMED',
    'Recebemos sua autorização e atualizamos seu agendamento.',
    '<p>Olá, {{patient_name}}.</p><p>Recebemos sua autorização expressa e seu novo horário está confirmado para <strong>{{appointment_date}} às {{appointment_time}}</strong>.</p><p><a href="{{appointment_url}}" style="display:inline-block;padding:13px 20px;background:#006b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Ver meu agendamento</a></p>',
    'Olá, {{patient_name}}.\n\nRecebemos sua autorização e seu novo horário CHRISMED está confirmado para {{appointment_date}} às {{appointment_time}}.\n\nAcesse: {{appointment_url}}',
    '{}'::jsonb,array['patient_name','appointment_date','appointment_time','appointment_url'], '{}'::text[],'{}'::jsonb,'APPROVED',v_actor,v_actor,now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,preheader_template=excluded.preheader_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',approved_by=v_actor,published_at=now();
end $m$;
