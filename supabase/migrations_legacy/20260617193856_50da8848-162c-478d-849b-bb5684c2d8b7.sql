
-- 21-day conversion journey steps (admin-editable)
CREATE TABLE IF NOT EXISTS public.clube_journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_offset integer NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  audience text NOT NULL DEFAULT 'free',
  event_code text NOT NULL,
  subject text,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_journey_steps TO authenticated;
GRANT ALL ON public.clube_journey_steps TO service_role;
ALTER TABLE public.clube_journey_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cjs_admin_all" ON public.clube_journey_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "cjs_select_auth" ON public.clube_journey_steps
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_clube_journey_steps_updated
  BEFORE UPDATE ON public.clube_journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track which journey messages were already enqueued (idempotency)
CREATE TABLE IF NOT EXISTS public.clube_journey_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_id uuid NOT NULL REFERENCES public.clube_journey_steps(id) ON DELETE CASCADE,
  enqueued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);
GRANT SELECT ON public.clube_journey_log TO authenticated;
GRANT ALL ON public.clube_journey_log TO service_role;
ALTER TABLE public.clube_journey_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cjl_owner_select" ON public.clube_journey_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Digital receipts
CREATE TABLE IF NOT EXISTS public.clube_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  kind text NOT NULL DEFAULT 'pix',
  reference_type text,
  reference_id uuid,
  title text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  receipt_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.clube_receipts TO authenticated;
GRANT ALL ON public.clube_receipts TO service_role;
ALTER TABLE public.clube_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_owner_select" ON public.clube_receipts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cr_owner_insert" ON public.clube_receipts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_receipts_user ON public.clube_receipts(user_id, issued_at DESC);

-- Auto-generate receipt when a pix charge is confirmed
CREATE OR REPLACE FUNCTION public.clube_after_pix_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.contract_id IS NOT NULL THEN
    SELECT user_id INTO v_user FROM public.consumer_memberships WHERE id = NEW.contract_id LIMIT 1;
    IF v_user IS NOT NULL THEN
      INSERT INTO public.clube_receipts(user_id, kind, reference_type, reference_id, title, amount_cents, receipt_url, issued_at, meta)
      VALUES (
        v_user, 'pix', 'billing_pix_charges', NEW.id,
        'Comprovante Pix - ' || COALESCE(NEW.plan_code,'plano'),
        NEW.unique_amount_cents,
        NEW.receipt_url,
        COALESCE(NEW.paid_at, now()),
        jsonb_build_object('txid', NEW.txid, 'payer_name', NEW.payer_name)
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clube_after_pix_paid ON public.billing_pix_charges;
CREATE TRIGGER trg_clube_after_pix_paid
  AFTER UPDATE ON public.billing_pix_charges
  FOR EACH ROW EXECUTE FUNCTION public.clube_after_pix_paid();

-- Seed default 21-day journey
INSERT INTO public.clube_journey_steps(day_offset, channel, audience, event_code, subject, body, active) VALUES
  (0,  'email',    'free', 'clube_welcome',          'Bem-vindo ao Clube Impulsionando',     'Olá {{name}}, seu cadastro está confirmado. Descubra lugares, acumule benefícios e participe de experiências.', true),
  (3,  'whatsapp', 'free', 'clube_discover',         NULL,                                    'Oi {{name}}! Já viu os parceiros do Clube perto de você? Acesse o app e explore os destaques.', true),
  (6,  'email',    'free', 'clube_first_visit',      'Faça seu primeiro check-in',           '{{name}}, registre sua primeira visita e ganhe 10 pontos no Clube Impulsionando.', true),
  (9,  'email',    'free', 'clube_premium_invite',   'Conheça o Clube Premium',              '{{name}}, libere histórico completo, alertas inteligentes e cashback expandido por apenas R$ 9,99/mês.', true),
  (12, 'whatsapp', 'free', 'clube_referral',         NULL,                                    '{{name}}, indique amigos com seu código {{referral_code}} e ganhe 50 pontos por indicação.', true),
  (15, 'email',    'free', 'clube_events',           'Eventos imperdíveis para você',        '{{name}}, veja os próximos eventos dos parceiros do Clube na sua região.', true),
  (18, 'email',    'free', 'clube_gamification',     'Suba de nível no Clube',               '{{name}}, você está no nível {{level}}. Faltam {{visits_to_next}} visitas para o próximo nível.', true),
  (21, 'whatsapp', 'free', 'clube_premium_lastcall', NULL,                                    '{{name}}, libere todo o poder do Clube com o plano Premium e desbloqueie cashback expandido.', true)
ON CONFLICT DO NOTHING;
