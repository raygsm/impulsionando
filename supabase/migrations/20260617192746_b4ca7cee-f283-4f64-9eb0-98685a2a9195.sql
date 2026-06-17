
-- ============================================================
-- CLUBE IMPULSIONANDO — Fase 1 (retry: status_comercial fix)
-- ============================================================

ALTER TABLE public.consumer_profiles
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS default_radius_km INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS interests_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_level TEXT NOT NULL DEFAULT 'explorador',
  ADD COLUMN IF NOT EXISTS points_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_savings_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_visits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

UPDATE public.consumer_profiles
   SET referral_code = UPPER(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
 WHERE referral_code IS NULL;

-- clube_visits
CREATE TABLE IF NOT EXISTS public.clube_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.evt_events(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'self_checkin',
  notes TEXT,
  rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_visits TO authenticated;
GRANT ALL ON public.clube_visits TO service_role;
ALTER TABLE public.clube_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own visits" ON public.clube_visits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all visits" ON public.clube_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_visits_user ON public.clube_visits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clube_visits_company ON public.clube_visits(company_id, created_at DESC);

-- clube_alerts
CREATE TABLE IF NOT EXISTS public.clube_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  tag TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT ARRAY['email'],
  city TEXT,
  radius_km INTEGER NOT NULL DEFAULT 25,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, tag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_alerts TO authenticated;
GRANT ALL ON public.clube_alerts TO service_role;
ALTER TABLE public.clube_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own alerts" ON public.clube_alerts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all alerts" ON public.clube_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_alerts_user_active ON public.clube_alerts(user_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_clube_alerts_tag ON public.clube_alerts(kind, tag) WHERE active;

-- clube_consumption
CREATE TABLE IF NOT EXISTS public.clube_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  receipt_url TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_consumption TO authenticated;
GRANT ALL ON public.clube_consumption TO service_role;
ALTER TABLE public.clube_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own consumption" ON public.clube_consumption FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all consumption" ON public.clube_consumption FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_consumption_user ON public.clube_consumption(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_clube_consumption_company ON public.clube_consumption(company_id, consumed_at DESC);

-- clube_referrals
CREATE TABLE IF NOT EXISTS public.clube_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'invited',
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_cents INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_referrals TO authenticated;
GRANT ALL ON public.clube_referrals TO service_role;
ALTER TABLE public.clube_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer reads own referrals" ON public.clube_referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE POLICY "Referrer creates own referrals" ON public.clube_referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);
CREATE POLICY "Admins manage referrals" ON public.clube_referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_referrals_referrer ON public.clube_referrals(referrer_user_id, created_at DESC);

-- clube_rewards_ledger
CREATE TABLE IF NOT EXISTS public.clube_rewards_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_rewards_ledger TO authenticated;
GRANT ALL ON public.clube_rewards_ledger TO service_role;
ALTER TABLE public.clube_rewards_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own rewards" ON public.clube_rewards_ledger FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage rewards" ON public.clube_rewards_ledger FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_clube_rewards_user ON public.clube_rewards_ledger(user_id, created_at DESC);

-- clube_polls / clube_poll_votes
CREATE TABLE IF NOT EXISTS public.clube_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  kind TEXT NOT NULL DEFAULT 'preference',
  audience TEXT NOT NULL DEFAULT 'all',
  city TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  opens_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_polls TO authenticated;
GRANT ALL ON public.clube_polls TO service_role;
ALTER TABLE public.clube_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read active polls" ON public.clube_polls FOR SELECT
  USING (active = TRUE);
CREATE POLICY "Admins manage polls" ON public.clube_polls FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.clube_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.clube_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.clube_poll_votes TO authenticated;
GRANT ALL ON public.clube_poll_votes TO service_role;
ALTER TABLE public.clube_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own votes" ON public.clube_poll_votes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all votes" ON public.clube_poll_votes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger gamificação
CREATE OR REPLACE FUNCTION public.clube_after_visit_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total INTEGER;
  v_level TEXT;
BEGIN
  UPDATE public.consumer_profiles
     SET total_visits = total_visits + 1,
         updated_at = now()
   WHERE user_id = NEW.user_id
   RETURNING total_visits INTO v_total;

  IF v_total IS NULL THEN
    INSERT INTO public.consumer_profiles (user_id, total_visits)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET total_visits = consumer_profiles.total_visits + 1
    RETURNING total_visits INTO v_total;
  END IF;

  v_level := CASE
    WHEN v_total >= 100 THEN 'lenda'
    WHEN v_total >= 50  THEN 'embaixador'
    WHEN v_total >= 20  THEN 'entusiasta'
    WHEN v_total >= 5   THEN 'frequentador'
    ELSE 'explorador'
  END;

  UPDATE public.consumer_profiles
     SET current_level = v_level
   WHERE user_id = NEW.user_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_clube_after_visit ON public.clube_visits;
CREATE TRIGGER trg_clube_after_visit
  AFTER INSERT ON public.clube_visits
  FOR EACH ROW EXECUTE FUNCTION public.clube_after_visit_insert();

CREATE OR REPLACE FUNCTION public.clube_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_clube_alerts_touch ON public.clube_alerts;
CREATE TRIGGER trg_clube_alerts_touch BEFORE UPDATE ON public.clube_alerts
  FOR EACH ROW EXECUTE FUNCTION public.clube_touch_updated_at();

-- Seed plano Premium (status_comercial corrigido)
INSERT INTO public.billing_plans (
  code, name, description, setup_fee, recurring_amount, cycle, due_day,
  is_active, is_default, status_comercial, show_on_site, show_in_checkout,
  allow_direct_checkout, route_to_quote, route_to_whatsapp, sort_order,
  cta, min_contract_days, min_installments, included_modules, included_module_count
)
SELECT
  'clube_premium',
  'Clube Impulsionando Premium',
  'Histórico completo, alertas inteligentes, biblioteca pessoal, cashback ampliado e participação em enquetes exclusivas.',
  0, 9.99, 'monthly', 10,
  TRUE, FALSE, 'disponivel_contratacao', TRUE, TRUE,
  TRUE, FALSE, FALSE, 1,
  'Assinar Premium', 30, 1, ARRAY[]::text[], 0
WHERE NOT EXISTS (SELECT 1 FROM public.billing_plans WHERE code = 'clube_premium');
