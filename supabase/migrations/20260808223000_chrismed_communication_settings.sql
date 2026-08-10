-- CHRISMED communication routing: tenant-editable, allowlisted public lookup.
CREATE TABLE IF NOT EXISTS public.setting_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text NOT NULL UNIQUE, label text NOT NULL,
  description text, category text NOT NULL DEFAULT 'geral',
  value_type text NOT NULL CHECK (value_type IN ('text','number','boolean','json')),
  default_value jsonb, is_company_editable boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL, value jsonb, value_type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'geral', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,key)
);
ALTER TABLE public.setting_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.setting_definitions TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.setting_definitions, public.company_settings TO service_role;
DROP POLICY IF EXISTS chrismed_setting_definitions_read ON public.setting_definitions;
CREATE POLICY chrismed_setting_definitions_read ON public.setting_definitions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS chrismed_company_settings_manage ON public.company_settings;
CREATE POLICY chrismed_company_settings_manage ON public.company_settings FOR ALL TO authenticated
USING (public.is_impulsionando_staff((SELECT auth.uid())) OR EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id=(SELECT auth.uid())
  AND r.company_id=company_settings.company_id AND r.role::text IN ('admin','gestor')))
WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())) OR EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id=(SELECT auth.uid())
  AND r.company_id=company_settings.company_id AND r.role::text IN ('admin','gestor')));

INSERT INTO public.setting_definitions
  (key, label, description, category, value_type, default_value, is_company_editable, sort_order)
VALUES
  ('comms.patient_email', 'E-mail de atendimento ao paciente',
   'Remetente e canal de resposta para mensagens enviadas a pacientes.',
   'comunicacao', 'text', '"sac@chrismed.com.br"'::jsonb, true, 8),
  ('comms.technical_support_email', 'E-mail de suporte técnico',
   'Canal para acesso, aplicativo, senha e demais questões técnicas.',
   'comunicacao', 'text', '"ti@chrismed.com.br"'::jsonb, true, 9)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  value_type = EXCLUDED.value_type,
  default_value = EXCLUDED.default_value,
  is_company_editable = EXCLUDED.is_company_editable,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.company_settings(company_id,key,value,value_type,category)
VALUES
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','comms.patient_email','"sac@chrismed.com.br"'::jsonb,'text','comunicacao'),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','comms.technical_support_email','"ti@chrismed.com.br"'::jsonb,'text','comunicacao'),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','comms.reply_to_email','"sac@chrismed.com.br"'::jsonb,'text','comunicacao')
ON CONFLICT (company_id,key) DO NOTHING;

ALTER TABLE public.chrismed_communication_outbox
  ADD COLUMN IF NOT EXISTS from_email text,
  ADD COLUMN IF NOT EXISTS reply_to_email text;

CREATE OR REPLACE FUNCTION public.get_chrismed_contact_emails()
RETURNS TABLE(patient_email text, technical_support_email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT value #>> '{}' FROM public.company_settings
      WHERE company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2' AND key='comms.patient_email'), 'sac@chrismed.com.br'),
    COALESCE((SELECT value #>> '{}' FROM public.company_settings
      WHERE company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2' AND key='comms.technical_support_email'), 'ti@chrismed.com.br');
$$;
REVOKE ALL ON FUNCTION public.get_chrismed_contact_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chrismed_contact_emails() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enqueue_chrismed_professional_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profession text;
  v_specialties text[];
  v_payload jsonb;
  v_patient_email text;
BEGIN
  IF NEW.company_id <> '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
     OR NEW.profile_status <> 'pending_review'
     OR (TG_OP = 'UPDATE' AND OLD.profile_status = 'pending_review') THEN RETURN NEW; END IF;

  SELECT name INTO v_profession FROM public.health_professions WHERE id = NEW.profession_id;
  SELECT COALESCE(array_agg(s.name ORDER BY ps.is_primary DESC, s.name), ARRAY[]::text[])
    INTO v_specialties FROM public.health_professional_specialties ps
    JOIN public.health_specialties s ON s.id = ps.specialty_id WHERE ps.professional_id = NEW.id;
  SELECT patient_email INTO v_patient_email FROM public.get_chrismed_contact_emails();

  v_payload := jsonb_build_object(
    'professional_id',NEW.id,'first_name',split_part(NEW.name,' ',1),'professional_name',NEW.name,
    'profession',v_profession,'specialties',v_specialties,'registration_council',NEW.council_number,
    'registration_region',NEW.council_region,'modalities',NEW.service_modes,'languages',NEW.languages,
    'status',NEW.profile_status,'registered_at',COALESCE(NEW.onboarding_completed_at,now()));

  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.chrismed_communication_outbox
      (company_id,event_code,channel,recipient,from_email,reply_to_email,payload,idempotency_key)
    VALUES (NEW.company_id,'professional_registration_received','email',NEW.email,v_patient_email,v_patient_email,
      v_payload,'professional:'||NEW.id||':registration-received:email')
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  INSERT INTO public.chrismed_communication_outbox
    (company_id,event_code,channel,recipient,from_email,reply_to_email,payload,idempotency_key)
  VALUES (NEW.company_id,'professional_registration_management','email',v_patient_email,v_patient_email,v_patient_email,
    v_payload,'professional:'||NEW.id||':registration-management:email')
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_chrismed_professional_registration() FROM PUBLIC, anon, authenticated;
