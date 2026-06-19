-- =========================================================
-- FIX 1: catalog_intents — remover leitura pública de leads
-- =========================================================
DROP POLICY IF EXISTS "catalog intents read by id unconsumed" ON public.catalog_intents;

-- Função segura: anônimo só lê SEU próprio intent informando o session_token correto
CREATE OR REPLACE FUNCTION public.get_catalog_intent_by_token(p_token text)
RETURNS public.catalog_intents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.catalog_intents
  WHERE session_token = p_token
    AND consumed_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_catalog_intent_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catalog_intent_by_token(text) TO anon, authenticated, service_role;

-- =========================================================
-- FIX 2: talentos_candidatos — exigir empresa com módulo Talentos ativo
-- =========================================================
CREATE OR REPLACE FUNCTION public.user_has_company_module(_user uuid, _module_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.company_modules cm ON cm.company_id = up.company_id
    JOIN public.modules m         ON m.id = cm.module_id
    WHERE up.user_id = _user
      AND up.is_active = true
      AND cm.is_enabled = true
      AND m.slug = _module_slug
  );
$$;
REVOKE ALL ON FUNCTION public.user_has_company_module(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_company_module(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "empresas leem candidatos visiveis" ON public.talentos_candidatos;
CREATE POLICY "empresas com modulo talentos leem candidatos visiveis"
ON public.talentos_candidatos
FOR SELECT
TO authenticated
USING (
  ativo = true
  AND visivel_rede = true
  AND (
    public.user_has_company_module(auth.uid(), 'talentos')
    OR public.is_impulsionando_staff(auth.uid())
  )
);

-- =========================================================
-- FIX 3: talentos_company_settings — usar vínculo real usuário↔empresa
-- =========================================================
DROP POLICY IF EXISTS "talentos settings empresa" ON public.talentos_company_settings;
CREATE POLICY "talentos settings empresa membros"
ON public.talentos_company_settings
FOR ALL
TO authenticated
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
)
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
);