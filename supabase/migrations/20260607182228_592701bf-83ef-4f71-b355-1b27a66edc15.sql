-- Seed operational Sim/Não setting definitions for client parameterization
INSERT INTO public.setting_definitions (key, label, description, category, value_type, default_value, is_company_editable, sort_order) VALUES
  -- Agenda
  ('agenda.online_booking', 'Permitir agendamento online', 'Clientes podem agendar pelo portal público.', 'agenda', 'boolean', 'true'::jsonb, true, 10),
  ('agenda.allow_cancel', 'Permitir cancelamento pelo cliente', 'Cliente pode cancelar o próprio agendamento.', 'agenda', 'boolean', 'true'::jsonb, true, 20),
  ('agenda.allow_reschedule', 'Permitir remarcação pelo cliente', 'Cliente pode remarcar o próprio agendamento.', 'agenda', 'boolean', 'true'::jsonb, true, 30),
  ('agenda.require_payment', 'Exigir pagamento antes da confirmação', 'Agendamento só é confirmado após pagamento.', 'agenda', 'boolean', 'false'::jsonb, true, 40),
  ('agenda.require_cancel_reason', 'Exigir justificativa para cancelamento', 'Pede motivo ao cancelar.', 'agenda', 'boolean', 'false'::jsonb, true, 50),
  -- Comunicação
  ('comms.whatsapp_to_customer', 'Enviar WhatsApp ao cliente', 'Eventos disparam mensagem ao cliente final.', 'comunicacao', 'boolean', 'true'::jsonb, true, 10),
  ('comms.email_to_customer', 'Enviar e-mail ao cliente', 'Eventos disparam e-mail ao cliente final.', 'comunicacao', 'boolean', 'true'::jsonb, true, 20),
  ('comms.whatsapp_to_manager', 'Enviar WhatsApp ao gestor', 'Eventos avisam o gestor por WhatsApp.', 'comunicacao', 'boolean', 'true'::jsonb, true, 30),
  ('comms.email_to_manager', 'Enviar e-mail ao gestor', 'Eventos avisam o gestor por e-mail.', 'comunicacao', 'boolean', 'true'::jsonb, true, 40),
  ('comms.whatsapp_to_professional', 'Avisar profissional por WhatsApp', 'Profissional recebe avisos de agenda.', 'comunicacao', 'boolean', 'true'::jsonb, true, 50),
  ('comms.satisfaction_survey', 'Disparar pesquisa de satisfação', 'Envia pesquisa após atendimento.', 'comunicacao', 'boolean', 'false'::jsonb, true, 60),
  -- Financeiro / Cobrança
  ('billing.auto_charge', 'Gerar cobrança automática', 'Cria fatura automaticamente em recorrências.', 'financeiro', 'boolean', 'true'::jsonb, true, 10),
  ('billing.show_financial_reports', 'Exibir relatórios financeiros', 'Habilita visão financeira para perfis autorizados.', 'financeiro', 'boolean', 'true'::jsonb, true, 20),
  -- Portal do cliente
  ('portal.enabled', 'Exibir área do cliente', 'Disponibiliza portal para clientes/pacientes/consumidores.', 'portal', 'boolean', 'true'::jsonb, true, 10),
  ('portal.show_history', 'Mostrar histórico no portal', 'Cliente vê histórico completo.', 'portal', 'boolean', 'true'::jsonb, true, 20),
  -- Relatórios / Operação
  ('reports.show_operational', 'Exibir relatórios operacionais', 'Habilita relatórios operacionais.', 'relatorios', 'boolean', 'true'::jsonb, true, 10),
  ('ops.allow_record_delete', 'Permitir exclusão de registros', 'Usuários autorizados podem excluir registros.', 'operacao', 'boolean', 'false'::jsonb, true, 10),
  ('ops.log_changes', 'Registrar log de alterações', 'Auditoria completa de mudanças.', 'operacao', 'boolean', 'true'::jsonb, true, 20)
ON CONFLICT (key) DO NOTHING;