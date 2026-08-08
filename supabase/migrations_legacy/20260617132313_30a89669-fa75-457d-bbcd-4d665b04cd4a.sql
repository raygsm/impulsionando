
-- RLS no bucket contab-documents: pasta raiz = company_id
CREATE POLICY "contab_docs_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contab-documents' AND (
    is_super_admin(auth.uid())
    OR user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

CREATE POLICY "contab_docs_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contab-documents' AND (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), (storage.foldername(name))[1]::uuid, 'contab.document.write')
  )
);

CREATE POLICY "contab_docs_update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'contab-documents' AND (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), (storage.foldername(name))[1]::uuid, 'contab.document.write')
  )
);

CREATE POLICY "contab_docs_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'contab-documents' AND (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), (storage.foldername(name))[1]::uuid, 'contab.document.write')
  )
);
