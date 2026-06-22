
-- ============ RENTALS ============
CREATE TABLE public.rental_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  daily_rate NUMERIC(12,2),
  monthly_rate NUMERIC(12,2),
  acquisition_cost NUMERIC(12,2),
  warehouse_id UUID,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, asset_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_assets TO authenticated;
GRANT ALL ON public.rental_assets TO service_role;
ALTER TABLE public.rental_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY rental_assets_tenant ON public.rental_assets FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE INDEX idx_rental_assets_company ON public.rental_assets(company_id);

CREATE TABLE public.rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_document TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  delivery_address TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, contract_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_contracts TO authenticated;
GRANT ALL ON public.rental_contracts TO service_role;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rental_contracts_tenant ON public.rental_contracts FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE INDEX idx_rental_contracts_company ON public.rental_contracts(company_id);

CREATE TABLE public.rental_contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.rental_assets(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_contract_items TO authenticated;
GRANT ALL ON public.rental_contract_items TO service_role;
ALTER TABLE public.rental_contract_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY rental_items_tenant ON public.rental_contract_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rental_contracts c WHERE c.id = contract_id AND (public.user_belongs_to_company(auth.uid(), c.company_id) OR public.is_impulsionando_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.rental_contracts c WHERE c.id = contract_id AND (public.user_belongs_to_company(auth.uid(), c.company_id) OR public.is_impulsionando_staff(auth.uid()))));
CREATE INDEX idx_rental_items_contract ON public.rental_contract_items(contract_id);

-- ============ SERVICE ORDERS ============
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  equipment_description TEXT NOT NULL,
  equipment_serial TEXT,
  service_type TEXT NOT NULL DEFAULT 'corrective',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  sla_due_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  diagnosis TEXT,
  resolution TEXT,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  parts_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, order_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_orders_tenant ON public.service_orders FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE INDEX idx_service_orders_company ON public.service_orders(company_id);
CREATE INDEX idx_service_orders_status ON public.service_orders(company_id, status);

CREATE TABLE public.service_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_events TO authenticated;
GRANT ALL ON public.service_order_events TO service_role;
ALTER TABLE public.service_order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_events_tenant ON public.service_order_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_orders o WHERE o.id = order_id AND (public.user_belongs_to_company(auth.uid(), o.company_id) OR public.is_impulsionando_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders o WHERE o.id = order_id AND (public.user_belongs_to_company(auth.uid(), o.company_id) OR public.is_impulsionando_staff(auth.uid()))));
CREATE INDEX idx_service_events_order ON public.service_order_events(order_id);

-- ============ LEAD ROUTING ============
CREATE TABLE public.crm_lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  assign_to UUID REFERENCES auth.users(id),
  assign_strategy TEXT NOT NULL DEFAULT 'specific',
  pipeline_id UUID REFERENCES public.crm_pipelines(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lead_routing_rules TO authenticated;
GRANT ALL ON public.crm_lead_routing_rules TO service_role;
ALTER TABLE public.crm_lead_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_routing_tenant ON public.crm_lead_routing_rules FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE INDEX idx_lead_routing_company ON public.crm_lead_routing_rules(company_id);

-- ============ ABANDONED CARTS ============
CREATE TABLE public.commerce_abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  cart_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovery_status TEXT NOT NULL DEFAULT 'pending',
  recovery_attempts INTEGER NOT NULL DEFAULT 0,
  recovered_at TIMESTAMPTZ,
  recovery_order_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commerce_abandoned_carts TO authenticated;
GRANT ALL ON public.commerce_abandoned_carts TO service_role;
ALTER TABLE public.commerce_abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY abandoned_carts_tenant ON public.commerce_abandoned_carts FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE INDEX idx_abandoned_carts_company ON public.commerce_abandoned_carts(company_id, recovery_status);

-- ============ TRIGGERS ============
CREATE TRIGGER trg_rental_assets_updated BEFORE UPDATE ON public.rental_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rental_contracts_updated BEFORE UPDATE ON public.rental_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_service_orders_updated BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lead_routing_updated BEFORE UPDATE ON public.crm_lead_routing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_abandoned_carts_updated BEFORE UPDATE ON public.commerce_abandoned_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
