
INSERT INTO public.core_funnel_rules
  (stage, event_name, niche_slug, workflow_name, delay_minutes, active, description, payload_template)
VALUES
  -- GLOBAL
  ('capture','lead.created',NULL,'global.boas_vindas',0,false,'Mensagem de boas-vindas a qualquer novo lead',
    '{"channel":"whatsapp","template":"welcome_generic","vars":{"first_name":"{{lead.first_name}}"}}'),
  ('convert','opportunity.won',NULL,'global.agradecimento',5,false,'Agradecimento pós-conversão',
    '{"channel":"whatsapp","template":"thanks_generic"}'),
  ('retain','customer.churn_risk',NULL,'global.reativacao',0,false,'Reativação de cliente em risco',
    '{"channel":"email","template":"reactivate_generic"}'),

  -- IMOBILIARIA
  ('capture','realestate.visit_scheduled','imobiliaria','imob.regua_visita',60,false,'Lembrete D-1 da visita ao imóvel',
    '{"channel":"whatsapp","template":"imob_visit_reminder","vars":{"property_title":"{{property.title}}","when":"{{visit.scheduled_at}}"}}'),
  ('convert','realestate.proposal_sent','imobiliaria','imob.followup_proposta',1440,false,'Follow-up 24h após envio de proposta','{"channel":"whatsapp","template":"imob_proposal_followup"}'),
  ('retain','realestate.contract_anniversary','imobiliaria','imob.aniversario_contrato',0,false,'Cumprimento no aniversário do contrato','{"channel":"email","template":"imob_anniversary"}'),

  -- EVENTOS
  ('convert','event.ticket_purchased','eventos','evt.confirmacao_ingresso',0,false,'Confirmação imediata de ingresso','{"channel":"email","template":"evt_ticket_confirmation","vars":{"qr_url":"{{ticket.qr_url}}"}}'),
  ('relate','event.starts_in_24h','eventos','evt.lembrete_d1',0,false,'Lembrete D-1 do evento','{"channel":"whatsapp","template":"evt_reminder_d1"}'),
  ('retain','event.completed','eventos','evt.nps_pos_evento',2880,false,'NPS 48h após o evento','{"channel":"email","template":"evt_nps_survey"}'),

  -- BAR
  ('capture','clube.first_checkin','bar','bar.convite_clube',0,false,'Convite ao clube no primeiro check-in','{"channel":"whatsapp","template":"bar_join_club"}'),
  ('relate','customer.birthday','bar','bar.aniversario',0,false,'Oferta de aniversário','{"channel":"whatsapp","template":"bar_birthday_offer"}'),
  ('retain','clube.no_visit_30d','bar','bar.ganha_recompra',0,false,'Recompra após 30 dias sem visita','{"channel":"whatsapp","template":"bar_winback_30d"}'),

  -- RESTAURANTE
  ('capture','restaurant.first_visit','restaurante','resto.convite_clube',0,false,'Convite ao clube após primeira visita','{"channel":"whatsapp","template":"resto_join_club"}'),
  ('relate','customer.birthday','restaurante','resto.aniversario',0,false,'Oferta de aniversário','{"channel":"whatsapp","template":"resto_birthday"}'),
  ('retain','restaurant.no_visit_30d','restaurante','resto.ganha_recompra',0,false,'Recompra após 30 dias','{"channel":"whatsapp","template":"resto_winback_30d"}'),

  -- CLINICA
  ('convert','agenda.appointment_confirmed','clinica','clinica.confirmacao_consulta',0,false,'Confirmação imediata da consulta','{"channel":"whatsapp","template":"clinic_appointment_confirm"}'),
  ('retain','agenda.return_due','clinica','clinica.retorno_6m',0,false,'Convite de retorno 6 meses','{"channel":"whatsapp","template":"clinic_return_6m"}'),
  ('relate','agenda.exam_reminder','clinica','clinica.lembrete_exame',0,false,'Lembrete de exame agendado','{"channel":"whatsapp","template":"clinic_exam_reminder"}'),

  -- ADVOCACIA
  ('relate','legal.case_update','advocacia','adv.atualizacao_processual',0,false,'Atualização processual ao cliente','{"channel":"email","template":"law_case_update"}'),
  ('retain','customer.birthday','advocacia','adv.aniversario',0,false,'Aniversário do cliente','{"channel":"whatsapp","template":"law_birthday"}'),

  -- EDUCACAO
  ('capture','educ.matricula_efetivada','educacao','educ.boas_vindas_aluno',0,false,'Boas-vindas ao aluno matriculado','{"channel":"email","template":"educ_student_welcome"}'),
  ('retain','educ.evasao_risco','educacao','educ.alerta_evasao',0,false,'Alerta de evasão (atraso/notas)','{"channel":"whatsapp","template":"educ_dropout_risk"}'),
  ('expand','educ.matricula_renovavel','educacao','educ.renovacao_matricula',0,false,'Convite de renovação de matrícula','{"channel":"email","template":"educ_renewal"}'),

  -- CONTABILIDADE
  ('relate','contab.obligation_due','contabilidade','contab.alerta_obrigacao',0,false,'Alerta de obrigação fiscal ao cliente','{"channel":"email","template":"contab_obligation_due"}'),
  ('retain','contab.month_close','contabilidade','contab.fechamento_mensal',0,false,'Comunicado de fechamento mensal','{"channel":"email","template":"contab_month_close"}'),

  -- CERVEJARIA
  ('relate','brewery.tasting_open','cervejaria','brew.convite_degustacao',0,false,'Convite à degustação','{"channel":"whatsapp","template":"brewery_tasting_invite"}'),
  ('retain','brewery.sellout_close','cervejaria','brew.sellout_mensal',0,false,'Sellout mensal ao distribuidor','{"channel":"email","template":"brewery_sellout_report"}')
ON CONFLICT (stage, event_name, COALESCE(niche_slug,''), workflow_name) DO NOTHING;
