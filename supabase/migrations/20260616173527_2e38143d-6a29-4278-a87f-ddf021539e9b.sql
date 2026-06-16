
INSERT INTO public.permissions (module, code, description)
VALUES
  ('realestate', 'realestate.property.read', 'Ler imóveis cadastrados'),
  ('realestate', 'realestate.property.write', 'Criar/editar imóveis'),
  ('realestate', 'realestate.property.delete', 'Excluir imóveis'),
  ('realestate', 'realestate.intent.read', 'Ler intenções de busca'),
  ('realestate', 'realestate.intent.write', 'Criar/editar intenções de busca'),
  ('realestate', 'realestate.intent.delete', 'Excluir intenções de busca'),
  ('realestate', 'realestate.match.read', 'Ler matches imóvel x intenção'),
  ('realestate', 'realestate.match.write', 'Registrar matches imóvel x intenção')
ON CONFLICT (code) DO NOTHING;

-- realestate_properties
DROP POLICY IF EXISTS "realestate_props_read"   ON public.realestate_properties;
DROP POLICY IF EXISTS "realestate_props_write"  ON public.realestate_properties;
DROP POLICY IF EXISTS "realestate_props_update" ON public.realestate_properties;
DROP POLICY IF EXISTS "realestate_props_delete" ON public.realestate_properties;

CREATE POLICY "realestate_props_read" ON public.realestate_properties FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.read')));

CREATE POLICY "realestate_props_write" ON public.realestate_properties FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write')));

CREATE POLICY "realestate_props_update" ON public.realestate_properties FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write')))
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write')));

CREATE POLICY "realestate_props_delete" ON public.realestate_properties FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.delete')));

-- realestate_search_intents
DROP POLICY IF EXISTS "realestate_intents_read"   ON public.realestate_search_intents;
DROP POLICY IF EXISTS "realestate_intents_write"  ON public.realestate_search_intents;
DROP POLICY IF EXISTS "realestate_intents_update" ON public.realestate_search_intents;
DROP POLICY IF EXISTS "realestate_intents_delete" ON public.realestate_search_intents;

CREATE POLICY "realestate_intents_read" ON public.realestate_search_intents FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.intent.read')));

CREATE POLICY "realestate_intents_write" ON public.realestate_search_intents FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.intent.write')));

CREATE POLICY "realestate_intents_update" ON public.realestate_search_intents FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.intent.write')))
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.intent.write')));

CREATE POLICY "realestate_intents_delete" ON public.realestate_search_intents FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.intent.delete')));

-- realestate_property_matches
DROP POLICY IF EXISTS "realestate_matches_read"  ON public.realestate_property_matches;
DROP POLICY IF EXISTS "realestate_matches_write" ON public.realestate_property_matches;

CREATE POLICY "realestate_matches_read" ON public.realestate_property_matches FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.match.read')));

CREATE POLICY "realestate_matches_write" ON public.realestate_property_matches FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.match.write')));

-- billing_dunning_runs
DROP POLICY IF EXISTS "Read dunning runs" ON public.billing_dunning_runs;
CREATE POLICY "Read dunning runs" ON public.billing_dunning_runs FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.billing_invoices i
      WHERE i.id = invoice_id
        AND public.user_belongs_to_company(auth.uid(), i.company_id)
        AND public.user_has_permission(auth.uid(), i.company_id, 'billing.read')
    )
  );
