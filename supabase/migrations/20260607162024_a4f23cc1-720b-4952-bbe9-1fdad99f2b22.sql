
CREATE OR REPLACE FUNCTION public.core_user_belongs_to_company(_uid uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = _uid
      AND up.company_id = _company_id
      AND up.is_active = true
  );
$$;

DROP POLICY IF EXISTS ehr_documents_patient_select ON public.ehr_documents;

CREATE POLICY ehr_documents_patient_select
ON public.ehr_documents
FOR SELECT
TO authenticated
USING (
  public.is_patient_of_record(auth.uid(), record_id, company_id)
);
