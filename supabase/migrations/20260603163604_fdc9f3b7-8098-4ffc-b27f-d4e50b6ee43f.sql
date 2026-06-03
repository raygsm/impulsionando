
-- 1. Permissions
INSERT INTO public.permissions (code, description, module) VALUES
  ('company.write',          'Editar dados da empresa',           'company'),
  ('company.settings.write', 'Editar configurações da empresa',   'company'),
  ('company.unit.write',     'Gerenciar unidades da empresa',     'company'),
  ('company.sector.write',   'Gerenciar setores da empresa',      'company')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profiles p
CROSS JOIN public.permissions perm
WHERE perm.code IN ('company.write','company.settings.write','company.unit.write','company.sector.write')
  AND p.slug IN ('admin-impulsionando','admin-unidade','gestor-empresa')
ON CONFLICT DO NOTHING;

-- 2. companies UPDATE
DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), id, 'company.write'))
  WITH CHECK (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), id, 'company.write'));

-- 3. company_settings WRITE
DROP POLICY IF EXISTS cs_write ON public.company_settings;
CREATE POLICY cs_write ON public.company_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'))
  WITH CHECK (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'));

-- 4. company_units WRITE
DROP POLICY IF EXISTS units_write ON public.company_units;
CREATE POLICY units_write ON public.company_units FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.unit.write'))
  WITH CHECK (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.unit.write'));

-- 5. sectors WRITE
DROP POLICY IF EXISTS sectors_write ON public.sectors;
CREATE POLICY sectors_write ON public.sectors FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.sector.write'))
  WITH CHECK (public.is_super_admin(auth.uid())
         OR public.user_has_permission(auth.uid(), company_id, 'company.sector.write'));
