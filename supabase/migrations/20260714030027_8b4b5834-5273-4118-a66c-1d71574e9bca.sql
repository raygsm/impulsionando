
CREATE TABLE public.seo_route_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route TEXT NOT NULL,
  url TEXT NOT NULL,
  final_url TEXT,
  status_code INT,
  canonical_declared TEXT,
  canonical_effective TEXT,
  canonical_ok BOOLEAN,
  robots_meta TEXT,
  redirect_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  jsonld_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  jsonld_errors INT NOT NULL DEFAULT 0,
  jsonld_warnings INT NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX seo_route_audits_route_idx ON public.seo_route_audits (route, created_at DESC);
CREATE INDEX seo_route_audits_created_idx ON public.seo_route_audits (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_route_audits TO authenticated;
GRANT ALL ON public.seo_route_audits TO service_role;
ALTER TABLE public.seo_route_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view seo audits" ON public.seo_route_audits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert seo audits" ON public.seo_route_audits FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seo audits" ON public.seo_route_audits FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
