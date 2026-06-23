
-- ============================================================
-- FASE 2 · ETAPA 1 · Schema RioMed (novas tabelas + campos)
-- ============================================================

-- 1) Campos faltantes em tabelas existentes ------------------
ALTER TABLE public.riomed_hospital_accounts
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS direccion_fiscal text,
  ADD COLUMN IF NOT EXISTS departamento_id uuid,
  ADD COLUMN IF NOT EXISTS municipio_id uuid;

ALTER TABLE public.riomed_products
  ADD COLUMN IF NOT EXISTS codigo_sin text,
  ADD COLUMN IF NOT EXISTS unidad_medida_fiscal text,
  ADD COLUMN IF NOT EXISTS peso_kg numeric,
  ADD COLUMN IF NOT EXISTS dimensoes jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.riomed_quotes
  ADD COLUMN IF NOT EXISTS validade_dias integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS condicao_pagamento text,
  ADD COLUMN IF NOT EXISTS prazo_entrega_dias integer,
  ADD COLUMN IF NOT EXISTS incoterm text;

-- 2) Catálogo - Compatibilidade & Equivalência ----------------
CREATE TABLE IF NOT EXISTS public.riomed_product_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  compatible_with_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  compatibility_type text NOT NULL DEFAULT 'fits_with',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, compatible_with_id, compatibility_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_product_compatibility TO authenticated;
GRANT ALL ON public.riomed_product_compatibility TO service_role;
ALTER TABLE public.riomed_product_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage compat" ON public.riomed_product_compatibility FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read compat" ON public.riomed_product_compatibility FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_product_equivalence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  equivalent_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.riomed_suppliers(id) ON DELETE SET NULL,
  confidence numeric DEFAULT 1.0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, equivalent_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_product_equivalence TO authenticated;
GRANT ALL ON public.riomed_product_equivalence TO service_role;
ALTER TABLE public.riomed_product_equivalence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage equiv" ON public.riomed_product_equivalence FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read equiv" ON public.riomed_product_equivalence FOR SELECT TO authenticated USING (true);

-- 3) Logística ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riomed_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  doc_id text,
  contact_phone text,
  contact_email text,
  service_types text[] DEFAULT ARRAY['ground']::text[],
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_carriers TO authenticated;
GRANT ALL ON public.riomed_carriers TO service_role;
ALTER TABLE public.riomed_carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage carriers" ON public.riomed_carriers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read carriers" ON public.riomed_carriers FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  shipment_code text NOT NULL,
  source_type text NOT NULL DEFAULT 'pos_sale',
  source_id uuid,
  hospital_id uuid REFERENCES public.riomed_hospital_accounts(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.riomed_warehouses(id) ON DELETE SET NULL,
  carrier_id uuid REFERENCES public.riomed_carriers(id) ON DELETE SET NULL,
  tracking_code text,
  status text NOT NULL DEFAULT 'pending',
  expected_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  recipient_name text,
  recipient_doc text,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  freight_cost numeric DEFAULT 0,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, shipment_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_shipments TO authenticated;
GRANT ALL ON public.riomed_shipments TO service_role;
ALTER TABLE public.riomed_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage shipments" ON public.riomed_shipments FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read shipments" ON public.riomed_shipments FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.riomed_shipments(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.riomed_products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.riomed_product_variants(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_label text,
  serial_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_shipment_items TO authenticated;
GRANT ALL ON public.riomed_shipment_items TO service_role;
ALTER TABLE public.riomed_shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage shipment items" ON public.riomed_shipment_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read shipment items" ON public.riomed_shipment_items FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.riomed_shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  location text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_tracking_events TO authenticated;
GRANT ALL ON public.riomed_tracking_events TO service_role;
ALTER TABLE public.riomed_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tracking" ON public.riomed_tracking_events FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read tracking" ON public.riomed_tracking_events FOR SELECT TO authenticated USING (true);

-- 4) Suporte - Garantia & SLA ---------------------------------
CREATE TABLE IF NOT EXISTS public.riomed_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'pos_sale',
  source_id uuid,
  product_id uuid REFERENCES public.riomed_products(id) ON DELETE SET NULL,
  serial_number text,
  hospital_id uuid REFERENCES public.riomed_hospital_accounts(id) ON DELETE SET NULL,
  starts_at date NOT NULL DEFAULT now()::date,
  ends_at date NOT NULL,
  terms text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_warranties TO authenticated;
GRANT ALL ON public.riomed_warranties TO service_role;
ALTER TABLE public.riomed_warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage warranties" ON public.riomed_warranties FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read warranties" ON public.riomed_warranties FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'support',
  first_response_minutes integer NOT NULL DEFAULT 240,
  resolution_minutes integer NOT NULL DEFAULT 2880,
  business_hours jsonb DEFAULT '{"days":[1,2,3,4,5],"start":"08:00","end":"18:00"}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_sla_policies TO authenticated;
GRANT ALL ON public.riomed_sla_policies TO service_role;
ALTER TABLE public.riomed_sla_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sla" ON public.riomed_sla_policies FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read sla" ON public.riomed_sla_policies FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_ticket_sla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.riomed_support_tickets(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES public.riomed_sla_policies(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  breached boolean DEFAULT false,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_ticket_sla_events TO authenticated;
GRANT ALL ON public.riomed_ticket_sla_events TO service_role;
ALTER TABLE public.riomed_ticket_sla_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sla events" ON public.riomed_ticket_sla_events FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read sla events" ON public.riomed_ticket_sla_events FOR SELECT TO authenticated USING (true);

-- 5) Financeiro ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.riomed_credit_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  hospital_id uuid NOT NULL REFERENCES public.riomed_hospital_accounts(id) ON DELETE CASCADE,
  credit_limit numeric NOT NULL DEFAULT 0,
  used_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, currency)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_credit_limits TO authenticated;
GRANT ALL ON public.riomed_credit_limits TO service_role;
ALTER TABLE public.riomed_credit_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage credit" ON public.riomed_credit_limits FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read credit" ON public.riomed_credit_limits FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_cash_flow_forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  forecast_date date NOT NULL,
  direction text NOT NULL,
  category text,
  source_type text,
  source_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  status text NOT NULL DEFAULT 'projected',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_cash_flow_forecast TO authenticated;
GRANT ALL ON public.riomed_cash_flow_forecast TO service_role;
ALTER TABLE public.riomed_cash_flow_forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cashflow" ON public.riomed_cash_flow_forecast FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read cashflow" ON public.riomed_cash_flow_forecast FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_bank_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  bank_account text NOT NULL,
  statement_date date NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BOB',
  description text,
  matched_type text,
  matched_id uuid,
  status text NOT NULL DEFAULT 'unmatched',
  reconciled_at timestamptz,
  reconciled_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_bank_reconciliation TO authenticated;
GRANT ALL ON public.riomed_bank_reconciliation TO service_role;
ALTER TABLE public.riomed_bank_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reconciliation" ON public.riomed_bank_reconciliation FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read reconciliation" ON public.riomed_bank_reconciliation FOR SELECT TO authenticated USING (true);

-- 6) Fiscal Bolívia (stub SIN/Siat) --------------------------
CREATE TABLE IF NOT EXISTS public.riomed_fiscal_invoices_bo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'pos_sale',
  source_id uuid,
  hospital_id uuid REFERENCES public.riomed_hospital_accounts(id) ON DELETE SET NULL,
  invoice_number text,
  authorization_code text,
  control_code text,
  cuf text,
  issue_date timestamptz,
  total_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  buyer_nit text,
  buyer_name text,
  status text NOT NULL DEFAULT 'draft',
  xml_payload text,
  pdf_url text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_fiscal_invoices_bo TO authenticated;
GRANT ALL ON public.riomed_fiscal_invoices_bo TO service_role;
ALTER TABLE public.riomed_fiscal_invoices_bo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fiscal bo" ON public.riomed_fiscal_invoices_bo FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read fiscal bo" ON public.riomed_fiscal_invoices_bo FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_fiscal_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  fiscal_invoice_id uuid REFERENCES public.riomed_fiscal_invoices_bo(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_fiscal_log TO authenticated;
GRANT ALL ON public.riomed_fiscal_log TO service_role;
ALTER TABLE public.riomed_fiscal_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fiscal log" ON public.riomed_fiscal_log FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated read fiscal log" ON public.riomed_fiscal_log FOR SELECT TO authenticated USING (true);

-- 7) Triggers updated_at -------------------------------------
CREATE TRIGGER trg_riomed_compat_updated BEFORE UPDATE ON public.riomed_product_compatibility FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_equiv_updated BEFORE UPDATE ON public.riomed_product_equivalence FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_carriers_updated BEFORE UPDATE ON public.riomed_carriers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_shipments_updated BEFORE UPDATE ON public.riomed_shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_warranties_updated BEFORE UPDATE ON public.riomed_warranties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_sla_updated BEFORE UPDATE ON public.riomed_sla_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_credit_updated BEFORE UPDATE ON public.riomed_credit_limits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_cashflow_updated BEFORE UPDATE ON public.riomed_cash_flow_forecast FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_reconciliation_updated BEFORE UPDATE ON public.riomed_bank_reconciliation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_riomed_fiscal_bo_updated BEFORE UPDATE ON public.riomed_fiscal_invoices_bo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8) Índices úteis -------------------------------------------
CREATE INDEX IF NOT EXISTS idx_riomed_shipments_company_status ON public.riomed_shipments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_riomed_shipments_hospital ON public.riomed_shipments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_riomed_warranties_company ON public.riomed_warranties(company_id, ends_at);
CREATE INDEX IF NOT EXISTS idx_riomed_cashflow_company_date ON public.riomed_cash_flow_forecast(company_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_riomed_fiscal_bo_company_status ON public.riomed_fiscal_invoices_bo(company_id, status);
CREATE INDEX IF NOT EXISTS idx_riomed_compat_product ON public.riomed_product_compatibility(product_id);
CREATE INDEX IF NOT EXISTS idx_riomed_equiv_product ON public.riomed_product_equivalence(product_id);
