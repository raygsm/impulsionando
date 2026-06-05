INSERT INTO public.message_templates (event_code, channel, subject, body, is_active) VALUES
('subscription_reactivated', 'email', 'Sua assinatura foi reativada', 'Olá {{recipient_name}},

Tudo certo! Sua assinatura foi reativada e vai continuar renovando normalmente no próximo ciclo.

Você não precisa fazer mais nada. Se mudar de ideia, é possível cancelar a qualquer momento em "Minha assinatura".

Equipe Impulsionando Tecnologia', true),
('subscription_reactivated', 'in_app', 'Assinatura reativada', 'Sua assinatura foi reativada com sucesso. A renovação automática volta a valer no próximo ciclo.', true),
('subscription_reactivated', 'whatsapp', NULL, 'Olá {{recipient_name}}! Sua assinatura da Impulsionando foi reativada. Tudo certo, sem mais nenhuma ação necessária. 🎉', true)
ON CONFLICT DO NOTHING;