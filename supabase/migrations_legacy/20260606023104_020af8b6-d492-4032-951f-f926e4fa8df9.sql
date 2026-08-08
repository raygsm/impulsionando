
ALTER TABLE public.aff_products
  ADD COLUMN IF NOT EXISTS consumption_days int,
  ADD COLUMN IF NOT EXISTS is_recurring_consumption boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_installments boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_installments int DEFAULT 12,
  ADD COLUMN IF NOT EXISTS interest_paid_by text DEFAULT 'customer' CHECK (interest_paid_by IN ('customer','producer'));

ALTER TABLE public.aff_offers
  ADD COLUMN IF NOT EXISTS allow_installments boolean,
  ADD COLUMN IF NOT EXISTS max_installments int,
  ADD COLUMN IF NOT EXISTS interest_paid_by text CHECK (interest_paid_by IN ('customer','producer'));

ALTER TABLE public.aff_sales
  ADD COLUMN IF NOT EXISTS installment_interest numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_paid_by text,
  ADD COLUMN IF NOT EXISTS coupon_id uuid,
  ADD COLUMN IF NOT EXISTS parent_sale_id uuid,
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'main' CHECK (kind IN ('main','bump','upsell','cross')),
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS recovery_status text;

CREATE TABLE IF NOT EXISTS public.aff_product_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  consumption_days int,
  price_cents int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  followup_before_end_days int DEFAULT 7,
  followup_second_days_before int DEFAULT 1,
  followup_after_end_days int DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_product_plans TO authenticated;
GRANT ALL ON public.aff_product_plans TO service_role;
ALTER TABLE public.aff_product_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  code text NOT NULL,
  product_id uuid,
  offer_id uuid,
  affiliate_id uuid,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric(14,2) NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  max_per_customer int DEFAULT 1,
  keep_commission boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','pausado','expirado','esgotado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_coupons TO authenticated;
GRANT ALL ON public.aff_coupons TO service_role;
ALTER TABLE public.aff_coupons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_bumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  bump_product_id uuid,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  affiliate_gets_commission boolean NOT NULL DEFAULT true,
  commission_override numeric(6,2),
  coproducer_participates boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_bumps TO authenticated;
GRANT ALL ON public.aff_bumps TO service_role;
ALTER TABLE public.aff_bumps ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_upsells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  upsell_product_id uuid,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  trigger text NOT NULL DEFAULT 'after_approved' CHECK (trigger IN ('after_approved','after_pix_pending','checkout')),
  is_active boolean NOT NULL DEFAULT true,
  affiliate_gets_commission boolean NOT NULL DEFAULT true,
  commission_override numeric(6,2),
  coproducer_participates boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_upsells TO authenticated;
GRANT ALL ON public.aff_upsells TO service_role;
ALTER TABLE public.aff_upsells ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_crosssells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  cross_product_id uuid,
  name text NOT NULL,
  moment text NOT NULL DEFAULT 'post_purchase' CHECK (moment IN ('post_purchase','email','area','checkout')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_crosssells TO authenticated;
GRANT ALL ON public.aff_crosssells TO service_role;
ALTER TABLE public.aff_crosssells ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_crm_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid,
  affiliate_id uuid,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cart_recovery','pix_pending','boleto_pending','card_declined','repurchase','post_purchase')),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  stop_on_paid boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_crm_flows TO authenticated;
GRANT ALL ON public.aff_crm_flows TO service_role;
ALTER TABLE public.aff_crm_flows ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.aff_crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  flow_id uuid NOT NULL REFERENCES public.aff_crm_flows(id) ON DELETE CASCADE,
  sale_id uuid,
  customer_email text,
  customer_phone text,
  step_index int NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  converted_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','converted','cancelled','failed')),
  channel text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_crm_events TO authenticated;
GRANT ALL ON public.aff_crm_events TO service_role;
ALTER TABLE public.aff_crm_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_aff_crm_events_status ON public.aff_crm_events(company_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_aff_product_plans_product ON public.aff_product_plans(product_id);
CREATE INDEX IF NOT EXISTS idx_aff_bumps_product ON public.aff_bumps(product_id);
CREATE INDEX IF NOT EXISTS idx_aff_upsells_product ON public.aff_upsells(product_id);
CREATE INDEX IF NOT EXISTS idx_aff_coupons_code ON public.aff_coupons(company_id, code);

DO $$ BEGIN CREATE TRIGGER trg_aff_product_plans_uat BEFORE UPDATE ON public.aff_product_plans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_aff_coupons_uat BEFORE UPDATE ON public.aff_coupons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_aff_bumps_uat BEFORE UPDATE ON public.aff_bumps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_aff_upsells_uat BEFORE UPDATE ON public.aff_upsells FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_aff_crosssells_uat BEFORE UPDATE ON public.aff_crosssells FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_aff_crm_flows_uat BEFORE UPDATE ON public.aff_crm_flows FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.permissions (code, module, description) VALUES
  ('aff.plan.read','affiliates','Listar planos de produtos'),
  ('aff.plan.write','affiliates','Criar/editar/remover planos'),
  ('aff.coupon.read','affiliates','Ver cupons'),
  ('aff.coupon.write','affiliates','Editar cupons'),
  ('aff.bump.read','affiliates','Ver order bumps'),
  ('aff.bump.write','affiliates','Editar order bumps'),
  ('aff.upsell.read','affiliates','Ver upsells'),
  ('aff.upsell.write','affiliates','Editar upsells'),
  ('aff.crosssell.read','affiliates','Ver cross-sells'),
  ('aff.crosssell.write','affiliates','Editar cross-sells'),
  ('aff.crm.read','affiliates','Ver CRM de vendas'),
  ('aff.crm.write','affiliates','Editar CRM de vendas')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profiles p
CROSS JOIN public.permissions perm
WHERE p.slug = 'super-admin-impulsionando'
  AND perm.code IN (
    'aff.plan.read','aff.plan.write','aff.coupon.read','aff.coupon.write',
    'aff.bump.read','aff.bump.write','aff.upsell.read','aff.upsell.write',
    'aff.crosssell.read','aff.crosssell.write','aff.crm.read','aff.crm.write'
  )
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS aff_product_plans_select ON public.aff_product_plans;
CREATE POLICY aff_product_plans_select ON public.aff_product_plans FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.plan.read'));
DROP POLICY IF EXISTS aff_product_plans_write ON public.aff_product_plans;
CREATE POLICY aff_product_plans_write ON public.aff_product_plans FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.plan.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.plan.write'));

DROP POLICY IF EXISTS aff_coupons_select ON public.aff_coupons;
CREATE POLICY aff_coupons_select ON public.aff_coupons FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.coupon.read'));
DROP POLICY IF EXISTS aff_coupons_write ON public.aff_coupons;
CREATE POLICY aff_coupons_write ON public.aff_coupons FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.coupon.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.coupon.write'));

DROP POLICY IF EXISTS aff_bumps_select ON public.aff_bumps;
CREATE POLICY aff_bumps_select ON public.aff_bumps FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.bump.read'));
DROP POLICY IF EXISTS aff_bumps_write ON public.aff_bumps;
CREATE POLICY aff_bumps_write ON public.aff_bumps FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.bump.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.bump.write'));

DROP POLICY IF EXISTS aff_upsells_select ON public.aff_upsells;
CREATE POLICY aff_upsells_select ON public.aff_upsells FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.upsell.read'));
DROP POLICY IF EXISTS aff_upsells_write ON public.aff_upsells;
CREATE POLICY aff_upsells_write ON public.aff_upsells FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.upsell.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.upsell.write'));

DROP POLICY IF EXISTS aff_crosssells_select ON public.aff_crosssells;
CREATE POLICY aff_crosssells_select ON public.aff_crosssells FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crosssell.read'));
DROP POLICY IF EXISTS aff_crosssells_write ON public.aff_crosssells;
CREATE POLICY aff_crosssells_write ON public.aff_crosssells FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crosssell.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crosssell.write'));

DROP POLICY IF EXISTS aff_crm_flows_select ON public.aff_crm_flows;
CREATE POLICY aff_crm_flows_select ON public.aff_crm_flows FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.read'));
DROP POLICY IF EXISTS aff_crm_flows_write ON public.aff_crm_flows;
CREATE POLICY aff_crm_flows_write ON public.aff_crm_flows FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.write'));

DROP POLICY IF EXISTS aff_crm_events_select ON public.aff_crm_events;
CREATE POLICY aff_crm_events_select ON public.aff_crm_events FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.read'));
DROP POLICY IF EXISTS aff_crm_events_write ON public.aff_crm_events;
CREATE POLICY aff_crm_events_write ON public.aff_crm_events FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.write'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.write'));
