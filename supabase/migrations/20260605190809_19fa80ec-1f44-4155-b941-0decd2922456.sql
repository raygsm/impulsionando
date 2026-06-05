
-- 1. Past due tracking
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz;

CREATE INDEX IF NOT EXISTS idx_subscriptions_past_due_since
  ON public.subscriptions(past_due_since)
  WHERE past_due_since IS NOT NULL;

-- 2. Dunning job: suspende módulos depois de 3 dias em past_due
CREATE OR REPLACE FUNCTION public.subscription_suspend_overdue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  _company uuid;
  _count integer := 0;
BEGIN
  FOR r IN
    SELECT s.id, s.user_id, s.paddle_subscription_id
    FROM public.subscriptions s
    WHERE s.status = 'past_due'
      AND s.past_due_since IS NOT NULL
      AND s.past_due_since < now() - interval '3 days'
  LOOP
    SELECT company_id INTO _company
    FROM public.user_profiles
    WHERE user_id = r.user_id AND is_active = true
    ORDER BY created_at LIMIT 1;

    IF _company IS NOT NULL THEN
      UPDATE public.company_modules
        SET is_enabled = false, updated_at = now()
        WHERE company_id = _company;
    END IF;

    UPDATE public.subscriptions
      SET status = 'suspended', updated_at = now()
      WHERE id = r.id;

    PERFORM public.enqueue_message(
      'subscription_suspended', _company, r.user_id,
      (SELECT email FROM public.user_profiles WHERE user_id = r.user_id LIMIT 1),
      NULL,
      (SELECT display_name FROM public.user_profiles WHERE user_id = r.user_id LIMIT 1),
      jsonb_build_object('subscription_id', r.paddle_subscription_id),
      ARRAY['email','in_app']::text[],
      'subscription', r.id::text
    );
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END $$;

REVOKE EXECUTE ON FUNCTION public.subscription_suspend_overdue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscription_suspend_overdue() TO service_role;

-- 3. Templates faltantes (PT-BR)
INSERT INTO public.message_templates (event_code, channel, subject, body, is_active)
VALUES
  ('subscription_canceled', 'email', 'Sua assinatura foi cancelada',
   E'Olá {{recipient_name}},\n\nConfirmamos o cancelamento da sua assinatura. O acesso permanecerá ativo até o fim do período já pago.\n\nSe foi engano, responda este e-mail e reativaremos para você.\n\n— Equipe Impulsionando', true),
  ('subscription_canceled', 'whatsapp', NULL,
   E'Olá {{recipient_name}}! 👋\n\nSeu cancelamento foi processado. O acesso fica disponível até o fim do ciclo atual.\nQualquer dúvida, é só responder por aqui.', true),
  ('subscription_canceled', 'in_app', 'Assinatura cancelada',
   'Você cancelou sua assinatura. O acesso permanece até o fim do período pago.', true),

  ('payment_failed_dunning', 'email', '⚠️ Falha no pagamento da sua assinatura',
   E'Olá {{recipient_name}},\n\nNão conseguimos processar o pagamento da sua assinatura. Para evitar a suspensão do acesso, atualize seu método de pagamento nos próximos 3 dias.\n\nAcesse: {{portal_url}}\n\n— Equipe Impulsionando', true),
  ('payment_failed_dunning', 'whatsapp', NULL,
   E'Olá {{recipient_name}}! ⚠️\n\nFalha no pagamento da sua assinatura. Você tem 3 dias para regularizar antes da suspensão.\nAtualize: {{portal_url}}', true),
  ('payment_failed_dunning', 'in_app', 'Pagamento recusado',
   'Atualize seu método de pagamento em até 3 dias para manter o acesso.', true),

  ('subscription_suspended', 'email', 'Acesso suspenso por inadimplência',
   E'Olá {{recipient_name}},\n\nSua assinatura foi suspensa por falta de pagamento. Para reativar, regularize a cobrança no portal.\n\n— Equipe Impulsionando', true),
  ('subscription_suspended', 'in_app', 'Acesso suspenso',
   'Sua assinatura foi suspensa. Regularize a cobrança para reativar.', true),

  ('welcome_post_checkout', 'email', 'Bem-vindo! Defina sua senha de acesso',
   E'Olá {{recipient_name}},\n\nSua assinatura foi confirmada! 🎉\n\nPara acessar o sistema, defina sua senha clicando no link abaixo:\n{{reset_link}}\n\n— Equipe Impulsionando', true),
  ('welcome_post_checkout', 'in_app', 'Bem-vindo à Impulsionando',
   'Sua conta foi criada após o pagamento. Verifique seu e-mail para definir a senha.', true)
ON CONFLICT DO NOTHING;

-- 4. Cron diário para dunning
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('subscription_dunning_daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='subscription_dunning_daily');
    PERFORM cron.schedule(
      'subscription_dunning_daily',
      '0 6 * * *',
      'SELECT public.subscription_suspend_overdue();'
    );
  END IF;
END $$;
