-- Deferred idempotent CHRISMED transactional communication catalog.
-- Runs after the universal communication Core exists.
do $m$
declare
  v_tenant uuid;
  v_brand uuid;
  v_master uuid;
  r record;
  v_template uuid;
  v_html text;
begin
  if to_regclass('public.communication_tenants') is null
     or to_regclass('public.communication_brands') is null
     or to_regclass('public.communication_templates') is null
     or to_regclass('public.communication_template_versions') is null
     or to_regclass('public.communication_automations') is null then
    raise exception 'communication_core_required_for_chrismed_transactional_seed';
  end if;

  select id into strict v_tenant from public.communication_tenants where slug='chrismed' and active=true;
  select id into strict v_brand from public.communication_brands where tenant_id=v_tenant and domain='chrismed.com.br' and deleted_at is null limit 1;
  select id into strict v_master from auth.users where lower(email)='raygs@hotmail.com' limit 1;

  for r in
    select * from (values
      ('account.welcome','account.welcome','ACCOUNT','Bem-vindo(a) à CHRISMED','Seu cadastro na CHRISMED foi realizado com sucesso.','Acesse sua área exclusiva para acompanhar seus dados e serviços.','area_url'),
      ('professional.registration_received','professional.registration_received','ACCOUNT','Recebemos seu cadastro profissional','Seu cadastro como profissional da saúde foi recebido.','A equipe CHRISMED fará a validação dos dados informados.',''),
      ('professional.registration_approved','professional.registration_approved','ACCOUNT','Seu cadastro profissional foi aprovado','Seu acesso profissional CHRISMED está liberado.','Entre na sua área exclusiva para configurar agenda, perfil e preferências.','area_url'),
      ('appointment.hold_created','appointment.hold_created','SCHEDULING','Seu horário está reservado temporariamente','Criamos uma reserva temporária para o horário escolhido.','Conclua a confirmação dentro do prazo indicado para garantir o atendimento.','appointment_url'),
      ('appointment.confirmed','appointment.confirmed','SCHEDULING','Consulta confirmada','Seu agendamento CHRISMED está confirmado.','Confira data, horário, profissional e orientações na sua área do paciente.','appointment_url'),
      ('appointment.reminder_24h','appointment.reminder_24h','SCHEDULING','Lembrete: sua consulta é amanhã','Sua consulta CHRISMED está próxima.','Confira os dados do atendimento e, se necessário, cancele ou remarque pela sua área.','appointment_url'),
      ('appointment.reminder_2h','appointment.reminder_2h','SCHEDULING','Sua consulta começa em breve','Faltam aproximadamente duas horas para seu atendimento.','Consulte as orientações e o local ou link do atendimento.','appointment_url'),
      ('appointment.cancelled','appointment.cancelled','SCHEDULING','Agendamento cancelado','Seu agendamento foi cancelado.','Você pode consultar outros horários disponíveis na CHRISMED.','booking_url'),
      ('appointment.rescheduled','appointment.rescheduled','SCHEDULING','Agendamento remarcado','Seu agendamento foi atualizado.','Confira a nova data e o novo horário na sua área.','appointment_url'),
      ('appointment.completed','appointment.completed','SERVICE','Atendimento concluído','Esperamos que seu atendimento tenha sido excelente.','Sua área CHRISMED mantém o histórico dos seus agendamentos.','area_url'),
      ('pega_agenda.offer','pega_agenda.offer','SCHEDULING','Nova oportunidade no Pega Agenda','Há um horário compatível disponível para você.','A oportunidade é limitada e será atribuída ao primeiro aceite transacional válido.','offer_url'),
      ('pega_agenda.claimed','pega_agenda.claimed','SCHEDULING','Horário assumido com sucesso','O horário do Pega Agenda foi atribuído à sua agenda.','Confira os detalhes e prepare o atendimento.','agenda_url'),
      ('event.registration_confirmed','event.registration_confirmed','SERVICE','Inscrição confirmada no evento CHRISMED','Sua participação no evento está confirmada.','Consulte os detalhes do evento e as orientações de acesso.','event_url'),
      ('event.reminder_24h','event.reminder_24h','SERVICE','Lembrete: evento CHRISMED amanhã','O evento para o qual você se inscreveu acontece amanhã.','Confira horário, local e instruções.','event_url'),
      ('event.checkin_confirmed','event.checkin_confirmed','SERVICE','Check-in realizado','Sua presença no evento CHRISMED foi registrada.','Aproveite a programação.','event_url'),
      ('event.post_survey','event.post_survey','SURVEY','Conte para nós como foi o evento','Sua opinião ajuda a CHRISMED a aprimorar os próximos encontros.','A pesquisa é rápida e objetiva.','survey_url'),
      ('crm.lead_welcome','crm.lead_welcome','MARKETING','Bem-vindo(a) à CHRISMED','Obrigado pelo seu interesse na CHRISMED.','Vamos apresentar conteúdos e serviços de acordo com o seu perfil e suas preferências.','site_url'),
      ('crm.lead_nurture','crm.lead_nurture','MARKETING','CHRISMED: informação e cuidado para você','Selecionamos informações e possibilidades relevantes para o seu relacionamento com a CHRISMED.','Consulte os serviços disponíveis.','site_url'),
      ('crm.reactivation','crm.reactivation','MARKETING','A CHRISMED continua à sua disposição','Faz algum tempo desde nosso último contato.','Quando precisar, encontre profissionais, agenda e serviços em um só ecossistema.','site_url'),
      ('security.password_reset','security.password_reset','SECURITY','Redefinição de senha CHRISMED','Recebemos uma solicitação para redefinir sua senha.','Use o link seguro para criar uma nova senha. Se não foi você, ignore esta mensagem.','reset_url')
    ) as x(template_key,event_type,category,subject,preheader,body,cta_var)
  loop
    insert into public.communication_templates(
      tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version,created_by
    ) values (
      v_tenant,v_brand,r.template_key,r.event_type,'EMAIL',r.category::public.communication_category,'pt-BR','PUBLISHED',1,v_master
    )
    on conflict (tenant_id,template_key,locale) do update
      set brand_id=excluded.brand_id,event_type=excluded.event_type,channel=excluded.channel,
          category=excluded.category,status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null
    returning id into v_template;

    v_html := '<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#17212b;line-height:1.55"><main style="max-width:640px;margin:auto;padding:32px"><h1 style="font-size:24px">'||r.subject||'</h1><p>'||r.body||'</p>' ||
      case when r.cta_var<>'' then '<p><a href="{{'||r.cta_var||'}}" style="display:inline-block;padding:12px 18px;background:#173f62;color:#fff;text-decoration:none;border-radius:6px">Acessar CHRISMED</a></p>' else '' end ||
      '<hr><p style="font-size:12px;color:#667085">CHRISMED · Atendimento: sac@chrismed.com.br</p></main></body></html>';

    insert into public.communication_template_versions(
      tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
      variables_schema,required_variables,optional_variables,fallback_values,approval_status,created_by,approved_by,published_at
    ) values (
      v_tenant,v_template,1,r.subject,r.preheader,v_html,
      r.subject||E'\n\n'||r.body||case when r.cta_var<>'' then E'\n\nAcesse: {{'||r.cta_var||'}}' else '' end||E'\n\nCHRISMED · sac@chrismed.com.br',
      '{}'::jsonb,case when r.cta_var<>'' then array[r.cta_var] else '{}'::text[] end,'{}'::text[],'{}'::jsonb,
      'APPROVED',v_master,v_master,now()
    ) on conflict (template_id,version) do update set
      subject_template=excluded.subject_template,preheader_template=excluded.preheader_template,
      html_template=excluded.html_template,text_template=excluded.text_template,
      required_variables=excluded.required_variables,approval_status='APPROVED',approved_by=v_master,published_at=coalesce(public.communication_template_versions.published_at,now());
  end loop;

  for r in
    select automation_key from (values
      ('account.welcome'),('professional.registration_received'),('professional.registration_approved'),
      ('appointment.hold_created'),('appointment.confirmed'),('appointment.reminder_24h'),('appointment.reminder_2h'),
      ('appointment.cancelled'),('appointment.rescheduled'),('appointment.completed'),
      ('pega_agenda.offer'),('pega_agenda.claimed'),
      ('event.registration_confirmed'),('event.reminder_24h'),('event.checkin_confirmed'),('event.post_survey'),
      ('crm.lead_welcome'),('crm.lead_nurture'),('crm.reactivation'),('security.password_reset'),
      ('communication.outbox_dispatch')
    ) as a(automation_key)
  loop
    insert into public.communication_automations(tenant_id,automation_key,version,n8n_workflow_id,status,config)
    values(v_tenant,r.automation_key,1,null,'DRAFT',jsonb_build_object(
      'source','chatgpt-direct','requires_n8n',true,'locale','pt-BR',
      'correlation_id_required',true,'idempotency_required',true,
      'official_sender','sac@chrismed.com.br','channels',jsonb_build_array('email','whatsapp')
    ))
    on conflict (tenant_id,automation_key,version) do update
      set config=excluded.config,
          status=case when public.communication_automations.n8n_workflow_id is null then 'DRAFT' else public.communication_automations.status end,
          updated_at=now();
  end loop;
end
$m$;
