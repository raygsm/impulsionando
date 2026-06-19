DROP POLICY IF EXISTS "talentos read cv auth"     ON storage.objects;
DROP POLICY IF EXISTS "talentos read fotos auth"  ON storage.objects;
DROP POLICY IF EXISTS "talentos read video auth"  ON storage.objects;

CREATE POLICY "talentos read cv scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talentos-curriculos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.user_has_company_module(auth.uid(), 'talentos')
    OR public.is_impulsionando_staff(auth.uid())
  )
);

CREATE POLICY "talentos read fotos scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talentos-fotos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.user_has_company_module(auth.uid(), 'talentos')
    OR public.is_impulsionando_staff(auth.uid())
  )
);

CREATE POLICY "talentos read video scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talentos-videos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.user_has_company_module(auth.uid(), 'talentos')
    OR public.is_impulsionando_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "marocas_fotos_select_authenticated" ON storage.objects;
CREATE POLICY "marocas_fotos_select_scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'marocas-fotos'
  AND (
    owner = auth.uid()
    OR public.is_marocas_authorized(auth.uid())
    OR public.is_impulsionando_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "vagas dono" ON public.talentos_vagas;
CREATE POLICY "vagas dono empresa"
ON public.talentos_vagas FOR ALL TO authenticated
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
)
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
);

DROP POLICY IF EXISTS "matches dono empresa" ON public.talentos_matches;
CREATE POLICY "matches dono empresa membros"
ON public.talentos_matches FOR ALL TO authenticated
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
)
WITH CHECK (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_impulsionando_staff(auth.uid())
);