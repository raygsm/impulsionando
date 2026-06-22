
-- Onda G: provisionar domínio público para tenants reais que ainda não tinham
UPDATE public.companies
SET domain = subdomain || '.impulsionando.com.br',
    updated_at = now()
WHERE is_active = true
  AND status = 'active'
  AND domain IS NULL
  AND subdomain IS NOT NULL
  AND name NOT ILIKE 'Demo %'
  AND name <> 'Impulsionando Sistemas';
