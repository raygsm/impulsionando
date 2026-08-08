
-- Talentos storage policies
CREATE POLICY "talentos own upload fotos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talentos-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos own update fotos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'talentos-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos read fotos auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'talentos-fotos');

CREATE POLICY "talentos own upload cv" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talentos-curriculos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos own update cv" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'talentos-curriculos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos read cv auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'talentos-curriculos');

CREATE POLICY "talentos own upload video" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talentos-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos own update video" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'talentos-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "talentos read video auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'talentos-videos');
