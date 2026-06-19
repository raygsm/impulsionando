
-- 1. Release channel on module_versions (stable/beta/dev) for pipeline DEV→HOMOLOG→PROD
ALTER TABLE public.module_versions
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'stable'
    CHECK (channel IN ('dev','beta','stable'));

-- 2. Release channel on companies: which channel each tenant subscribes to
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS release_channel text NOT NULL DEFAULT 'stable'
    CHECK (release_channel IN ('dev','beta','stable'));

-- 3. Insert DQA (only one missing of the 5 cited tenants)
INSERT INTO public.companies (name, subdomain, status, is_active, environment, release_channel, company_kind)
SELECT 'DQA', 'dqa', 'active', true, 'real', 'stable', 'real'
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE lower(name)='dqa');

-- 4. Wire the agenda.chrismed.com.br custom domain to CHRISMED tenant so the
-- host-based resolver (resolve_tenant_by_host) returns CHRISMED branding.
UPDATE public.companies
SET domain = 'agenda.chrismed.com.br'
WHERE lower(name) = 'chrismed' AND (domain IS NULL OR domain = '');

-- 5. Ensure other tenants have a subdomain on impulsionando.com.br
UPDATE public.companies SET subdomain = 'plataforma-saude'
WHERE lower(name) = 'plataforma saúde' AND (subdomain IS NULL OR subdomain='');
