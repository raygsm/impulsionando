-- 1) mp_catalog_items
DROP POLICY IF EXISTS "mp_catalog public read active" ON public.mp_catalog_items;
CREATE POLICY "mp_catalog members read active"
ON public.mp_catalog_items
FOR SELECT
TO authenticated
USING (
  active = true
  AND (
    is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.mp_buyers b
      WHERE user_belongs_to_company(auth.uid(), b.company_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.mp_suppliers s
      WHERE user_belongs_to_company(auth.uid(), s.company_id)
    )
  )
);

-- 2) mp_suppliers
DROP POLICY IF EXISTS "mp_suppliers public read" ON public.mp_suppliers;
CREATE POLICY "mp_suppliers members read"
ON public.mp_suppliers
FOR SELECT
TO authenticated
USING (
  status = 'active'
  AND (
    is_impulsionando_staff(auth.uid())
    OR mp_user_in_company(auth.uid(), company_id)
    OR EXISTS (
      SELECT 1 FROM public.mp_buyers b
      WHERE user_belongs_to_company(auth.uid(), b.company_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.mp_suppliers s2
      WHERE user_belongs_to_company(auth.uid(), s2.company_id)
    )
  )
);

-- 3) notification_retention_audit
DROP POLICY IF EXISTS "authenticated read audit" ON public.notification_retention_audit;
CREATE POLICY "staff read audit"
ON public.notification_retention_audit
FOR SELECT
TO authenticated
USING (is_impulsionando_staff(auth.uid()));

-- 4) talentos_vagas
DROP POLICY IF EXISTS "vagas leitura ativas" ON public.talentos_vagas;
CREATE POLICY "vagas leitura ativas membros"
ON public.talentos_vagas
FOR SELECT
TO authenticated
USING (
  ativa = true
  AND (
    is_impulsionando_staff(auth.uid())
    OR user_belongs_to_company(auth.uid(), company_id)
    OR user_has_company_module(auth.uid(), 'talentos')
  )
);

-- 5) fiscal-reports bucket: bloqueio explícito de escrita por authenticated
CREATE POLICY "fiscal_reports_block_authenticated_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'fiscal-reports');

CREATE POLICY "fiscal_reports_block_authenticated_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id <> 'fiscal-reports')
WITH CHECK (bucket_id <> 'fiscal-reports');

CREATE POLICY "fiscal_reports_block_authenticated_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id <> 'fiscal-reports');