
CREATE OR REPLACE FUNCTION public.trial_advance_status()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r RECORD;
  n int := 0;
  days_left numeric;
  has_event boolean;
BEGIN
  FOR r IN SELECT * FROM public.trial_subscriptions
    WHERE status IN ('ativo','vence_3d','vence_1d','vence_hoje','cobranca_gerada','pagamento_pendente')
  LOOP
    -- Diferença em dias (fracionária) entre vencimento e agora
    days_left := EXTRACT(EPOCH FROM (r.ends_at - now())) / 86400.0;

    -- D-3: aviso quando faltam entre 2 e 3 dias inteiros
    IF days_left <= 3 AND days_left > 1 AND r.status = 'ativo' THEN
      SELECT EXISTS (SELECT 1 FROM public.trial_events WHERE trial_id = r.id AND event_type = 'comm.day3_left')
        INTO has_event;
      IF NOT has_event THEN
        UPDATE public.trial_subscriptions SET status = 'vence_3d' WHERE id = r.id;
        PERFORM public.enqueue_message('trial_3days_left', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
          jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text,
                             'dias_restantes', CEIL(days_left)::int),
          ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
        INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'comm.day3_left');
        n := n + 1;
      END IF;

    -- D-1: aviso quando falta entre 0 e 1 dia (>0)
    ELSIF days_left <= 1 AND days_left > 0 AND r.status IN ('ativo','vence_3d') THEN
      SELECT EXISTS (SELECT 1 FROM public.trial_events WHERE trial_id = r.id AND event_type = 'comm.day1_left')
        INTO has_event;
      IF NOT has_event THEN
        UPDATE public.trial_subscriptions SET status = 'vence_1d' WHERE id = r.id;
        PERFORM public.enqueue_message('trial_1day_left', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
          jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text),
          ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
        INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'comm.day1_left');
        n := n + 1;
      END IF;

    -- Expirou: gera cobrança e notifica
    ELSIF days_left <= 0 AND r.status IN ('ativo','vence_3d','vence_1d','vence_hoje') THEN
      SELECT EXISTS (SELECT 1 FROM public.trial_events WHERE trial_id = r.id AND event_type = 'comm.expired')
        INTO has_event;
      IF NOT has_event THEN
        UPDATE public.trial_subscriptions SET status = 'cobranca_gerada' WHERE id = r.id;
        PERFORM public.enqueue_message('trial_ended', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
          jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text,
                             'link_pagamento', 'https://impulsionando.com.br/finance'),
          ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
        INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'comm.expired');
        INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'billing.generated');
        n := n + 1;
      END IF;

    -- Suspende após 24h de cobrança não paga (bloqueio automático)
    ELSIF r.status = 'cobranca_gerada' AND now() >= r.ends_at + interval '24 hours' THEN
      SELECT EXISTS (SELECT 1 FROM public.trial_events WHERE trial_id = r.id AND event_type = 'access.suspended')
        INTO has_event;
      IF NOT has_event THEN
        UPDATE public.trial_subscriptions SET status = 'suspenso', suspended_at = now() WHERE id = r.id;
        PERFORM public.enqueue_message('trial_suspended', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
          jsonb_build_object('nome_cliente', r.contact_name, 'link_financeiro', 'https://impulsionando.com.br/finance'),
          ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
        INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'access.suspended');
        n := n + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN n;
END $$;

-- Cron horário para reagir mais rápido a vencimentos
DO $$ BEGIN PERFORM cron.unschedule('trial-advance-status-hourly'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('trial-advance-status-hourly', '0 * * * *', $cron$ SELECT public.trial_advance_status(); $cron$);
