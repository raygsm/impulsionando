
-- RLS policies for marocas-fotos bucket (private)
-- Files are organized as: services/{service_id}/{before|after}/{filename}

CREATE POLICY "marocas_fotos_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'marocas-fotos');

CREATE POLICY "marocas_fotos_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marocas-fotos' AND owner = auth.uid());

CREATE POLICY "marocas_fotos_update_owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'marocas-fotos' AND owner = auth.uid());

CREATE POLICY "marocas_fotos_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marocas-fotos' AND owner = auth.uid());
