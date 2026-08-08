
-- 1) Seed core_niche_modules (idempotente — UNIQUE(niche_id, module_slug))
WITH n AS (SELECT id, slug FROM public.niches),
seed(niche_slug, module_slug, sort_order) AS (
  VALUES
    -- Clínicas e Saúde
    ('saude','crm',10),('saude','agenda',20),('saude','financeiro',30),
    ('saude','area_cliente',40),('saude','automacao',50),('saude','bi',60),
    ('saude','fidelizacao',70),
    -- Bares e Restaurantes
    ('bares','pdv',10),('bares','estoque',20),('bares','delivery',30),
    ('bares','fidelizacao',40),('bares','financeiro',50),('bares','bi',60),
    ('bares','automacao',70),
    -- Microcervejarias / Fornecedores
    ('cervejarias','erp',10),('cervejarias','estoque',20),('cervejarias','commerce',30),
    ('cervejarias','financeiro',40),('cervejarias','crm',50),('cervejarias','bi',60),
    -- Serviços em geral
    ('servicos','crm',10),('servicos','agenda',20),('servicos','financeiro',30),
    ('servicos','automacao',40),('servicos','bi',50),('servicos','area_cliente',60),
    -- E-commerce e Varejo
    ('ecommerce','commerce',10),('ecommerce','estoque',20),('ecommerce','crm',30),
    ('ecommerce','financeiro',40),('ecommerce','automacao',50),
    ('ecommerce','fidelizacao',60),('ecommerce','bi',70)
)
INSERT INTO public.core_niche_modules (niche_id, module_slug, is_recommended, is_optional, sort_order)
SELECT n.id, s.module_slug, true, false, s.sort_order
FROM seed s
JOIN n ON n.slug = s.niche_slug
JOIN public.modules m ON m.slug = s.module_slug
ON CONFLICT (niche_id, module_slug) DO UPDATE
  SET sort_order = EXCLUDED.sort_order,
      is_recommended = true,
      updated_at = now();

-- 2) Function: apply_niche_template
CREATE OR REPLACE FUNCTION public.apply_niche_template(
  p_company_id uuid,
  p_niche_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_niche_id uuid;
  v_installed text[] := ARRAY[]::text[];
  v_count int := 0;
  v_caller uuid := auth.uid();
BEGIN
  -- Authorization: staff OR member of the company
  IF v_caller IS NULL
     OR NOT (
       public.is_impulsionando_staff(v_caller)
       OR public.user_belongs_to_company(v_caller, p_company_id)
     )
  THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_niche_id FROM public.niches WHERE slug = p_niche_slug;
  IF v_niche_id IS NULL THEN
    RAISE EXCEPTION 'niche_not_found: %', p_niche_slug USING ERRCODE = 'P0002';
  END IF;

  -- Set company's niche
  UPDATE public.companies SET niche_id = v_niche_id, updated_at = now()
   WHERE id = p_company_id;

  -- Install recommended modules
  WITH ins AS (
    INSERT INTO public.company_modules (
      company_id, module_id, is_enabled, installed_version, installed_at, enabled_at
    )
    SELECT p_company_id, m.id, true, m.current_version, now(), now()
      FROM public.core_niche_modules cnm
      JOIN public.modules m ON m.slug = cnm.module_slug AND m.is_active = true
     WHERE cnm.niche_id = v_niche_id
       AND cnm.is_recommended = true
    ON CONFLICT (company_id, module_id) DO UPDATE
      SET is_enabled = true,
          enabled_at = COALESCE(public.company_modules.enabled_at, now()),
          installed_version = EXCLUDED.installed_version
    RETURNING module_id
  )
  SELECT COUNT(*), COALESCE(array_agg(m.slug ORDER BY m.slug), ARRAY[]::text[])
    INTO v_count, v_installed
    FROM ins JOIN public.modules m ON m.id = ins.module_id;

  -- Audit
  INSERT INTO public.audit_logs (company_id, user_id, action, entity, entity_id, after)
  VALUES (
    p_company_id, v_caller, 'niche_template.applied', 'companies', p_company_id,
    jsonb_build_object('niche_slug', p_niche_slug, 'installed', v_installed, 'count', v_count)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'niche_slug', p_niche_slug,
    'company_id', p_company_id,
    'installed_count', v_count,
    'installed_slugs', v_installed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_niche_template(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_niche_template(uuid, text) TO authenticated, service_role;

-- 3) Read helper: list template (RLS already allows read on core_niche_modules)
CREATE OR REPLACE FUNCTION public.get_niche_template(p_niche_slug text)
RETURNS TABLE (module_slug text, module_name text, is_recommended boolean, is_optional boolean, sort_order int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cnm.module_slug, m.name, cnm.is_recommended, cnm.is_optional, cnm.sort_order
    FROM public.core_niche_modules cnm
    JOIN public.niches n ON n.id = cnm.niche_id
    JOIN public.modules m ON m.slug = cnm.module_slug
   WHERE n.slug = p_niche_slug
   ORDER BY cnm.sort_order, m.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_niche_template(text) TO authenticated, anon, service_role;
