
INSERT INTO public.message_templates (company_id, event_code, channel, locale, subject, body, variables, is_active)
VALUES
  -- 1. Pagamento confirmado (email)
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'payment_confirmed', 'email', 'pt-BR',
   '✅ Pagamento confirmado — CHRISMED',
   E'Olá {{first_name}},\n\nRecebemos seu pagamento de R$ {{amount_brl}} referente a "{{service_name}}".\n\nNossa equipe entrará em contato em até 1 hora útil para confirmar o horário da sua consulta.\n\nDúvidas? Responda este e-mail ou fale conosco no WhatsApp.\n\nAtenciosamente,\nEquipe CHRISMED',
   '["first_name","amount_brl","service_name","payment_id"]'::jsonb, true),

  -- 2. Pagamento confirmado (whatsapp)
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'payment_confirmed', 'whatsapp', 'pt-BR',
   NULL,
   E'✅ *CHRISMED — Pagamento confirmado*\n\nOlá {{first_name}}! Recebemos R$ {{amount_brl}} para *{{service_name}}*.\n\nEm até 1h útil confirmamos o seu horário. 🩺',
   '["first_name","amount_brl","service_name"]'::jsonb, true),

  -- 3. PIX pendente (email)
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'payment_pending_pix', 'email', 'pt-BR',
   '⏳ Seu PIX está aguardando — CHRISMED',
   E'Olá {{first_name}},\n\nGeramos um PIX de R$ {{amount_brl}} para "{{service_name}}".\n\nO QR Code expira em breve. Pague pelo app do seu banco usando o código copia-e-cola:\n\n{{pix_code}}\n\nAssim que o pagamento for confirmado, enviaremos o link de acesso.',
   '["first_name","amount_brl","service_name","pix_code"]'::jsonb, true),

  -- 4. Agendamento confirmado (email)
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'appointment_booked', 'email', 'pt-BR',
   '📅 Consulta agendada — CHRISMED',
   E'Olá {{first_name}},\n\nSua consulta está confirmada:\n\n🩺 Serviço: {{service_name}}\n📅 Data: {{appointment_date}}\n⏰ Horário: {{appointment_time}}\n👨‍⚕️ Médico: {{doctor_name}}\n\n{{access_instructions}}\n\nEm caso de imprevisto, remarque com no mínimo {{reschedule_hours}}h de antecedência.\n\nAté breve!\nEquipe CHRISMED',
   '["first_name","service_name","appointment_date","appointment_time","doctor_name","access_instructions","reschedule_hours"]'::jsonb, true)
ON CONFLICT DO NOTHING;
