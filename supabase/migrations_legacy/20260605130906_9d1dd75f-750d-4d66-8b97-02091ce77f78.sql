
CREATE POLICY ehr_obj_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ehr-documents'
  AND public.user_has_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'ehr.document.read')
);

CREATE POLICY ehr_obj_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ehr-documents'
  AND public.user_has_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'ehr.document.write')
);

CREATE POLICY ehr_obj_update ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'ehr-documents'
  AND public.user_has_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'ehr.document.write')
);

CREATE POLICY ehr_obj_delete ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ehr-documents'
  AND public.is_super_admin(auth.uid())
);
