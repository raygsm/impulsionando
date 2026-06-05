-- Enums
DO $$ BEGIN
  CREATE TYPE public.trial_status AS ENUM (
    'solicitado','ativo','vence_3d','vence_1d','vence_hoje','encerrado',
    'cobranca_gerada','pagamento_pendente','convertido','suspenso',
    'regularizado','cancelado','expirado_sem_conversao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trial_plan_choice AS ENUM ('essencial','integrado','avancado','sob_medida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- trial_subscriptions
CREATE TABLE IF NOT EXISTS public.trial_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_company text NOT NULL,
  contact_email text NOT NULL,
  contact_whatsapp text NOT NULL,
  contact_doc text,
  chosen_plan public.trial_plan_choice NOT NULL DEFAULT 'essencial',
  status public.trial_status NOT NULL DEFAULT 'solicitado',
  started_at timestamptz,
  ends_at timestamptz,
  extended_days int NOT NULL DEFAULT 0,
  extended_by uuid REFERENCES auth.users(id),
  extension_reason text,
  paddle_subscription_id text,
  paddle_transaction_id text,
  converted_at timestamptz,
  suspended_at timestamptz,
  regularized_at timestamptz,
  cancelled_at timestamptz,
  setup_charged boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  terms_ip text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_subs_status ON public.trial_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_trial_subs_ends_at ON public.trial_subscriptions(ends_at);
CREATE INDEX IF NOT EXISTS idx_trial_subs_user ON public.trial_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_subs_company ON public.trial_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_trial_subs_email ON public.trial_subscriptions(lower(contact_email));

GRANT SELECT, INSERT, UPDATE ON public.trial_subscriptions TO authenticated;
GRANT ALL ON public.trial_subscriptions TO service_role;
ALTER TABLE public.trial_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_subs_select_self_or_staff" ON public.trial_subscriptions;
CREATE POLICY "trial_subs_select_self_or_staff" ON public.trial_subscriptions
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_impulsionando_staff(auth.uid())
  OR (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id))
);

DROP POLICY IF EXISTS "trial_subs_insert_staff" ON public.trial_subscriptions;
CREATE POLICY "trial_subs_insert_staff" ON public.trial_subscriptions
FOR INSERT TO authenticated
WITH CHECK (public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "trial_subs_update_super" ON public.trial_subscriptions;
CREATE POLICY "trial_subs_update_super" ON public.trial_subscriptions
FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_trial_subs_set_updated_at ON public.trial_subscriptions;
CREATE TRIGGER trg_trial_subs_set_updated_at
BEFORE UPDATE ON public.trial_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- trial_settings singleton
CREATE TABLE IF NOT EXISTS public.trial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_days int NOT NULL DEFAULT 7,
  max_users int NOT NULL DEFAULT 5,
  max_customers int NOT NULL DEFAULT 100,
  max_products int NOT NULL DEFAULT 50,
  max_events int NOT NULL DEFAULT 10,
  max_tickets int NOT NULL DEFAULT 100,
  max_simulated_messages int NOT NULL DEFAULT 50,
  max_simulated_payments int NOT NULL DEFAULT 20,
  allow_real_publish boolean NOT NULL DEFAULT false,
  allow_custom_domain boolean NOT NULL DEFAULT false,
  allow_real_integrations boolean NOT NULL DEFAULT false,
  allow_export boolean NOT NULL DEFAULT false,
  allow_real_credentials boolean NOT NULL DEFAULT false,
  charge_setup_before boolean NOT NULL DEFAULT false,
  charge_setup_after boolean NOT NULL DEFAULT false,
  waive_setup_on_trial boolean NOT NULL DEFAULT true,
  apply_setup_on_convert boolean NOT NULL DEFAULT true,
  allow_extension boolean NOT NULL DEFAULT true,
  max_extension_days int NOT NULL DEFAULT 7,
  extension_requires_reason boolean NOT NULL DEFAULT true,
  block_repeat_email boolean NOT NULL DEFAULT true,
  block_repeat_whatsapp boolean NOT NULL DEFAULT true,
  block_repeat_doc boolean NOT NULL DEFAULT true,
  block_repeat_company boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trial_settings TO authenticated;
GRANT ALL ON public.trial_settings TO service_role;
ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_settings_read_authenticated" ON public.trial_settings;
CREATE POLICY "trial_settings_read_authenticated" ON public.trial_settings
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trial_settings_write_super" ON public.trial_settings;
CREATE POLICY "trial_settings_write_super" ON public.trial_settings
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_trial_settings_set_updated_at ON public.trial_settings;
CREATE TRIGGER trg_trial_settings_set_updated_at
BEFORE UPDATE ON public.trial_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.trial_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.trial_settings);

-- trial_events
CREATE TABLE IF NOT EXISTS public.trial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id uuid NOT NULL REFERENCES public.trial_subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_events_trial ON public.trial_events(trial_id, created_at DESC);
GRANT SELECT, INSERT ON public.trial_events TO authenticated;
GRANT ALL ON public.trial_events TO service_role;
ALTER TABLE public.trial_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_events_read_staff_or_owner" ON public.trial_events;
CREATE POLICY "trial_events_read_staff_or_owner" ON public.trial_events
FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.trial_subscriptions t WHERE t.id = trial_events.trial_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "trial_events_insert_staff" ON public.trial_events;
CREATE POLICY "trial_events_insert_staff" ON public.trial_events
FOR INSERT TO authenticated
WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- trial_abuse_index
CREATE TABLE IF NOT EXISTS public.trial_abuse_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id uuid NOT NULL REFERENCES public.trial_subscriptions(id) ON DELETE CASCADE,
  email_hash text,
  whatsapp_hash text,
  doc_hash text,
  company_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_email ON public.trial_abuse_index(email_hash);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_whats ON public.trial_abuse_index(whatsapp_hash);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_doc ON public.trial_abuse_index(doc_hash);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_company ON public.trial_abuse_index(company_hash);
GRANT SELECT, INSERT ON public.trial_abuse_index TO authenticated;
GRANT ALL ON public.trial_abuse_index TO service_role;
ALTER TABLE public.trial_abuse_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_abuse_read_staff" ON public.trial_abuse_index;
CREATE POLICY "trial_abuse_read_staff" ON public.trial_abuse_index
FOR SELECT TO authenticated USING (public.is_impulsionando_staff(auth.uid()));

-- Helpers e ciclo
CREATE OR REPLACE FUNCTION public._trial_norm(_v text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(coalesce(_v,''), '[^a-z0-9@]', '', 'gi'));
$$;

CREATE OR REPLACE FUNCTION public.trial_check_abuse(_email text, _whatsapp text, _doc text, _company text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s RECORD; found boolean;
BEGIN
  SELECT * INTO s FROM public.trial_settings LIMIT 1;
  IF s.block_repeat_email AND _email IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.trial_abuse_index WHERE email_hash = public._trial_norm(_email)) INTO found;
    IF found THEN RETURN jsonb_build_object('allowed', false, 'reason', 'email_repeat'); END IF;
  END IF;
  IF s.block_repeat_whatsapp AND _whatsapp IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.trial_abuse_index WHERE whatsapp_hash = public._trial_norm(_whatsapp)) INTO found;
    IF found THEN RETURN jsonb_build_object('allowed', false, 'reason', 'whatsapp_repeat'); END IF;
  END IF;
  IF s.block_repeat_doc AND _doc IS NOT NULL AND _doc <> '' THEN
    SELECT EXISTS(SELECT 1 FROM public.trial_abuse_index WHERE doc_hash = public._trial_norm(_doc)) INTO found;
    IF found THEN RETURN jsonb_build_object('allowed', false, 'reason', 'doc_repeat'); END IF;
  END IF;
  IF s.block_repeat_company AND _company IS NOT NULL AND _company <> '' THEN
    SELECT EXISTS(SELECT 1 FROM public.trial_abuse_index WHERE company_hash = public._trial_norm(_company)) INTO found;
    IF found THEN RETURN jsonb_build_object('allowed', false, 'reason', 'company_repeat'); END IF;
  END IF;
  RETURN jsonb_build_object('allowed', true);
END $$;

CREATE OR REPLACE FUNCTION public.trial_create(
  _contact_name text, _contact_company text, _contact_email text,
  _contact_whatsapp text, _contact_doc text,
  _chosen_plan public.trial_plan_choice,
  _source text DEFAULT 'site',
  _terms_ip text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s RECORD; trial_id uuid; abuse jsonb; days int;
BEGIN
  SELECT * INTO s FROM public.trial_settings LIMIT 1;
  days := COALESCE(s.duration_days, 7);
  abuse := public.trial_check_abuse(_contact_email, _contact_whatsapp, _contact_doc, _contact_company);
  IF (abuse->>'allowed')::boolean = false THEN
    RAISE EXCEPTION 'Já existe um Trial registrado para estes dados.';
  END IF;

  INSERT INTO public.trial_subscriptions (
    contact_name, contact_company, contact_email, contact_whatsapp, contact_doc,
    chosen_plan, status, started_at, ends_at, source, terms_ip
  ) VALUES (
    _contact_name, _contact_company, lower(_contact_email), _contact_whatsapp, _contact_doc,
    _chosen_plan, 'ativo', now(), now() + (days || ' days')::interval, _source, _terms_ip
  ) RETURNING id INTO trial_id;

  INSERT INTO public.trial_abuse_index (trial_id, email_hash, whatsapp_hash, doc_hash, company_hash)
  VALUES (
    trial_id,
    public._trial_norm(_contact_email),
    public._trial_norm(_contact_whatsapp),
    NULLIF(public._trial_norm(_contact_doc),''),
    NULLIF(public._trial_norm(_contact_company),'')
  );

  INSERT INTO public.trial_events (trial_id, event_type, payload)
  VALUES (trial_id, 'trial.created', jsonb_build_object('plan', _chosen_plan, 'source', _source));

  PERFORM public.enqueue_message(
    'trial_started', NULL, NULL, _contact_email, _contact_whatsapp, _contact_name,
    jsonb_build_object('nome_cliente', _contact_name, 'nome_plano', _chosen_plan::text,
                       'link_acesso', 'https://impulsionando.com.br/auth'),
    ARRAY['email','whatsapp']::text[], 'trial', trial_id::text
  );
  RETURN trial_id;
END $$;

CREATE OR REPLACE FUNCTION public.trial_advance_status()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r RECORD; n int := 0; days_left int;
BEGIN
  FOR r IN SELECT * FROM public.trial_subscriptions
    WHERE status IN ('ativo','vence_3d','vence_1d','vence_hoje','cobranca_gerada','pagamento_pendente')
  LOOP
    days_left := EXTRACT(DAY FROM (r.ends_at - now()))::int;

    IF r.status = 'ativo' AND EXTRACT(DAY FROM (now() - r.started_at))::int = 3
       AND NOT EXISTS (SELECT 1 FROM public.trial_events WHERE trial_id = r.id AND event_type = 'comm.day3') THEN
      PERFORM public.enqueue_message('trial_day3', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
        jsonb_build_object('nome_cliente', r.contact_name), ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
      INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'comm.day3');
    END IF;

    IF days_left <= 3 AND days_left > 1 AND r.status = 'ativo' THEN
      UPDATE public.trial_subscriptions SET status = 'vence_3d' WHERE id = r.id;
      PERFORM public.enqueue_message('trial_3days_left', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
        jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text),
        ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
      n := n + 1;
    ELSIF days_left = 1 AND r.status IN ('ativo','vence_3d') THEN
      UPDATE public.trial_subscriptions SET status = 'vence_1d' WHERE id = r.id;
      PERFORM public.enqueue_message('trial_1day_left', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
        jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text),
        ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
      n := n + 1;
    ELSIF now() >= r.ends_at AND r.status IN ('ativo','vence_3d','vence_1d','vence_hoje') THEN
      UPDATE public.trial_subscriptions SET status = 'cobranca_gerada' WHERE id = r.id;
      PERFORM public.enqueue_message('trial_ended', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
        jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text,
                           'link_pagamento', 'https://impulsionando.com.br/finance'),
        ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
      INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'billing.generated');
      n := n + 1;
    ELSIF r.status = 'cobranca_gerada' AND now() >= r.ends_at + interval '24 hours' THEN
      UPDATE public.trial_subscriptions SET status = 'suspenso', suspended_at = now() WHERE id = r.id;
      PERFORM public.enqueue_message('trial_suspended', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
        jsonb_build_object('nome_cliente', r.contact_name, 'link_financeiro', 'https://impulsionando.com.br/finance'),
        ARRAY['email','whatsapp']::text[], 'trial', r.id::text);
      INSERT INTO public.trial_events (trial_id, event_type) VALUES (r.id, 'access.suspended');
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.trial_convert(_trial_id uuid, _paddle_sub text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM public.trial_subscriptions WHERE id = _trial_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trial não encontrado'; END IF;
  UPDATE public.trial_subscriptions
     SET status = 'convertido', converted_at = now(), paddle_subscription_id = _paddle_sub
   WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type, payload)
  VALUES (_trial_id, 'trial.converted', jsonb_build_object('paddle_sub', _paddle_sub));
  PERFORM public.enqueue_message('trial_payment_approved', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
    jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text),
    ARRAY['email','whatsapp']::text[], 'trial', _trial_id::text);
  RETURN _trial_id;
END $$;

CREATE OR REPLACE FUNCTION public.trial_regularize(_trial_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM public.trial_subscriptions WHERE id = _trial_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trial não encontrado'; END IF;
  UPDATE public.trial_subscriptions SET status = 'regularizado', regularized_at = now() WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type) VALUES (_trial_id, 'trial.regularized');
  PERFORM public.enqueue_message('trial_regularized', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
    jsonb_build_object('nome_cliente', r.contact_name), ARRAY['email','whatsapp']::text[], 'trial', _trial_id::text);
  RETURN _trial_id;
END $$;

CREATE OR REPLACE FUNCTION public.trial_extend(_trial_id uuid, _days int, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s RECORD;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode estender Trial';
  END IF;
  SELECT * INTO s FROM public.trial_settings LIMIT 1;
  IF NOT s.allow_extension THEN RAISE EXCEPTION 'Extensão desativada'; END IF;
  IF _days > s.max_extension_days THEN RAISE EXCEPTION 'Limite de extensão excedido'; END IF;
  IF s.extension_requires_reason AND (_reason IS NULL OR trim(_reason) = '') THEN
    RAISE EXCEPTION 'Motivo obrigatório';
  END IF;
  UPDATE public.trial_subscriptions
     SET ends_at = ends_at + (_days || ' days')::interval,
         extended_days = extended_days + _days,
         extended_by = auth.uid(),
         extension_reason = _reason,
         status = 'ativo'
   WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type, actor_user_id, payload)
  VALUES (_trial_id, 'trial.extended', auth.uid(), jsonb_build_object('days', _days, 'reason', _reason));
  RETURN _trial_id;
END $$;

CREATE OR REPLACE FUNCTION public.trial_cancel(_trial_id uuid, _reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode cancelar Trial';
  END IF;
  UPDATE public.trial_subscriptions
     SET status = 'cancelado', cancelled_at = now()
   WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type, actor_user_id, payload)
  VALUES (_trial_id, 'trial.cancelled', auth.uid(), jsonb_build_object('reason', _reason));
  RETURN _trial_id;
END $$;

-- Permissões (schema: code, module, description)
INSERT INTO public.permissions (code, module, description)
SELECT v.code, 'trial', v.description
FROM (VALUES
  ('trial.view_all','Visualiza todos os Trials no dashboard'),
  ('trial.create','Criar Trials manualmente'),
  ('trial.extend','Estender período do Trial'),
  ('trial.convert','Converter Trial em plano pago'),
  ('trial.suspend','Suspender Trial por inadimplência'),
  ('trial.reactivate','Reativar Trial após regularização'),
  ('trial.settings.manage','Gerenciar parâmetros do Trial')
) AS v(code, description)
WHERE NOT EXISTS (SELECT 1 FROM public.permissions WHERE code = v.code);

-- Cron diário 12:00 UTC (09:00 BRT)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN PERFORM cron.unschedule('trial-advance-status'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('trial-advance-status', '0 12 * * *', $cron$ SELECT public.trial_advance_status(); $cron$);