-- DOCUMENTS
CREATE TABLE IF NOT EXISTS public.realestate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.realestate_owners(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.realestate_contracts(id) ON DELETE SET NULL,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'outro',
  file_url text,
  expires_at date,
  status text NOT NULL DEFAULT 'valid',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_documents TO authenticated;
GRANT ALL ON public.realestate_documents TO service_role;
ALTER TABLE public.realestate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redocs_read" ON public.realestate_documents FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "redocs_write" ON public.realestate_documents FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'operador')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- FINANCINGS
CREATE TABLE IF NOT EXISTS public.realestate_financings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.realestate_contracts(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_document text,
  bank text,
  property_value numeric,
  down_payment numeric,
  financed_value numeric,
  term_months integer,
  interest_rate numeric,
  monthly_installment numeric,
  status text NOT NULL DEFAULT 'simulation',
  submitted_at timestamptz,
  approved_at timestamptz,
  denied_reason text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_financings TO authenticated;
GRANT ALL ON public.realestate_financings TO service_role;
ALTER TABLE public.realestate_financings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refin_read" ON public.realestate_financings FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "refin_write" ON public.realestate_financings FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'operador')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE TRIGGER trg_realestate_documents_uat BEFORE UPDATE ON public.realestate_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_realestate_financings_uat BEFORE UPDATE ON public.realestate_financings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_realestate_documents_company ON public.realestate_documents(company_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_realestate_financings_company_status ON public.realestate_financings(company_id, status);