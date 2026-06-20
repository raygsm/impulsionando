DROP POLICY IF EXISTS "fiscal_reports_staff_read" ON storage.objects;
CREATE POLICY "fiscal_reports_staff_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fiscal-reports' AND public.is_impulsionando_staff(auth.uid()));