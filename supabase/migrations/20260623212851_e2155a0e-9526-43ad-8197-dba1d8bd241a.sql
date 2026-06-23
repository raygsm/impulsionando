
CREATE TABLE public.core_branding_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published','archived')),
  trade_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (company_id, version_number)
);

CREATE INDEX core_branding_versions_company_idx
  ON public.core_branding_versions (company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_branding_versions TO authenticated;
GRANT ALL ON public.core_branding_versions TO service_role;

ALTER TABLE public.core_branding_versions ENABLE ROW LEVEL SECURITY;

-- Super admin / staff Impulsionando: tudo
CREATE POLICY "branding_versions_master_all"
  ON public.core_branding_versions FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_impulsionando_staff(auth.uid()));

-- Membros da empresa: leitura + escrita do próprio tenant
CREATE POLICY "branding_versions_company_members"
  ON public.core_branding_versions FOR ALL
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
  );
