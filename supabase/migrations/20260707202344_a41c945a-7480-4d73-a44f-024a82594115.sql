
-- === 1. Garante colunas usadas pela auditoria ============================
ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS show_on_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS paused BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS alert_whatsapps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- === 2. TI: destinatários padrão de alerta ===============================
-- Lista mestre de contatos que recebem alerta imediato de qualquer domínio
-- Impulsionando ou de tenant que sair do ar. Managed via SQL/admin.
CREATE TABLE IF NOT EXISTS public.core_alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  address TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'domain', -- 'domain' | 'all' | outras categorias
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, address, scope)
);
GRANT SELECT ON public.core_alert_recipients TO authenticated;
GRANT ALL ON public.core_alert_recipients TO service_role;
ALTER TABLE public.core_alert_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff read alert recipients" ON public.core_alert_recipients;
CREATE POLICY "staff read alert recipients"
  ON public.core_alert_recipients FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

INSERT INTO public.core_alert_recipients (channel, address, scope)
VALUES
  ('email', 'raygs@hotmail.com', 'domain'),
  ('email', 'sac@impulsionando.com.br', 'domain')
ON CONFLICT DO NOTHING;

-- === 3. Helper: monta arrays de destinatários TI para um alvo ============
CREATE OR REPLACE FUNCTION public.core_alert_recipients_for(_scope TEXT)
RETURNS TABLE(emails TEXT[], whatsapps TEXT[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(ARRAY_AGG(DISTINCT address) FILTER (WHERE channel='email'), ARRAY[]::TEXT[]),
    COALESCE(ARRAY_AGG(DISTINCT address) FILTER (WHERE channel='whatsapp'), ARRAY[]::TEXT[])
  FROM public.core_alert_recipients
  WHERE is_active AND scope IN (_scope, 'all');
$$;

-- === 4. Registrar/atualizar um alvo de uptime (upsert seguro) ============
CREATE OR REPLACE FUNCTION public.core_register_uptime_target(
  p_url TEXT,
  p_label TEXT,
  p_category TEXT DEFAULT 'domain'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ti_emails TEXT[];
  ti_whats TEXT[];
BEGIN
  SELECT emails, whatsapps INTO ti_emails, ti_whats
  FROM public.core_alert_recipients_for(p_category);

  INSERT INTO public.uptime_state (url, is_up, label, category, show_on_public, paused, alert_emails, alert_whatsapps)
  VALUES (p_url, TRUE, p_label, p_category, TRUE, FALSE, ti_emails, ti_whats)
  ON CONFLICT (url) DO UPDATE
    SET label = EXCLUDED.label,
        category = EXCLUDED.category,
        show_on_public = TRUE,
        paused = FALSE,
        alert_emails = (
          SELECT ARRAY(SELECT DISTINCT unnest(uptime_state.alert_emails || EXCLUDED.alert_emails))
        ),
        alert_whatsapps = (
          SELECT ARRAY(SELECT DISTINCT unnest(uptime_state.alert_whatsapps || EXCLUDED.alert_whatsapps))
        );
END;
$$;
REVOKE ALL ON FUNCTION public.core_register_uptime_target(TEXT, TEXT, TEXT) FROM PUBLIC;

-- === 5. Seed dos domínios oficiais do Impulsionando ======================
SELECT public.core_register_uptime_target('https://impulsionando.com.br',      'impulsionando.com.br',      'domain');
SELECT public.core_register_uptime_target('https://www.impulsionando.com.br',  'www.impulsionando.com.br',  'domain');
SELECT public.core_register_uptime_target('https://wmp.impulsionando.com.br',  'wmp.impulsionando.com.br',  'domain');
SELECT public.core_register_uptime_target('https://riomed.impulsionando.com.br','riomed.impulsionando.com.br','domain');
SELECT public.core_register_uptime_target('https://chrismed.impulsionando.com.br','chrismed.impulsionando.com.br','domain');
SELECT public.core_register_uptime_target('https://impulsitity.impulsionando.com.br','impulsitity.impulsionando.com.br','domain');
SELECT public.core_register_uptime_target('https://dqa.impulsionando.com.br',  'dqa.impulsionando.com.br',  'domain');
SELECT public.core_register_uptime_target('https://imobiliaria.garrido.impulsionando.com.br','imobiliaria.garrido.impulsionando.com.br','domain');

-- === 6. Seed automático de todo tenant com domínio provisionado ==========
INSERT INTO public.uptime_state (url, is_up, label, category, show_on_public, paused, alert_emails, alert_whatsapps)
SELECT
  'https://' || COALESCE(t.custom_domain, t.full_domain),
  TRUE,
  COALESCE(t.custom_domain, t.full_domain),
  'domain',
  TRUE,
  FALSE,
  (SELECT emails FROM public.core_alert_recipients_for('domain')),
  (SELECT whatsapps FROM public.core_alert_recipients_for('domain'))
FROM public.core_tenant_identity t
WHERE COALESCE(t.custom_domain, t.full_domain) IS NOT NULL
ON CONFLICT (url) DO NOTHING;

-- === 7. Trigger: novo tenant → adiciona ao monitoramento =================
CREATE OR REPLACE FUNCTION public.core_tenant_domain_uptime_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  dom TEXT;
BEGIN
  dom := COALESCE(NEW.custom_domain, NEW.full_domain);
  IF dom IS NOT NULL AND dom <> '' THEN
    PERFORM public.core_register_uptime_target('https://' || dom, dom, 'domain');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_tenant_domain_uptime_sync ON public.core_tenant_identity;
CREATE TRIGGER trg_tenant_domain_uptime_sync
AFTER INSERT OR UPDATE OF custom_domain, full_domain ON public.core_tenant_identity
FOR EACH ROW EXECUTE FUNCTION public.core_tenant_domain_uptime_sync();

-- === 8. Reagendamento pg_cron ============================================
-- Recurso geral: a cada 1 min (antes: 5 min)
SELECT public.core_schedule_cron('core-uptime-check-1min', '* * * * *', '/api/public/hooks/uptime-check');

-- Domínios: 30 s de resolução. pg_cron não tem sub-minuto, então rodamos o
-- job 1x por minuto e ele executa 2 pings (imediato + pg_sleep 30s).
DO $$
DECLARE
  jid BIGINT;
  base_url TEXT := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app';
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'core-uptime-domains-30s';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;

  PERFORM cron.schedule(
    'core-uptime-domains-30s',
    '* * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'apikey', COALESCE(
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='SUPABASE_ANON_KEY' LIMIT 1),
            current_setting('app.settings.anon_key', true), ''
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 25000
      );
      SELECT pg_sleep(30);
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'apikey', COALESCE(
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='SUPABASE_ANON_KEY' LIMIT 1),
            current_setting('app.settings.anon_key', true), ''
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 25000
      );
    $job$,
      base_url || '/api/public/hooks/uptime-check?category=domain',
      base_url || '/api/public/hooks/uptime-check?category=domain'
    )
  );

  -- Remove o antigo job de 5 min se existir
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'core-uptime-check-5min';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END;
$$;

-- === 9. Reforça alert_emails/whatsapps existentes dos alvos "domain" =====
-- Garante que TODO alvo já cadastrado como categoria=domain receba TI.
UPDATE public.uptime_state s
SET
  alert_emails = (
    SELECT ARRAY(SELECT DISTINCT unnest(s.alert_emails || (SELECT emails FROM public.core_alert_recipients_for('domain'))))
  ),
  alert_whatsapps = (
    SELECT ARRAY(SELECT DISTINCT unnest(s.alert_whatsapps || (SELECT whatsapps FROM public.core_alert_recipients_for('domain'))))
  )
WHERE category = 'domain';

INSERT INTO public.audit_logs (action, entity, entity_id, metadata)
VALUES (
  'uptime.monitoring.upgraded',
  'pg_cron',
  NULL,
  jsonb_build_object(
    'domains_ping_seconds', 30,
    'general_ping_seconds', 60,
    'ti_recipients_source', 'core_alert_recipients',
    'auto_seed_from_tenant_identity', true,
    'applied_at', now()
  )
);
