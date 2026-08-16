do $$
declare
  v_tenant uuid;
  v_id uuid;
  rec record;
begin
  select id into v_tenant from public.communication_tenants where slug='wmp' limit 1;
  if v_tenant is null then raise exception 'wmp_tenant_not_found'; end if;

  for rec in select * from (values
    ('wmp.briefing.received','wmp.briefing.received','SERVICE','Briefing recebido pela WMP','Olá {{nome}}. Recebemos o briefing de {{evento}}. A equipe WMP e o Milito vão organizar a próxima etapa comercial usando apenas os dados registrados. Quando houver dados suficientes e valores reais cadastrados, a proposta poderá ser preparada.',array['nome','evento']::text[]),
    ('wmp.proposal.sent','wmp.proposal.sent','BILLING','Sua proposta WMP está disponível','Olá {{nome}}. A proposta {{proposta}} para {{evento}} está disponível em {{proposta_url}}. O contrato formal somente será gerado após o aceite da proposta comercial.',array['nome','proposta','evento','proposta_url']::text[]),
    ('wmp.proposal.reminder','wmp.proposal.reminder','SERVICE','Lembrete sobre sua proposta WMP','Olá {{nome}}. Sua proposta {{proposta}} continua disponível em {{proposta_url}}. Se precisar complementar alguma informação, responda ao atendimento WMP; não é necessário reenviar o briefing.',array['nome','proposta','proposta_url']::text[]),
    ('wmp.proposal.accepted','wmp.proposal.accepted','SERVICE','Aceite registrado — WMP','Olá {{nome}}. Registramos o aceite da proposta {{proposta}} para {{evento}}. A próxima etapa é a formalização contratual com os mesmos dados comerciais aprovados.',array['nome','proposta','evento']::text[]),
    ('wmp.contract.sent','wmp.contract.sent','ACCOUNT','Contrato WMP disponível para formalização','Olá {{nome}}. O contrato referente à proposta {{proposta}} está disponível em {{contrato_url}}. Revise os dados antes da formalização; em caso de divergência, interrompa o aceite e contate a WMP.',array['nome','proposta','contrato_url']::text[]),
    ('wmp.event.confirmed','wmp.event.confirmed','SCHEDULING','Evento confirmado com a WMP','Olá {{nome}}. O evento {{evento}} está confirmado para {{data_evento}}. Local registrado: {{local_evento}}. Alterações devem ser comunicadas pelo atendimento WMP para manter agenda, equipe, equipamentos e logística sincronizados.',array['nome','evento','data_evento','local_evento']::text[]),
    ('wmp.event.pre_event','wmp.event.pre_event','OPERATIONS','Alinhamento pré-evento — WMP','Olá {{nome}}. Estamos na etapa de preparação do evento {{evento}}, em {{data_evento}}. Informe pelo atendimento WMP qualquer mudança de acesso, horário, responsável local ou condição operacional.',array['nome','evento','data_evento']::text[]),
    ('wmp.payment.update','wmp.payment.update','BILLING','Atualização financeira do seu evento WMP','Olá {{nome}}. Há uma atualização financeira vinculada ao evento {{evento}}. Status registrado: {{status_pagamento}}. Para valores, vencimentos ou comprovantes, utilize somente os dados e links oficiais enviados pela WMP.',array['nome','evento','status_pagamento']::text[]),
    ('wmp.dj.assignment','wmp.dj.assignment','OPERATIONS','Escala de evento — WMP','Olá {{nome_dj}}. Você possui uma escala WMP para {{evento}}, em {{data_evento}}. Cachê, alimentação, estacionamento e eventual locação de equipamento são controlados separadamente no sistema. Consulte o detalhamento oficial antes de confirmar.',array['nome_dj','evento','data_evento']::text[]),
    ('wmp.supplier.assignment','wmp.supplier.assignment','OPERATIONS','Operação de evento — WMP','Olá {{nome}}. Existe uma demanda WMP vinculada ao evento {{evento}}, em {{data_evento}}. Escopo, valores, horários e condições devem seguir exclusivamente a contratação registrada pela WMP. Em caso de divergência, não execute alteração sem validação operacional.',array['nome','evento','data_evento']::text[])
  ) as x(template_key,event_type,category,subject_template,text_template,required_variables)
  loop
    insert into public.communication_templates (tenant_id,template_key,event_type,channel,category,locale,status,current_version)
    values (v_tenant,rec.template_key,rec.event_type,'EMAIL',rec.category::communication_category,'pt-BR','PUBLISHED',1)
    on conflict (tenant_id,template_key,locale) do update
      set event_type=excluded.event_type, channel='EMAIL', category=excluded.category, status='PUBLISHED', current_version=greatest(coalesce(communication_templates.current_version,0),1), updated_at=now()
    returning id into v_id;

    insert into public.communication_template_versions (tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,required_variables,optional_variables,approval_status,published_at)
    values (v_tenant,v_id,1,rec.subject_template,null,'<p>' || replace(rec.text_template, E'\n','</p><p>') || '</p>',rec.text_template,rec.required_variables,array[]::text[],'APPROVED',now())
    on conflict (template_id,version) do update
      set subject_template=excluded.subject_template, html_template=excluded.html_template, text_template=excluded.text_template, required_variables=excluded.required_variables, approval_status='APPROVED', published_at=coalesce(communication_template_versions.published_at,now());
  end loop;
end $$;
