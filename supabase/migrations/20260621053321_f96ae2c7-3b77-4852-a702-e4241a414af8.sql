DROP POLICY IF EXISTS "empresas com modulo talentos leem candidatos visiveis" ON public.talentos_candidatos;

CREATE POLICY "empresas leem candidatos com vinculo"
ON public.talentos_candidatos
FOR SELECT
TO authenticated
USING (
  ativo = true
  AND visivel_rede = true
  AND (
    is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.talentos_matches m
      WHERE m.candidato_id = talentos_candidatos.id
        AND user_belongs_to_company(auth.uid(), m.company_id)
    )
  )
);