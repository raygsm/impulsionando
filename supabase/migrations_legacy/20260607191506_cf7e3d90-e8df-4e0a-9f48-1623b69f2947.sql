
INSERT INTO public.setting_definitions (key, label, description, category, value_type, default_value, is_company_editable, sort_order) VALUES
-- AGENDA (complementos)
('agenda.confirm_after_payment', 'Confirmar automaticamente após pagamento', 'Confirma o agendamento assim que o pagamento for aprovado.', 'agenda', 'boolean', 'true'::jsonb, true, 10),
('agenda.hold_minutes', 'Tempo de reserva temporária (min)', 'Quantos minutos o horário fica reservado aguardando pagamento.', 'agenda', 'number', '15'::jsonb, true, 11),
('agenda.cancel_min_hours', 'Prazo mínimo para cancelamento (horas)', 'Antecedência mínima para o cliente cancelar.', 'agenda', 'number', '24'::jsonb, true, 12),
('agenda.reschedule_min_hours', 'Prazo mínimo para remarcação (horas)', 'Antecedência mínima para o cliente remarcar.', 'agenda', 'number', '12'::jsonb, true, 13),
('agenda.notify_professional', 'Notificar profissional', 'Envia notificação ao profissional em cada novo agendamento.', 'agenda', 'boolean', 'true'::jsonb, true, 14),
('agenda.notify_manager', 'Notificar gestor', 'Envia notificação ao gestor responsável.', 'agenda', 'boolean', 'false'::jsonb, true, 15),

-- FINANCEIRO (complementos)
('billing.due_day', 'Dia padrão de vencimento', 'Dia do mês para vencimento das faturas recorrentes.', 'financeiro', 'number', '10'::jsonb, true, 10),
('billing.tolerance_days', 'Tolerância (dias)', 'Dias de tolerância após o vencimento antes de aplicar multa.', 'financeiro', 'number', '3'::jsonb, true, 11),
('billing.late_fee_percent', 'Multa por atraso (%)', 'Percentual de multa aplicado sobre o valor da fatura.', 'financeiro', 'number', '2'::jsonb, true, 12),
('billing.interest_per_day_percent', 'Juros ao dia (%)', 'Percentual de juros aplicado por dia de atraso.', 'financeiro', 'number', '0.033'::jsonb, true, 13),
('billing.discount_until_due', 'Desconto pontualidade (%)', 'Percentual de desconto se pago até o vencimento.', 'financeiro', 'number', '0'::jsonb, true, 14),
('billing.pix_key', 'Chave Pix', 'Chave Pix usada nos boletos e cobranças.', 'financeiro', 'text', '""'::jsonb, true, 15),
('billing.pix_copy_paste', 'Pix Copia e Cola', 'Código Pix Copia e Cola padrão.', 'financeiro', 'text', '""'::jsonb, true, 16),
('billing.payment_link', 'Link de pagamento', 'Link padrão de checkout/cobrança.', 'financeiro', 'text', '""'::jsonb, true, 17),
('billing.gateway_active', 'Gateway de pagamento ativo', 'Habilita o gateway online de pagamento.', 'financeiro', 'boolean', 'true'::jsonb, true, 18),
('billing.auto_suspend', 'Suspensão automática por inadimplência', 'Suspende o cliente automaticamente após o limite de atraso.', 'financeiro', 'boolean', 'true'::jsonb, true, 19),
('billing.auto_reactivate', 'Reativação automática após pagamento', 'Reativa o cliente assim que a fatura for marcada como paga.', 'financeiro', 'boolean', 'true'::jsonb, true, 20),
('billing.allow_manual_payment', 'Permitir baixa manual', 'Permite marcar faturas como pagas manualmente.', 'financeiro', 'boolean', 'true'::jsonb, true, 21),

-- FISCAL
('fiscal.issue_invoice', 'Emitir nota fiscal', 'Habilita emissão de notas fiscais para este cliente.', 'fiscal', 'boolean', 'false'::jsonb, true, 0),
('fiscal.auto_issue_after_payment', 'Emitir nota automaticamente após pagamento', 'Emite a NF assim que o pagamento for confirmado.', 'fiscal', 'boolean', 'false'::jsonb, true, 1),
('fiscal.service_code', 'Código de serviço', 'Código do serviço municipal usado na NFS-e.', 'fiscal', 'text', '""'::jsonb, true, 2),
('fiscal.service_description', 'Descrição do serviço', 'Descrição padrão na NFS-e.', 'fiscal', 'text', '""'::jsonb, true, 3),
('fiscal.iss_rate', 'Alíquota ISS (%)', 'Alíquota de ISS aplicada na NFS-e.', 'fiscal', 'number', '0'::jsonb, true, 4),
('fiscal.city', 'Município de emissão', 'Município onde a NF é emitida.', 'fiscal', 'text', '""'::jsonb, true, 5),
('fiscal.email', 'E-mail fiscal', 'E-mail que recebe cópia das notas emitidas.', 'fiscal', 'text', '""'::jsonb, true, 6),

-- COMUNICAÇÃO (complementos)
('comms.sender_name', 'Nome do remetente comercial', 'Nome exibido em e-mails e WhatsApp.', 'comunicacao', 'text', '""'::jsonb, true, 10),
('comms.reply_to_email', 'E-mail de resposta', 'Endereço usado no Reply-To dos e-mails enviados.', 'comunicacao', 'text', '""'::jsonb, true, 11),
('comms.support_whatsapp', 'WhatsApp de suporte', 'Número de WhatsApp exibido como canal de suporte.', 'comunicacao', 'text', '""'::jsonb, true, 12),
('comms.signature', 'Assinatura padrão', 'Assinatura usada no rodapé das mensagens.', 'comunicacao', 'text', '""'::jsonb, true, 13),
('comms.footer', 'Rodapé das mensagens', 'Texto fixo no rodapé das comunicações.', 'comunicacao', 'text', '""'::jsonb, true, 14),
('comms.dashboard_link', 'Link do dashboard', 'URL do painel exibida nas comunicações.', 'comunicacao', 'text', '""'::jsonb, true, 15),
('comms.customer_portal_link', 'Link da área do cliente', 'URL da área do cliente exibida nas comunicações.', 'comunicacao', 'text', '""'::jsonb, true, 16),

-- CRM
('crm.default_source', 'Origem padrão de leads', 'Origem aplicada quando o lead não informa.', 'crm', 'text', '"manual"'::jsonb, true, 0),
('crm.auto_followup_days', 'Follow-up automático (dias)', 'Dias para gerar tarefa de follow-up automático.', 'crm', 'number', '3'::jsonb, true, 1),
('crm.notify_owner_on_new_lead', 'Notificar responsável em novo lead', 'Notifica o dono do lead ao criar.', 'crm', 'boolean', 'true'::jsonb, true, 2),

-- PORTAL DO CLIENTE (complementos)
('portal.show_invoices', 'Exibir faturas na área do cliente', 'Mostra histórico de cobranças.', 'portal', 'boolean', 'true'::jsonb, true, 5),
('portal.allow_self_reschedule', 'Permitir remarcação pelo cliente', 'Cliente final pode remarcar pelo portal.', 'portal', 'boolean', 'true'::jsonb, true, 6),

-- SEGURANÇA
('security.require_strong_password', 'Exigir senha forte', 'Bloqueia senhas curtas ou comuns.', 'seguranca', 'boolean', 'true'::jsonb, true, 5)
ON CONFLICT (key) DO NOTHING;
