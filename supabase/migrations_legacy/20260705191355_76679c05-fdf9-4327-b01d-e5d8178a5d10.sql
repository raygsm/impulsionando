
CREATE TABLE public.tenant_subdomain_probes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  host TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  url TEXT NOT NULL,
  final_url TEXT,
  status INT,
  status_text TEXT,
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  elapsed_ms INT,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  body_preview TEXT,
  diagnosis TEXT,
  attempt INT NOT NULL DEFAULT 1,
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_subdomain_probes_company_created
  ON public.tenant_subdomain_probes (company_id, created_at DESC);

GRANT SELECT, INSERT ON public.tenant_subdomain_probes TO authenticated;
GRANT ALL ON public.tenant_subdomain_probes TO service_role;

ALTER TABLE public.tenant_subdomain_probes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read subdomain probes"
  ON public.tenant_subdomain_probes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subdomain probes"
  ON public.tenant_subdomain_probes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
