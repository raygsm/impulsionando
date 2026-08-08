
-- Consumer Final + Premium R$9,99 module
CREATE TABLE public.consumer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  whatsapp text,
  city text,
  state text,
  birthdate date,
  marketing_optin boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.consumer_profiles TO authenticated;
GRANT ALL ON public.consumer_profiles TO service_role;
ALTER TABLE public.consumer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consumer_profiles_own" ON public.consumer_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "consumer_profiles_admin" ON public.consumer_profiles FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE TABLE public.consumer_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled','pending')),
  amount_cents integer NOT NULL DEFAULT 0,
  cycle text NOT NULL DEFAULT 'monthly',
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.consumer_memberships TO authenticated;
GRANT ALL ON public.consumer_memberships TO service_role;
ALTER TABLE public.consumer_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consumer_memberships_own" ON public.consumer_memberships FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "consumer_memberships_admin" ON public.consumer_memberships FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE TABLE public.consumer_membership_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.consumer_memberships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','overdue','canceled')),
  paid_at timestamptz,
  pix_copy_paste text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.consumer_membership_invoices TO authenticated;
GRANT ALL ON public.consumer_membership_invoices TO service_role;
ALTER TABLE public.consumer_membership_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cmi_own" ON public.consumer_membership_invoices FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cmi_admin" ON public.consumer_membership_invoices FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE TABLE public.consumer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
GRANT SELECT, INSERT, DELETE ON public.consumer_favorites TO authenticated;
GRANT ALL ON public.consumer_favorites TO service_role;
ALTER TABLE public.consumer_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfav_own" ON public.consumer_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER consumer_profiles_touch BEFORE UPDATE ON public.consumer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER consumer_memberships_touch BEFORE UPDATE ON public.consumer_memberships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER consumer_membership_invoices_touch BEFORE UPDATE ON public.consumer_membership_invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Upgrade RPC: creates premium membership + first open invoice
CREATE OR REPLACE FUNCTION public.consumer_upgrade_to_premium()
RETURNS TABLE(membership_id uuid, invoice_id uuid, amount_cents integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mem_id uuid;
  v_inv_id uuid;
  v_amount integer := 999; -- R$9,99
  v_now timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  INSERT INTO public.consumer_memberships(user_id, plan, status, amount_cents, started_at, current_period_start, current_period_end)
  VALUES (v_uid, 'premium', 'pending', v_amount, v_now, v_now, v_now + interval '1 month')
  ON CONFLICT (user_id) DO UPDATE
    SET plan='premium', status='pending', amount_cents=v_amount,
        current_period_start=v_now, current_period_end=v_now + interval '1 month', updated_at=v_now
  RETURNING id INTO v_mem_id;

  INSERT INTO public.consumer_membership_invoices(membership_id, user_id, period_start, period_end, due_date, amount_cents, status, pix_copy_paste)
  VALUES (v_mem_id, v_uid, v_now::date, (v_now + interval '1 month')::date, (v_now + interval '3 days')::date, v_amount, 'open',
          '00020126360014BR.GOV.BCB.PIX0114+551199999999952040000530398654049.99' )
  RETURNING id INTO v_inv_id;

  RETURN QUERY SELECT v_mem_id, v_inv_id, v_amount;
END; $$;
REVOKE ALL ON FUNCTION public.consumer_upgrade_to_premium() FROM public;
GRANT EXECUTE ON FUNCTION public.consumer_upgrade_to_premium() TO authenticated;

-- Master overview
CREATE OR REPLACE FUNCTION public.consumer_premium_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'total_consumers', (SELECT count(*) FROM public.consumer_profiles),
    'premium_active', (SELECT count(*) FROM public.consumer_memberships WHERE plan='premium' AND status='active'),
    'premium_pending', (SELECT count(*) FROM public.consumer_memberships WHERE plan='premium' AND status='pending'),
    'premium_past_due', (SELECT count(*) FROM public.consumer_memberships WHERE plan='premium' AND status='past_due'),
    'mrr_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.consumer_memberships WHERE plan='premium' AND status='active'),
    'invoices_open', (SELECT count(*) FROM public.consumer_membership_invoices WHERE status='open'),
    'invoices_paid_30d', (SELECT count(*) FROM public.consumer_membership_invoices WHERE status='paid' AND paid_at >= now()-interval '30 days'),
    'revenue_30d_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.consumer_membership_invoices WHERE status='paid' AND paid_at >= now()-interval '30 days')
  ) INTO v_result;
  RETURN v_result;
END; $$;
REVOKE ALL ON FUNCTION public.consumer_premium_overview() FROM public;
GRANT EXECUTE ON FUNCTION public.consumer_premium_overview() TO authenticated;

-- Public vitrine listing (anon): minimal, safe fields only
CREATE OR REPLACE FUNCTION public.public_vitrine_list(p_segment text DEFAULT NULL, p_city text DEFAULT NULL, p_limit integer DEFAULT 60)
RETURNS TABLE(id uuid, name text, trade_name text, segment text, logo_url text, public_slug text, address_city text, address_state text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.trade_name, c.segment, c.logo_url, c.public_slug, c.address_city, c.address_state
  FROM public.companies c
  WHERE c.vitrine_enabled = true AND c.public_slug IS NOT NULL AND c.is_active = true
    AND (p_segment IS NULL OR c.segment = p_segment)
    AND (p_city IS NULL OR c.address_city ILIKE '%'||p_city||'%')
  ORDER BY c.name
  LIMIT LEAST(GREATEST(p_limit,1), 200);
$$;
GRANT EXECUTE ON FUNCTION public.public_vitrine_list(text, text, integer) TO anon, authenticated;
