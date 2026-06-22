
CREATE POLICY "riomed_midia_rw"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'riomed-midia'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.core_tenant_identity ti ON ti.company_id = up.company_id
      WHERE up.user_id = auth.uid() AND ti.subdomain = 'riomed'
    )
  )
)
WITH CHECK (
  bucket_id = 'riomed-midia'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.core_tenant_identity ti ON ti.company_id = up.company_id
      WHERE up.user_id = auth.uid() AND ti.subdomain = 'riomed'
    )
  )
);
