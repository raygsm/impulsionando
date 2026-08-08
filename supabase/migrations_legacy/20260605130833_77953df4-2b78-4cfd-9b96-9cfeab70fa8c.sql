
-- 1) Permissões do prontuário
INSERT INTO public.permissions (code, module, description) VALUES
  ('ehr.record.read',       'ehr', 'Visualizar prontuários'),
  ('ehr.record.write',      'ehr', 'Criar/editar prontuários'),
  ('ehr.document.read',     'ehr', 'Visualizar exames e documentos do prontuário'),
  ('ehr.document.write',    'ehr', 'Anexar/editar exames e documentos do prontuário'),
  ('ehr.evolution.write',   'ehr', 'Registrar evolução clínica'),
  ('ehr.opinion.write',     'ehr', 'Registrar parecer médico'),
  ('ehr.opinion.confirm',   'ehr', 'Confirmar parecer eletronicamente')
ON CONFLICT (code) DO NOTHING;

-- 2) Prontuário do paciente (1 por customer)
CREATE TABLE public.ehr_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  responsible_user_id uuid,
  record_number text,
  status text NOT NULL DEFAULT 'active',
  chief_complaint text,
  medical_history text,
  family_history text,
  allergies text,
  current_medications text,
  surgeries text,
  previous_diagnoses text,
  alerts text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, customer_id)
);
CREATE INDEX idx_ehr_records_company ON public.ehr_records(company_id);
CREATE INDEX idx_ehr_records_customer ON public.ehr_records(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ehr_records TO authenticated;
GRANT ALL ON public.ehr_records TO service_role;
ALTER TABLE public.ehr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY ehr_records_select ON public.ehr_records FOR SELECT
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.record.read'));
CREATE POLICY ehr_records_insert ON public.ehr_records FOR INSERT
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'ehr.record.write'));
CREATE POLICY ehr_records_update ON public.ehr_records FOR UPDATE
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.record.write'));
CREATE POLICY ehr_records_delete ON public.ehr_records FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_ehr_records_updated_at BEFORE UPDATE ON public.ehr_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) Documentos / Exames anexados
CREATE TABLE public.ehr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_id uuid NOT NULL REFERENCES public.ehr_records(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
    -- exam_lab | exam_image | report | prescription | request | personal_doc | external | referral | term | other
  source text NOT NULL DEFAULT 'clinic',
    -- patient | clinic | doctor | other
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  occurred_at date,
  notes text,
  visible_to_patient boolean NOT NULL DEFAULT false,
  requires_review boolean NOT NULL DEFAULT true,
  review_status text NOT NULL DEFAULT 'pending',
    -- pending | reviewed | released
  ai_summary text,
  ai_status text NOT NULL DEFAULT 'not_generated',
    -- not_generated | generating | generated | awaiting_review | accepted | edited | rejected | confirmed
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ehr_documents_record ON public.ehr_documents(record_id);
CREATE INDEX idx_ehr_documents_company ON public.ehr_documents(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ehr_documents TO authenticated;
GRANT ALL ON public.ehr_documents TO service_role;
ALTER TABLE public.ehr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY ehr_documents_select ON public.ehr_documents FOR SELECT
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.document.read'));
CREATE POLICY ehr_documents_insert ON public.ehr_documents FOR INSERT
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'ehr.document.write'));
CREATE POLICY ehr_documents_update ON public.ehr_documents FOR UPDATE
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.document.write'));
CREATE POLICY ehr_documents_delete ON public.ehr_documents FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_ehr_documents_updated_at BEFORE UPDATE ON public.ehr_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) Evoluções clínicas
CREATE TABLE public.ehr_evolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_id uuid NOT NULL REFERENCES public.ehr_records(id) ON DELETE CASCADE,
  doctor_user_id uuid,
  doctor_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  chief_complaint text,
  clinical_history text,
  physical_exam text,
  hypothesis text,
  conduct text,
  exams_requested text,
  prescription text,
  follow_up text,
  notes text,
  signed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ehr_evolutions_record ON public.ehr_evolutions(record_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ehr_evolutions TO authenticated;
GRANT ALL ON public.ehr_evolutions TO service_role;
ALTER TABLE public.ehr_evolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ehr_evolutions_select ON public.ehr_evolutions FOR SELECT
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.record.read'));
CREATE POLICY ehr_evolutions_insert ON public.ehr_evolutions FOR INSERT
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'ehr.evolution.write'));
CREATE POLICY ehr_evolutions_update ON public.ehr_evolutions FOR UPDATE
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.evolution.write'));
CREATE POLICY ehr_evolutions_delete ON public.ehr_evolutions FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_ehr_evolutions_updated_at BEFORE UPDATE ON public.ehr_evolutions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5) Pareceres médicos
CREATE TABLE public.ehr_opinions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_id uuid NOT NULL REFERENCES public.ehr_records(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.ehr_documents(id) ON DELETE SET NULL,
  evolution_id uuid REFERENCES public.ehr_evolutions(id) ON DELETE SET NULL,
  doctor_user_id uuid,
  doctor_name text,
  summary text,
  interpretation text,
  conduct text,
  request_followup boolean NOT NULL DEFAULT false,
  request_new_exam boolean NOT NULL DEFAULT false,
  released_to_patient boolean NOT NULL DEFAULT false,
  internal_notes text,
  confirmed_at timestamptz,
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ehr_opinions_record ON public.ehr_opinions(record_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ehr_opinions TO authenticated;
GRANT ALL ON public.ehr_opinions TO service_role;
ALTER TABLE public.ehr_opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ehr_opinions_select ON public.ehr_opinions FOR SELECT
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.record.read'));
CREATE POLICY ehr_opinions_insert ON public.ehr_opinions FOR INSERT
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'ehr.opinion.write'));
CREATE POLICY ehr_opinions_update ON public.ehr_opinions FOR UPDATE
  USING (public.user_has_permission(auth.uid(), company_id, 'ehr.opinion.write'));
CREATE POLICY ehr_opinions_delete ON public.ehr_opinions FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_ehr_opinions_updated_at BEFORE UPDATE ON public.ehr_opinions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
