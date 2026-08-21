-- Organizer daily event intelligence template.
do $m$
declare v_tenant uuid; v_brand uuid; v_actor uuid; v_template uuid;
begin
  select id into strict v_tenant from public.communication_tenants where slug='chrismed' and active=true;
  select id into strict v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at limit 1;
  select id into v_actor from auth.users where lower(email)='raygs@hotmail.com' limit 1;
  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version,created_by)
  values(v_tenant,v_brand,'event.organizer.daily_digest','event.organizer.daily_digest','EMAIL','EVENTS','pt-BR','PUBLISHED',1,v_actor)
  on conflict(tenant_id,template_key,locale) do update set status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null returning id into v_template;
  insert into public.communication_template_versions(tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,variables_schema,required_variables,optional_variables,fallback_values,approval_status,created_by,approved_by,published_at)
  values(v_tenant,v_template,1,
    'CHRISMED · Resumo diário — {{event_name}}',
    'Convites, aceites, confirmações, presenças e ausências em uma leitura objetiva.',
    '<p>Olá, {{recipient_name}}.</p><p>Segue a posição atual do evento <strong>{{event_name}}</strong>.</p><table role="presentation" width="100%" style="border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #ddd">Convidados</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{invited}}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Aceitaram o convite</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{accepted}}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Confirmados</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{confirmed}}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Compareceram</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{present}}</strong></td></tr><tr><td style="padding:8px">No-show</td><td style="padding:8px"><strong>{{no_show}}</strong></td></tr></table><p>O dashboard CHRISMED mantém os indicadores atualizados e permite comparar este resultado com eventos anteriores.</p><p><a href="{{management_url}}">Acessar gestão de eventos</a></p>',
    'Olá, {{recipient_name}}.\n\nResumo de {{event_name}}:\nConvidados: {{invited}}\nAceitaram: {{accepted}}\nConfirmados: {{confirmed}}\nCompareceram: {{present}}\nNo-show: {{no_show}}\n\nAcesse: {{management_url}}',
    '{}'::jsonb,array['recipient_name','event_name','invited','accepted','confirmed','present','no_show','management_url'],'{}'::text[],'{}'::jsonb,'APPROVED',v_actor,v_actor,now())
  on conflict(template_id,version) do update set subject_template=excluded.subject_template,preheader_template=excluded.preheader_template,html_template=excluded.html_template,text_template=excluded.text_template,required_variables=excluded.required_variables,approval_status='APPROVED',approved_by=v_actor,published_at=now();
end $m$;
