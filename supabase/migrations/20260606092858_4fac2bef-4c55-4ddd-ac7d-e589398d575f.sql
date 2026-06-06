
-- Tighten is_patient_of_record to also enforce company scope
CREATE OR REPLACE FUNCTION public.is_patient_of_record(_user uuid, _record uuid, _company uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.ehr_records r
    JOIN public.customers c ON c.id = r.customer_id
    WHERE r.id = _record
      AND c.patient_user_id = _user
      AND c.company_id = r.company_id
      AND (_company IS NULL OR r.company_id = _company)
  );
$function$;

-- ehr_evolutions patient policy
DROP POLICY IF EXISTS ehr_evolutions_patient_select ON public.ehr_evolutions;
CREATE POLICY ehr_evolutions_patient_select ON public.ehr_evolutions
FOR SELECT TO authenticated
USING (public.is_patient_of_record(auth.uid(), record_id, company_id));

-- ehr_opinions patient policy
DROP POLICY IF EXISTS ehr_opinions_patient_select ON public.ehr_opinions;
CREATE POLICY ehr_opinions_patient_select ON public.ehr_opinions
FOR SELECT TO authenticated
USING (public.is_patient_of_record(auth.uid(), record_id, company_id));

-- ehr_records patient policy: require customer.company_id = ehr_records.company_id
DROP POLICY IF EXISTS ehr_records_patient_select ON public.ehr_records;
CREATE POLICY ehr_records_patient_select ON public.ehr_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = ehr_records.customer_id
      AND c.patient_user_id = auth.uid()
      AND c.company_id = ehr_records.company_id
  )
);
