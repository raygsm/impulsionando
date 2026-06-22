ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS phone_country_code text NOT NULL DEFAULT '+55',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

ALTER TABLE public.companies
  ADD CONSTRAINT companies_country_code_chk CHECK (country_code ~ '^[A-Z]{2}$');

ALTER TABLE public.companies
  ADD CONSTRAINT companies_currency_code_chk CHECK (currency_code ~ '^[A-Z]{3}$');

COMMENT ON COLUMN public.companies.country_code IS 'ISO 3166-1 alpha-2. BR padrão; BO para tenants bolivianos.';
COMMENT ON COLUMN public.companies.locale IS 'IETF BCP 47. Ex: pt-BR (padrão), es-BO.';
COMMENT ON COLUMN public.companies.currency_code IS 'ISO 4217. BRL padrão; BOB para Bolívia.';
COMMENT ON COLUMN public.companies.phone_country_code IS 'DDI E.164. +55 padrão; +591 Bolívia.';
COMMENT ON COLUMN public.companies.timezone IS 'IANA. America/Sao_Paulo padrão; America/La_Paz Bolívia.';