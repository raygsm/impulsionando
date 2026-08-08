
-- Garantir coluna "code" em sectors (slug do setor: estoque, financeiro, comercial, logistica…)
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS code TEXT;
UPDATE public.sectors SET code = lower(regexp_replace(coalesce(name,'setor'), '[^a-zA-Z0-9]+', '_', 'g')) WHERE code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sectors_company_code ON public.sectors(company_id, code) WHERE code IS NOT NULL;

-- 1) FISCAL / LOGISTICA no tenant
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS fiscal_auto_emit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal_provider TEXT,
  ADD COLUMN IF NOT EXISTS logistics_pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS logistics_dispatch_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS logistics_default_origin_cep TEXT;

-- 2) FRETES
CREATE TABLE IF NOT EXISTS public.logistics_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  region_code TEXT NOT NULL,
  modality TEXT NOT NULL,
  min_weight_g INTEGER NOT NULL DEFAULT 0,
  max_weight_g INTEGER NOT NULL DEFAULT 999999999,
  base_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_kg_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  eta_days_min INTEGER NOT NULL DEFAULT 1,
  eta_days_max INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logistics_shipping_rates TO authenticated;
GRANT ALL ON public.logistics_shipping_rates TO service_role;
ALTER TABLE public.logistics_shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rates_read" ON public.logistics_shipping_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "rates_admin" ON public.logistics_shipping_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) ORDER LOGISTICS
CREATE TABLE IF NOT EXISTS public.order_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.riomed_quotes(id) ON DELETE CASCADE,
  customer_id UUID,
  seller_id UUID,
  fulfillment_mode TEXT NOT NULL CHECK (fulfillment_mode IN ('pickup','dispatch')),
  shipping_modality TEXT,
  shipping_rate_id UUID REFERENCES public.logistics_shipping_rates(id),
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  weight_g INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reserved','ready','dispatched','delivered','picked_up','cancelled')),
  tracking_code TEXT,
  carrier TEXT,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_logistics TO authenticated;
GRANT ALL ON public.order_logistics TO service_role;
ALTER TABLE public.order_logistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ol_read" ON public.order_logistics FOR SELECT TO authenticated USING (true);
CREATE POLICY "ol_write" ON public.order_logistics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_ol_quote ON public.order_logistics(quote_id);
CREATE INDEX IF NOT EXISTS idx_ol_company_status ON public.order_logistics(company_id, status);

-- 4) ORDER EVENTS
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_id UUID,
  order_logistics_id UUID REFERENCES public.order_logistics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oe_read" ON public.order_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "oe_insert" ON public.order_events FOR INSERT TO authenticated WITH CHECK (true);

-- 5) SECTOR MEMBERS
CREATE TABLE IF NOT EXISTS public.sector_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_in_sector TEXT NOT NULL DEFAULT 'member' CHECK (role_in_sector IN ('lead','member','viewer')),
  notify_channels TEXT[] NOT NULL DEFAULT ARRAY['inapp']::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sector_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_members TO authenticated;
GRANT ALL ON public.sector_members TO service_role;
ALTER TABLE public.sector_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_self_read" ON public.sector_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sm_admin" ON public.sector_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_sm_company_sector ON public.sector_members(company_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_sm_user ON public.sector_members(user_id);

CREATE OR REPLACE FUNCTION public.user_sector_codes(_company UUID, _user UUID)
RETURNS TEXT[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(DISTINCT s.code), ARRAY[]::text[])
  FROM public.sector_members sm
  JOIN public.sectors s ON s.id = sm.sector_id
  WHERE sm.company_id = _company AND sm.user_id = _user AND sm.is_active = true
$$;

-- 6) PRO-RATA MODULE CHANGE LOG
CREATE TABLE IF NOT EXISTS public.module_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id UUID,
  module_slug TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade','downgrade','add','remove')),
  previous_amount NUMERIC(12,2),
  new_amount NUMERIC(12,2),
  prorata_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  prorata_days INTEGER NOT NULL DEFAULT 0,
  cycle_days INTEGER NOT NULL DEFAULT 30,
  applied_to_invoice_id UUID REFERENCES public.billing_invoices(id),
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.module_change_log TO authenticated;
GRANT ALL ON public.module_change_log TO service_role;
ALTER TABLE public.module_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_read" ON public.module_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "mcl_admin" ON public.module_change_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) CRM TOUCH RULES
CREATE TABLE IF NOT EXISTS public.crm_touch_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  offset_days INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'inapp' CHECK (channel IN ('inapp','email','whatsapp','task')),
  template_code TEXT,
  assign_to TEXT NOT NULL DEFAULT 'seller' CHECK (assign_to IN ('seller','sector','owner','none')),
  sector_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_touch_rules TO authenticated;
GRANT ALL ON public.crm_touch_rules TO service_role;
ALTER TABLE public.crm_touch_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctr_read" ON public.crm_touch_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "ctr_admin" ON public.crm_touch_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8) CRM TOUCH QUEUE
CREATE TABLE IF NOT EXISTS public.crm_touch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.crm_touch_rules(id) ON DELETE SET NULL,
  rule_code TEXT,
  lead_id UUID,
  opportunity_id UUID,
  quote_id UUID,
  customer_id UUID,
  assignee_user_id UUID,
  channel TEXT NOT NULL DEFAULT 'inapp',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crm_touch_queue TO authenticated;
GRANT ALL ON public.crm_touch_queue TO service_role;
ALTER TABLE public.crm_touch_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctq_read" ON public.crm_touch_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "ctq_admin" ON public.crm_touch_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_ctq_due ON public.crm_touch_queue(status, scheduled_for) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_ctq_company ON public.crm_touch_queue(company_id);

-- 9) updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ol_updated_at') THEN
    CREATE TRIGGER trg_ol_updated_at BEFORE UPDATE ON public.order_logistics
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_sr_updated_at') THEN
    CREATE TRIGGER trg_sr_updated_at BEFORE UPDATE ON public.logistics_shipping_rates
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_sm_updated_at') THEN
    CREATE TRIGGER trg_sm_updated_at BEFORE UPDATE ON public.sector_members
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ctr_updated_at') THEN
    CREATE TRIGGER trg_ctr_updated_at BEFORE UPDATE ON public.crm_touch_rules
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
