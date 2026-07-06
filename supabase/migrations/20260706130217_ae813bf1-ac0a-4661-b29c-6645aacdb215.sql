CREATE TABLE public.core_tenant_publication_state (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_ok BOOLEAN NOT NULL DEFAULT false,
  dns_ok BOOLEAN NOT NULL DEFAULT false,
  ssl_ok BOOLEAN NOT NULL DEFAULT false,
  supabase_ok BOOLEAN NOT NULL DEFAULT false,
  github_ok BOOLEAN NOT NULL DEFAULT false,
  env_ok BOOLEAN NOT NULL DEFAULT false,
  validation_detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  validated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  snapshot_id TEXT,
  previous_snapshot_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_tenant_publication_state TO authenticated;
GRANT ALL ON public.core_tenant_publication_state TO service_role;

ALTER TABLE public.core_tenant_publication_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read tenant publication state"
  ON public.core_tenant_publication_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tenant publication state"
  ON public.core_tenant_publication_state
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tenant publication state"
  ON public.core_tenant_publication_state
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tenant publication state"
  ON public.core_tenant_publication_state
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_core_tenant_publication_state_updated_at
  BEFORE UPDATE ON public.core_tenant_publication_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
