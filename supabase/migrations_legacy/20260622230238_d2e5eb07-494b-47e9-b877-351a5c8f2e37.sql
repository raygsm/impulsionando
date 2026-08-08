
-- Onda H — registrar módulos RioMed no catálogo e habilitá-los no tenant
WITH new_modules(slug, name, category) AS (
  VALUES
    ('finance','Financeiro','erp'),
    ('fiscal','Fiscal','erp'),
    ('orders','Pedidos','commerce'),
    ('commissions','Comissões','sales'),
    ('agents','Agentes IA','ai'),
    ('service','Assistência Técnica','service'),
    ('ai-assistant','Assistente IA','ai'),
    ('automation','Automação','automation'),
    ('ai-search','Busca IA','ai'),
    ('carts','Carrinhos','commerce'),
    ('field-config','Configurações de Campos','core'),
    ('inventory','Estoque & Almoxarifados','erp'),
    ('governance','Governança','core'),
    ('onboarding','Implantação','core'),
    ('imports','Importações','core'),
    ('journeys','Jornadas','marketing'),
    ('rental','Locação','commerce'),
    ('marketing','Marketing','marketing'),
    ('n8n','n8n','automation'),
    ('operations','Operações','core'),
    ('partners','Parceiros','sales'),
    ('portal','Portal Cliente','customer'),
    ('pricing','Preços & Listas','commerce'),
    ('products','Produtos','commerce'),
    ('reports','Relatórios','analytics'),
    ('routing','Roteamento de Leads','sales'),
    ('sellers','Vendedores','sales')
)
INSERT INTO public.modules (slug, name, category)
SELECT slug, name, category FROM new_modules
ON CONFLICT (slug) DO NOTHING;

-- Habilita todos os módulos RioMed para o tenant riomed
INSERT INTO public.company_modules (company_id, module_id, is_enabled, enabled_at)
SELECT c.id, m.id, true, now()
FROM public.companies c
CROSS JOIN public.modules m
WHERE c.subdomain = 'riomed'
  AND m.slug IN ('finance','fiscal','orders','commissions','crm','agents','service','ai-assistant','automation','ai-search','carts','field-config','dashboard','inventory','governance','onboarding','imports','journeys','rental','marketing','n8n','operations','partners','portal','pricing','products','reports','routing','sellers')
ON CONFLICT (company_id, module_id) DO UPDATE SET is_enabled = true, enabled_at = COALESCE(public.company_modules.enabled_at, now());
