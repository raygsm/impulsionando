CREATE POLICY "Staff Impulsionando lê uploads de projetos IA"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-project-uploads' AND public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando envia uploads de projetos IA"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-project-uploads' AND public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando remove uploads de projetos IA"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-project-uploads' AND public.is_impulsionando_staff(auth.uid()));