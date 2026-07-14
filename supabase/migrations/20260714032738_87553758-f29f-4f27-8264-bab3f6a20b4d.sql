
-- 1. Planos do Clube
CREATE TABLE public.clube_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  monthly_price_cents integer NOT NULL DEFAULT 0 CHECK (monthly_price_cents >= 0),
  yearly_price_cents integer NOT NULL DEFAULT 0 CHECK (yearly_price_cents >= 0),
  points_multiplier numeric(5,2) NOT NULL DEFAULT 1.00 CHECK (points_multiplier >= 0),
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_plans TO anon, authenticated;
GRANT ALL ON public.clube_plans TO service_role;
ALTER TABLE public.clube_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_plans public read active" ON public.clube_plans FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clube_plans admin write" ON public.clube_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Assinaturas
CREATE TABLE public.clube_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.clube_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','paused','canceled','expired')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','free')),
  source text NOT NULL DEFAULT 'self' CHECK (source IN ('self','referral','courtesy','migration','partner')),
  referred_by_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  external_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clube_memberships_one_active ON public.clube_memberships(user_id) WHERE status IN ('trial','active','paused');
CREATE INDEX idx_clube_memberships_user ON public.clube_memberships(user_id);
CREATE INDEX idx_clube_memberships_status ON public.clube_memberships(status);
GRANT SELECT, INSERT, UPDATE ON public.clube_memberships TO authenticated;
GRANT ALL ON public.clube_memberships TO service_role;
ALTER TABLE public.clube_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_memberships own read" ON public.clube_memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clube_memberships own insert" ON public.clube_memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clube_memberships own update" ON public.clube_memberships FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Ledger de pontos (imutável — no updates/deletes por membros)
CREATE TABLE public.clube_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('earn','spend','expire','adjust','bonus','refund')),
  points integer NOT NULL,
  reason text NOT NULL,
  ref_type text,
  ref_id uuid,
  balance_after integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clube_ledger_user ON public.clube_points_ledger(user_id, created_at DESC);
CREATE INDEX idx_clube_ledger_company ON public.clube_points_ledger(company_id, created_at DESC);
GRANT SELECT ON public.clube_points_ledger TO authenticated;
GRANT ALL ON public.clube_points_ledger TO service_role;
ALTER TABLE public.clube_points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_ledger own read" ON public.clube_points_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
    OR (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin')));

-- 4. Saldo consolidado
CREATE TABLE public.clube_points_balance (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_points_balance TO authenticated;
GRANT ALL ON public.clube_points_balance TO service_role;
ALTER TABLE public.clube_points_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_balance own read" ON public.clube_points_balance FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. Ofertas dos parceiros
CREATE TABLE public.clube_partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed_cents','cashback_points','gift','free_shipping')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  min_points integer NOT NULL DEFAULT 0 CHECK (min_points >= 0),
  min_plan_code text REFERENCES public.clube_plans(code) ON DELETE SET NULL,
  max_uses_total integer,
  max_uses_per_user integer NOT NULL DEFAULT 1 CHECK (max_uses_per_user >= 1),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  terms text,
  image_url text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clube_offers_company ON public.clube_partner_offers(company_id);
CREATE INDEX idx_clube_offers_active ON public.clube_partner_offers(is_active, starts_at, ends_at);
GRANT SELECT ON public.clube_partner_offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clube_partner_offers TO authenticated;
GRANT ALL ON public.clube_partner_offers TO service_role;
ALTER TABLE public.clube_partner_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_offers public read active" ON public.clube_partner_offers FOR SELECT TO anon, authenticated
  USING (is_active AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "clube_offers company admin manage" ON public.clube_partner_offers FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

-- 6. Resgates
CREATE TABLE public.clube_offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.clube_partner_offers(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  points_spent integer NOT NULL DEFAULT 0 CHECK (points_spent >= 0),
  amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','used','canceled','refunded')),
  order_ref text,
  used_at timestamptz,
  code text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clube_red_user ON public.clube_offer_redemptions(user_id);
CREATE INDEX idx_clube_red_company ON public.clube_offer_redemptions(company_id);
CREATE INDEX idx_clube_red_offer ON public.clube_offer_redemptions(offer_id);
GRANT SELECT, INSERT, UPDATE ON public.clube_offer_redemptions TO authenticated;
GRANT ALL ON public.clube_offer_redemptions TO service_role;
ALTER TABLE public.clube_offer_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_red own read" ON public.clube_offer_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clube_red own insert" ON public.clube_offer_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clube_red partner or admin update" ON public.clube_offer_redemptions FOR UPDATE TO authenticated
  USING ((public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'admin'));

-- 7. Regras de acúmulo
CREATE TABLE public.clube_earning_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','niche','company','plan','event')),
  scope_ref text,
  points_per_currency_unit numeric(10,4) NOT NULL DEFAULT 0,
  fixed_points integer NOT NULL DEFAULT 0,
  event_key text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_earning_rules TO authenticated;
GRANT ALL ON public.clube_earning_rules TO service_role;
ALTER TABLE public.clube_earning_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_rules read authenticated" ON public.clube_earning_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "clube_rules admin write" ON public.clube_earning_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger de updated_at reutilizando helper existente
CREATE TRIGGER trg_clube_plans_updated BEFORE UPDATE ON public.clube_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clube_memberships_updated BEFORE UPDATE ON public.clube_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clube_offers_updated BEFORE UPDATE ON public.clube_partner_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clube_red_updated BEFORE UPDATE ON public.clube_offer_redemptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clube_rules_updated BEFORE UPDATE ON public.clube_earning_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função core: creditar pontos (SECURITY DEFINER — service/admin/backend)
CREATE OR REPLACE FUNCTION public.clube_credit_points(
  p_user_id uuid, p_company_id uuid, p_points integer, p_reason text,
  p_ref_type text DEFAULT NULL, p_ref_id uuid DEFAULT NULL, p_kind text DEFAULT 'earn',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_balance integer; v_id uuid;
BEGIN
  IF p_points = 0 THEN RAISE EXCEPTION 'points must be non-zero'; END IF;
  INSERT INTO public.clube_points_balance(user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (p_user_id, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.clube_points_balance
    SET balance = balance + p_points,
        lifetime_earned = lifetime_earned + GREATEST(p_points, 0),
        lifetime_spent = lifetime_spent + GREATEST(-p_points, 0),
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient points balance';
  END IF;

  INSERT INTO public.clube_points_ledger(user_id, company_id, kind, points, reason, ref_type, ref_id, balance_after, metadata)
  VALUES (p_user_id, p_company_id, p_kind, p_points, p_reason, p_ref_type, p_ref_id, v_new_balance, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.clube_credit_points(uuid,uuid,integer,text,text,uuid,text,jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clube_credit_points(uuid,uuid,integer,text,text,uuid,text,jsonb) TO service_role;

-- Seed dos planos oficiais
INSERT INTO public.clube_plans(code, name, tagline, monthly_price_cents, yearly_price_cents, points_multiplier, benefits, sort_order) VALUES
  ('free',    'Impulsionando Free',    'Entrada no clube — descontos exclusivos', 0,      0,       1.00, '["Acesso à vitrine de ofertas","Acúmulo básico de pontos"]'::jsonb, 10),
  ('premium', 'Impulsionando Premium', 'Multiplicador 2x + benefícios exclusivos', 1990,   19900,   2.00, '["Multiplicador 2x de pontos","Ofertas exclusivas Premium","Suporte prioritário"]'::jsonb, 20),
  ('black',   'Impulsionando Black',   'Concierge, cashback estendido e VIP',       4990,   49900,   3.00, '["Multiplicador 3x de pontos","Cashback estendido","Concierge dedicado","Eventos VIP"]'::jsonb, 30)
ON CONFLICT (code) DO NOTHING;
