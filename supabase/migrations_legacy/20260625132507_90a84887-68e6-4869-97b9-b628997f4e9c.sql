-- Storage policies para bucket wmp-uploads (privado)
-- Anon pode INSERT (upload de portfolio/arquivos de briefing); leitura só admin via signed URL.
CREATE POLICY "wmp-uploads anon insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'wmp-uploads');

CREATE POLICY "wmp-uploads admin select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wmp-uploads' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "wmp-uploads admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wmp-uploads' AND public.has_role(auth.uid(), 'admin'::public.app_role));
