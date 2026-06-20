-- VISITS
CREATE TABLE IF NOT EXISTS public.realestate_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  broker_user_id uuid,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  feedback text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_visits TO authenticated;
GRANT ALL ON public.realestate_visits TO service_role;
ALTER TABLE public.realestate_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_read" ON public.realestate_visits FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "visits_write" ON public.realestate_visits FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'operador')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- CONTRACTS
CREATE TABLE IF NOT EXISTS public.realestate_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.realestate_owners(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_document text,
  contract_type text NOT NULL DEFAULT 'sale',
  value numeric,
  status text NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  signed_at timestamptz,
  document_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_contracts TO authenticated;
GRANT ALL ON public.realestate_contracts TO service_role;
ALTER TABLE public.realestate_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_read" ON public.realestate_contracts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "contracts_write" ON public.realestate_contracts FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'operador')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE TRIGGER trg_realestate_visits_uat BEFORE UPDATE ON public.realestate_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_realestate_contracts_uat BEFORE UPDATE ON public.realestate_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_realestate_visits_company_date ON public.realestate_visits(company_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_realestate_contracts_company_status ON public.realestate_contracts(company_id, status);