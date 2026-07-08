GRANT SELECT ON public.chrismed_service_offerings TO anon;
CREATE POLICY "Public reads active offerings"
ON public.chrismed_service_offerings
FOR SELECT
TO anon
USING (active = true);