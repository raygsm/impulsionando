
-- 1) Vínculo paciente <-> auth.users
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS patient_user_id uuid,
  ADD COLUMN IF NOT EXISTS patient_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS patient_activated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS customers_patient_user_id_uidx
  ON public.customers(patient_user_id) WHERE patient_user_id IS NOT NULL;

-- 2) Flag de liberação em evoluções
ALTER TABLE public.ehr_evolutions
  ADD COLUMN IF NOT EXISTS released_to_patient boolean NOT NULL DEFAULT false;

-- 3) Função: usuário é paciente do prontuário?
CREATE OR REPLACE FUNCTION public.is_patient_of_record(_user uuid, _record uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ehr_records r
    JOIN public.customers c ON c.id = r.customer_id
    WHERE r.id = _record AND c.patient_user_id = _user
  );
$$;

-- 4) RLS adicionais — paciente pode ler conteúdo liberado
DROP POLICY IF EXISTS ehr_records_patient_select ON public.ehr_records;
CREATE POLICY ehr_records_patient_select ON public.ehr_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = ehr_records.customer_id AND c.patient_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ehr_documents_patient_select ON public.ehr_documents;
CREATE POLICY ehr_documents_patient_select ON public.ehr_documents
  FOR SELECT TO authenticated
  USING (
    visible_to_patient = true
    AND public.is_patient_of_record(auth.uid(), record_id)
  );

DROP POLICY IF EXISTS ehr_evolutions_patient_select ON public.ehr_evolutions;
CREATE POLICY ehr_evolutions_patient_select ON public.ehr_evolutions
  FOR SELECT TO authenticated
  USING (
    released_to_patient = true
    AND signed_at IS NOT NULL
    AND public.is_patient_of_record(auth.uid(), record_id)
  );

DROP POLICY IF EXISTS ehr_opinions_patient_select ON public.ehr_opinions;
CREATE POLICY ehr_opinions_patient_select ON public.ehr_opinions
  FOR SELECT TO authenticated
  USING (
    released_to_patient = true
    AND confirmed_at IS NOT NULL
    AND public.is_patient_of_record(auth.uid(), record_id)
  );

-- Permitir paciente ler seu próprio customers (apenas dados pessoais básicos via RLS de coluna não temos, mas seleção simples basta para nome)
DROP POLICY IF EXISTS customers_patient_self_select ON public.customers;
CREATE POLICY customers_patient_self_select ON public.customers
  FOR SELECT TO authenticated
  USING (patient_user_id = auth.uid());

-- 5) Storage — paciente lê documento liberado
DROP POLICY IF EXISTS ehr_obj_patient_select ON storage.objects;
CREATE POLICY ehr_obj_patient_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ehr-documents'
    AND EXISTS (
      SELECT 1 FROM public.ehr_documents d
      JOIN public.ehr_records r ON r.id = d.record_id
      JOIN public.customers c ON c.id = r.customer_id
      WHERE d.storage_path = storage.objects.name
        AND d.visible_to_patient = true
        AND c.patient_user_id = auth.uid()
    )
  );
