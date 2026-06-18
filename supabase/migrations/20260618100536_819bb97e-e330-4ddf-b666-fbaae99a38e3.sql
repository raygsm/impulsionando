
-- contab_irpf_steps
DROP POLICY IF EXISTS irpf_s_select ON public.contab_irpf_steps;
CREATE POLICY irpf_s_select ON public.contab_irpf_steps
FOR SELECT TO authenticated
USING (
  journey_id IN (
    SELECT j.id FROM public.contab_irpf_journeys j
    WHERE user_belongs_to_company(auth.uid(), j.company_id)
      AND user_has_permission(auth.uid(), j.company_id, 'contab.irpf.read')
  )
);

-- storage: contracts bucket
DROP POLICY IF EXISTS contracts_company_read ON storage.objects;
CREATE POLICY contracts_company_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contracts'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT up.company_id FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND user_has_permission(auth.uid(), up.company_id, 'contracts.read')
  )
);

-- storage: contab-documents bucket
DROP POLICY IF EXISTS contab_docs_select ON storage.objects;
CREATE POLICY contab_docs_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contab-documents'
  AND (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), ((storage.foldername(name))[1])::uuid)
      AND user_has_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'contab.document.read')
    )
  )
);
