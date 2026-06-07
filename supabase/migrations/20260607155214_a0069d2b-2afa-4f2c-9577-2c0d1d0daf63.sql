
CREATE OR REPLACE FUNCTION public.core_user_belongs_to_company(_uid uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = _uid AND up.company_id = _company_id);
$$;

CREATE TABLE public.onboarding_domain_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('subdomain','own','register')),
  requested_value text, alternatives text,
  contact_name text, contact_email text, contact_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reserved','in_progress','done','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_domain_requests TO authenticated;
GRANT ALL ON public.onboarding_domain_requests TO service_role;
ALTER TABLE public.onboarding_domain_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff all domain_req" ON public.onboarding_domain_requests FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "company read domain_req" ON public.onboarding_domain_requests FOR SELECT TO authenticated
  USING (public.core_user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "company insert domain_req" ON public.onboarding_domain_requests FOR INSERT TO authenticated
  WITH CHECK (public.core_user_belongs_to_company(auth.uid(), company_id));

CREATE TABLE public.onboarding_email_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  address_prefix text NOT NULL,
  full_address text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','provisioned','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_email_requests TO authenticated;
GRANT ALL ON public.onboarding_email_requests TO service_role;
ALTER TABLE public.onboarding_email_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff all email_req" ON public.onboarding_email_requests FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "company read email_req" ON public.onboarding_email_requests FOR SELECT TO authenticated
  USING (public.core_user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "company insert email_req" ON public.onboarding_email_requests FOR INSERT TO authenticated
  WITH CHECK (public.core_user_belongs_to_company(auth.uid(), company_id));

CREATE TABLE public.onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','skipped')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, item_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_checklist TO authenticated;
GRANT ALL ON public.onboarding_checklist TO service_role;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff all checklist" ON public.onboarding_checklist FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "company read checklist" ON public.onboarding_checklist FOR SELECT TO authenticated
  USING (public.core_user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "company upsert checklist" ON public.onboarding_checklist FOR INSERT TO authenticated
  WITH CHECK (public.core_user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "company update checklist" ON public.onboarding_checklist FOR UPDATE TO authenticated
  USING (public.core_user_belongs_to_company(auth.uid(), company_id));

CREATE TRIGGER trg_onb_domain_updated BEFORE UPDATE ON public.onboarding_domain_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_onb_email_updated BEFORE UPDATE ON public.onboarding_email_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_onb_checklist_updated BEFORE UPDATE ON public.onboarding_checklist
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_onb_domain_company ON public.onboarding_domain_requests(company_id);
CREATE INDEX idx_onb_email_company ON public.onboarding_email_requests(company_id);
CREATE INDEX idx_onb_checklist_company ON public.onboarding_checklist(company_id);
