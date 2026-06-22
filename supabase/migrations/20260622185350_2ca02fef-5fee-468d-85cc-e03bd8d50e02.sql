
-- ============ FORNECEDORES ============
CREATE TABLE public.riomed_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  trade_name text,
  tax_id text,
  country text DEFAULT 'BO',
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  website text,
  categories text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  notes text,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_suppliers TO authenticated;
GRANT INSERT ON public.riomed_suppliers TO anon;
GRANT ALL ON public.riomed_suppliers TO service_role;
ALTER TABLE public.riomed_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY rs_admin_all ON public.riomed_suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_suppliers.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_suppliers.company_id));
CREATE TRIGGER trg_rs_updated_at BEFORE UPDATE ON public.riomed_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_supplier_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.riomed_suppliers(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  category text,
  brand text,
  sku text,
  unit_price numeric(14,2),
  currency text DEFAULT 'BOB',
  moq int,
  lead_time_days int,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  linked_product_id uuid REFERENCES public.riomed_products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_supplier_offers TO authenticated;
GRANT INSERT ON public.riomed_supplier_offers TO anon;
GRANT ALL ON public.riomed_supplier_offers TO service_role;
ALTER TABLE public.riomed_supplier_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY rso_admin_all ON public.riomed_supplier_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_supplier_offers.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_supplier_offers.company_id));
CREATE TRIGGER trg_rso_updated_at BEFORE UPDATE ON public.riomed_supplier_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TÉCNICOS ============
CREATE TABLE public.riomed_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  document text,
  specialties text[] DEFAULT '{}',
  service_areas text[] DEFAULT '{}',
  experience_years int,
  certifications text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','inactive')),
  available boolean NOT NULL DEFAULT true,
  rating numeric(3,2),
  notes text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_technicians TO authenticated;
GRANT INSERT ON public.riomed_technicians TO anon;
GRANT ALL ON public.riomed_technicians TO service_role;
ALTER TABLE public.riomed_technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY rt_admin_all ON public.riomed_technicians FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_technicians.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_technicians.company_id));
CREATE TRIGGER trg_rt_updated_at BEFORE UPDATE ON public.riomed_technicians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_technician_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.riomed_technicians(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('installation','maintenance','repair','training','delivery')),
  title text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.riomed_products(id) ON DELETE SET NULL,
  address jsonb DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','done','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_technician_assignments TO authenticated;
GRANT ALL ON public.riomed_technician_assignments TO service_role;
ALTER TABLE public.riomed_technician_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY rta_admin_all ON public.riomed_technician_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_technician_assignments.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_technician_assignments.company_id));
CREATE INDEX rta_status_idx ON public.riomed_technician_assignments(company_id, status, scheduled_for);
CREATE TRIGGER trg_rta_updated_at BEFORE UPDATE ON public.riomed_technician_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CANDIDATOS / TALENTOS ============
CREATE TABLE public.riomed_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  position_interest text NOT NULL,
  city text,
  experience_summary text,
  resume_url text,
  linkedin_url text,
  expected_salary numeric(14,2),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','interview','offer','hired','rejected','archived')),
  source text DEFAULT 'portal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_candidates TO authenticated;
GRANT INSERT ON public.riomed_candidates TO anon;
GRANT ALL ON public.riomed_candidates TO service_role;
ALTER TABLE public.riomed_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc2_admin_all ON public.riomed_candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_candidates.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_candidates.company_id));
CREATE TRIGGER trg_rc2_updated_at BEFORE UPDATE ON public.riomed_candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HOSPITAIS ============
CREATE TABLE public.riomed_hospital_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hospital_name text NOT NULL,
  tax_id text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  city text,
  beds_count int,
  segment text CHECK (segment IN ('public','private','mixed','clinic','laboratory')),
  sla_hours int DEFAULT 24,
  payment_terms text,
  credit_limit numeric(14,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','closed')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_hospital_accounts TO authenticated;
GRANT INSERT ON public.riomed_hospital_accounts TO anon;
GRANT ALL ON public.riomed_hospital_accounts TO service_role;
ALTER TABLE public.riomed_hospital_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rha_admin_all ON public.riomed_hospital_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_hospital_accounts.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_hospital_accounts.company_id));
CREATE TRIGGER trg_rha_updated_at BEFORE UPDATE ON public.riomed_hospital_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_hospital_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES public.riomed_hospital_accounts(id) ON DELETE SET NULL,
  request_kind text NOT NULL CHECK (request_kind IN ('purchase','rental','consignment','loan','emergency','quote')),
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent','critical')),
  needed_by timestamptz,
  estimated_value numeric(14,2),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','quoted','approved','fulfilling','delivered','cancelled')),
  quote_id uuid REFERENCES public.riomed_quotes(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_hospital_requests TO authenticated;
GRANT INSERT ON public.riomed_hospital_requests TO anon;
GRANT ALL ON public.riomed_hospital_requests TO service_role;
ALTER TABLE public.riomed_hospital_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY rhr_admin_all ON public.riomed_hospital_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_hospital_requests.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_hospital_requests.company_id));
CREATE INDEX rhr_status_idx ON public.riomed_hospital_requests(company_id, status, priority, needed_by);
CREATE TRIGGER trg_rhr_updated_at BEFORE UPDATE ON public.riomed_hospital_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
