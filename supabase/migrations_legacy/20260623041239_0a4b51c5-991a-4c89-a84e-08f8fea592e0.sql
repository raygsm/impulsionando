
-- =========================================================
-- FASE 2 · ETAPA 2 · RBAC unificado RioMed
-- =========================================================

-- 1) Helper: verifica scope (setor) do usuário em uma empresa
CREATE OR REPLACE FUNCTION public.has_riomed_scope(_user_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.riomed_user_scopes
    WHERE user_id = _user_id
      AND scope = _scope
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- 2) View consolidada de papéis efetivos por usuário/empresa
CREATE OR REPLACE VIEW public.riomed_user_effective_roles
WITH (security_invoker = true)
AS
SELECT
  ur.user_id,
  ur.company_id,
  ur.role::text AS core_role,
  COALESCE(
    ARRAY_AGG(DISTINCT rus.scope) FILTER (WHERE rus.scope IS NOT NULL),
    ARRAY[]::text[]
  ) AS scopes,
  COALESCE(
    ARRAY_AGG(DISTINCT rt.code) FILTER (WHERE rt.code IS NOT NULL),
    ARRAY[]::text[]
  ) AS template_codes
FROM public.user_roles ur
LEFT JOIN public.riomed_user_scopes rus
  ON rus.user_id = ur.user_id AND rus.company_id = ur.company_id
LEFT JOIN public.riomed_role_templates rt
  ON rt.company_id = ur.company_id AND rt.sector = ANY(
    SELECT scope FROM public.riomed_user_scopes WHERE user_id = ur.user_id AND company_id = ur.company_id
  )
GROUP BY ur.user_id, ur.company_id, ur.role;

GRANT SELECT ON public.riomed_user_effective_roles TO authenticated;
GRANT ALL ON public.riomed_user_effective_roles TO service_role;

-- 3) Seed: 10 perfis-padrão do sistema (idempotente por code)
-- company_id = NULL para perfis-template globais (servem como catálogo);
-- cada tenant pode clonar com seu próprio company_id depois.
INSERT INTO public.riomed_role_templates
  (id, company_id, code, label, sector, scopes, description, is_system, display_order)
VALUES
  (gen_random_uuid(), NULL, 'master',             'Master',              'core',        ARRAY['*'],                                        'Acesso total ao tenant',                              true, 10),
  (gen_random_uuid(), NULL, 'admin_riomed',       'Admin RioMed',        'core',        ARRAY['admin','commercial','operations','logistics','finance','support','portal'], 'Administrador da operação RioMed',         true, 20),
  (gen_random_uuid(), NULL, 'gerente_comercial',  'Gerente Comercial',   'commercial',  ARRAY['commercial','reports'],                     'Gerencia equipe comercial, metas e comissões',        true, 30),
  (gen_random_uuid(), NULL, 'vendedor',           'Vendedor',            'commercial',  ARRAY['commercial'],                               'Vendedor com carteira de leads/orçamentos',           true, 40),
  (gen_random_uuid(), NULL, 'gerente_operacoes',  'Gerente de Operações','operations',  ARRAY['operations','logistics','reports'],         'Gerencia operação, logística e expedição',            true, 50),
  (gen_random_uuid(), NULL, 'expedicao',          'Expedição',           'logistics',   ARRAY['logistics'],                                'Separação, expedição e rastreio',                     true, 60),
  (gen_random_uuid(), NULL, 'financeiro',         'Financeiro',          'finance',     ARRAY['finance','reports'],                        'Recebimentos, pagamentos, conciliação e fiscal',      true, 70),
  (gen_random_uuid(), NULL, 'tecnico_suporte',    'Técnico de Suporte',  'support',     ARRAY['support'],                                  'Chamados, garantias e assistência técnica',           true, 80),
  (gen_random_uuid(), NULL, 'hospital_comprador', 'Hospital · Comprador','portal',      ARRAY['portal_hospital'],                          'Portal externo de hospital (B2B)',                    true, 90),
  (gen_random_uuid(), NULL, 'paciente',           'Paciente',            'portal',      ARRAY['portal_paciente'],                          'Portal externo de paciente',                          true, 100)
ON CONFLICT DO NOTHING;
