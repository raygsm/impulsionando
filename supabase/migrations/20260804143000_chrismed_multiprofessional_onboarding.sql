-- CHRISMED: cadastro multiprofissional parametrizado e onboarding de agenda.

CREATE TABLE IF NOT EXISTS public.health_professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL,
  council_acronym text,
  council_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid NOT NULL REFERENCES public.health_professions(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.health_specialties(id) ON DELETE SET NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profession_id, name)
);

CREATE TABLE IF NOT EXISTS public.health_professional_specialties (
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES public.health_specialties(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (professional_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS public.health_specialty_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.health_professions(id),
  requested_name text NOT NULL CHECK (char_length(trim(requested_name)) BETWEEN 2 AND 160),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decision_token_hash text NOT NULL UNIQUE,
  decision_token_expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  decided_by_email text,
  resulting_specialty_id uuid REFERENCES public.health_specialties(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.health_professions (slug, name, council_acronym, council_required, sort_order) VALUES
  ('medico','Médico','CRM',true,10), ('dentista','Dentista','CRO',true,20),
  ('psicologo','Psicólogo','CRP',true,30), ('nutricionista','Nutricionista','CRN',true,40),
  ('enfermeiro','Enfermeiro','COREN',true,50), ('tecnico-enfermagem','Técnico de Enfermagem','COREN',true,60),
  ('fisioterapeuta','Fisioterapeuta','CREFITO',true,70), ('fonoaudiologo','Fonoaudiólogo','CREFONO',true,80),
  ('terapeuta-ocupacional','Terapeuta Ocupacional','CREFITO',true,90), ('farmaceutico','Farmacêutico','CRF',true,100),
  ('biomedico','Biomédico','CRBM',true,110), ('educador-fisico','Educador Físico','CREF',true,120),
  ('medico-veterinario','Médico Veterinário','CRMV',true,130), ('assistente-social','Assistente Social','CRESS',true,140),
  ('terapeuta','Terapeuta',NULL,false,150), ('acupunturista','Acupunturista',NULL,false,160),
  ('quiropraxista','Quiropraxista',NULL,false,170), ('osteopata','Osteopata',NULL,false,180),
  ('podologo','Podólogo',NULL,false,190)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  council_acronym = EXCLUDED.council_acronym,
  council_required = EXCLUDED.council_required,
  sort_order = EXCLUDED.sort_order;

WITH seed(profession_slug, specialty_name, sort_order) AS (VALUES
  ('medico','Clínica Médica',10), ('medico','Cardiologia',20), ('medico','Dermatologia',30), ('medico','Ginecologia',40), ('medico','Pediatria',50),
  ('psicologo','Psicologia Clínica',10), ('psicologo','Neuropsicologia',20), ('psicologo','Psicologia Infantil',30), ('psicologo','Psicologia Organizacional',40),
  ('fisioterapeuta','Fisioterapia Traumato-Ortopédica',10), ('fisioterapeuta','Fisioterapia Respiratória',20), ('fisioterapeuta','Fisioterapia Neurológica',30), ('fisioterapeuta','Fisioterapia Pélvica',40),
  ('nutricionista','Nutrição Clínica',10), ('nutricionista','Nutrição Esportiva',20), ('nutricionista','Nutrição Materno-Infantil',30), ('nutricionista','Nutrição Comportamental',40),
  ('enfermeiro','Enfermagem Clínica',10), ('enfermeiro','Saúde da Família',20), ('enfermeiro','Urgência e Emergência',30), ('enfermeiro','Estomaterapia',40),
  ('dentista','Clínica Geral',10), ('dentista','Ortodontia',20), ('dentista','Endodontia',30), ('dentista','Implantodontia',40), ('dentista','Odontopediatria',50),
  ('tecnico-enfermagem','Cuidados Gerais',10), ('tecnico-enfermagem','Centro Cirúrgico',20), ('tecnico-enfermagem','Urgência e Emergência',30),
  ('fonoaudiologo','Linguagem',10), ('fonoaudiologo','Audiologia',20), ('fonoaudiologo','Motricidade Orofacial',30), ('fonoaudiologo','Voz',40),
  ('terapeuta-ocupacional','Saúde Mental',10), ('terapeuta-ocupacional','Neurologia',20), ('terapeuta-ocupacional','Gerontologia',30), ('terapeuta-ocupacional','Saúde da Criança',40),
  ('farmaceutico','Farmácia Clínica',10), ('farmaceutico','Análises Clínicas',20), ('farmaceutico','Farmácia Hospitalar',30),
  ('biomedico','Análises Clínicas',10), ('biomedico','Biomedicina Estética',20), ('biomedico','Imagenologia',30),
  ('educador-fisico','Treinamento Funcional',10), ('educador-fisico','Reabilitação Física',20), ('educador-fisico','Atividade Física para Grupos Especiais',30),
  ('medico-veterinario','Clínica de Pequenos Animais',10), ('medico-veterinario','Cirurgia Veterinária',20), ('medico-veterinario','Dermatologia Veterinária',30),
  ('assistente-social','Saúde Coletiva',10), ('assistente-social','Saúde Mental',20), ('assistente-social','Atenção Hospitalar',30),
  ('terapeuta','Terapias Integrativas',10), ('terapeuta','Saúde Emocional',20),
  ('acupunturista','Acupuntura Sistêmica',10), ('acupunturista','Eletroacupuntura',20), ('acupunturista','Auriculoterapia',30),
  ('quiropraxista','Quiropraxia Clínica',10), ('quiropraxista','Quiropraxia Esportiva',20),
  ('osteopata','Osteopatia Estrutural',10), ('osteopata','Osteopatia Visceral',20), ('osteopata','Osteopatia Craniana',30),
  ('podologo','Podologia Clínica',10), ('podologo','Podologia Geriátrica',20), ('podologo','Podologia Esportiva',30)
)
INSERT INTO public.health_specialties (profession_id, name, sort_order)
SELECT p.id, seed.specialty_name, seed.sort_order
FROM seed JOIN public.health_professions p ON p.slug = seed.profession_slug
ON CONFLICT (profession_id, name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- Catálogo médico amplo para busca e multiseleção. Mantido no banco, nunca no componente.
WITH medical_specialties(name, sort_order) AS (VALUES
  ('Alergia e Imunologia',60), ('Anestesiologia',70), ('Angiologia',80),
  ('Cancerologia',90), ('Cardiologia',100), ('Cirurgia Cardiovascular',110),
  ('Cirurgia da Mão',120), ('Cirurgia de Cabeça e Pescoço',130),
  ('Cirurgia do Aparelho Digestivo',140), ('Cirurgia Geral',150),
  ('Cirurgia Oncológica',160), ('Cirurgia Pediátrica',170),
  ('Cirurgia Plástica',180), ('Cirurgia Torácica',190), ('Cirurgia Vascular',200),
  ('Clínica Médica',210), ('Coloproctologia',220), ('Dermatologia',230),
  ('Endocrinologia e Metabologia',240), ('Endoscopia',250),
  ('Gastroenterologia',260), ('Genética Médica',270), ('Geriatria',280),
  ('Ginecologia e Obstetrícia',290), ('Hematologia e Hemoterapia',300),
  ('Hepatologia',310), ('Homeopatia',320), ('Infectologia',330),
  ('Mastologia',340), ('Medicina de Emergência',350),
  ('Medicina de Família e Comunidade',360), ('Medicina do Trabalho',370),
  ('Medicina do Tráfego',380), ('Medicina Esportiva',390),
  ('Medicina Física e Reabilitação',400), ('Medicina Intensiva',410),
  ('Medicina Legal e Perícia Médica',420), ('Medicina Nuclear',430),
  ('Medicina Preventiva e Social',440), ('Nefrologia',450),
  ('Neurocirurgia',460), ('Neurologia',470), ('Nutrologia',480),
  ('Oftalmologia',490), ('Oncologia Clínica',500),
  ('Ortopedia e Traumatologia',510), ('Otorrinolaringologia',520),
  ('Patologia',530), ('Patologia Clínica/Medicina Laboratorial',540),
  ('Pediatria',550), ('Pneumologia',560), ('Psiquiatria',570),
  ('Radiologia e Diagnóstico por Imagem',580), ('Radioterapia',590),
  ('Reumatologia',600), ('Urologia',610)
)
INSERT INTO public.health_specialties(profession_id, name, sort_order)
SELECT p.id, m.name, m.sort_order
FROM medical_specialties m
JOIN public.health_professions p ON p.slug = 'medico'
ON CONFLICT (profession_id, name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

ALTER TABLE public.agenda_professionals
  ADD COLUMN IF NOT EXISTS profession_id uuid REFERENCES public.health_professions(id),
  ADD COLUMN IF NOT EXISTS council_number text,
  ADD COLUMN IF NOT EXISTS council_region text,
  ADD COLUMN IF NOT EXISTS primary_area text,
  ADD COLUMN IF NOT EXISTS secondary_areas text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS service_modes text[] NOT NULL DEFAULT ARRAY['presencial']::text[],
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS agenda_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS agenda_professionals_company_user_unique
  ON public.agenda_professionals(company_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS agenda_professionals_public_slug_unique
  ON public.agenda_professionals(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS health_specialties_profession_idx
  ON public.health_specialties(profession_id, sort_order) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS health_professional_one_primary_specialty
  ON public.health_professional_specialties(professional_id) WHERE is_primary;

ALTER TABLE public.health_professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_specialty_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.health_professions, public.health_specialties TO anon, authenticated;
GRANT ALL ON public.health_professions, public.health_specialties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_professional_specialties TO authenticated;
GRANT SELECT, INSERT ON public.health_specialty_requests TO authenticated;
GRANT ALL ON public.health_professional_specialties, public.health_specialty_requests TO service_role;

DROP POLICY IF EXISTS health_professions_public_read ON public.health_professions;
CREATE POLICY health_professions_public_read ON public.health_professions FOR SELECT TO anon, authenticated USING (is_active);
DROP POLICY IF EXISTS health_professions_staff_manage ON public.health_professions;
CREATE POLICY health_professions_staff_manage ON public.health_professions FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
DROP POLICY IF EXISTS health_specialties_public_read ON public.health_specialties;
CREATE POLICY health_specialties_public_read ON public.health_specialties FOR SELECT TO anon, authenticated USING (is_active);
DROP POLICY IF EXISTS health_specialties_staff_manage ON public.health_specialties;
CREATE POLICY health_specialties_staff_manage ON public.health_specialties FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
DROP POLICY IF EXISTS health_professional_specialties_self ON public.health_professional_specialties;
CREATE POLICY health_professional_specialties_self ON public.health_professional_specialties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS health_specialty_requests_self_read ON public.health_specialty_requests;
CREATE POLICY health_specialty_requests_self_read ON public.health_specialty_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS health_specialty_requests_self_insert ON public.health_specialty_requests;
CREATE POLICY health_specialty_requests_self_insert ON public.health_specialty_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS health_specialty_requests_staff_read ON public.health_specialty_requests;
CREATE POLICY health_specialty_requests_staff_read ON public.health_specialty_requests FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- O profissional só gerencia o próprio perfil e a própria agenda.
DROP POLICY IF EXISTS ap_self_select ON public.agenda_professionals;
CREATE POLICY ap_self_select ON public.agenda_professionals FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS ap_self_update ON public.agenda_professionals;
CREATE POLICY ap_self_update ON public.agenda_professionals FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid);
DROP POLICY IF EXISTS asch_self_manage ON public.agenda_schedules;
CREATE POLICY asch_self_manage ON public.agenda_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = agenda_schedules.professional_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = agenda_schedules.professional_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS ab_self_manage ON public.agenda_blocks;
CREATE POLICY ab_self_manage ON public.agenda_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = agenda_blocks.professional_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = agenda_blocks.professional_id AND p.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.ensure_chrismed_professional_profile(p_registration jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profession public.health_professions;
  v_profile_id uuid;
  v_name text;
  v_email text;
  v_council text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO v_profession FROM public.health_professions
   WHERE is_active AND (id::text = p_registration->>'professionId' OR slug = p_registration->>'professionSlug') LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'valid health profession required'; END IF;
  v_council := nullif(trim(p_registration->>'councilNumber'), '');
  IF v_profession.council_required AND v_council IS NULL THEN RAISE EXCEPTION 'professional council registration required'; END IF;
  SELECT email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)) INTO v_email, v_name FROM auth.users WHERE id = v_user_id;
  v_name := COALESCE(nullif(trim(p_registration->>'displayName'), ''), v_name);

  INSERT INTO public.user_roles(user_id, role, company_id)
  VALUES (v_user_id, 'profissional', '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid)
  ON CONFLICT (user_id, role, company_id) DO NOTHING;

  INSERT INTO public.agenda_professionals(
    company_id, user_id, name, email, profession_id, council_number, council_region,
    primary_area, secondary_areas, public_slug, profile_status
  ) VALUES (
    '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, v_user_id, v_name, v_email, v_profession.id,
    v_council, nullif(upper(trim(p_registration->>'councilRegion')), ''), nullif(trim(p_registration->>'primaryArea'), ''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_registration->'secondaryAreas', '[]'::jsonb))),
    v_profession.slug || '-' || substr(replace(v_user_id::text, '-', ''), 1, 10), 'onboarding'
  )
  ON CONFLICT (company_id, user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    profession_id = EXCLUDED.profession_id,
    council_number = COALESCE(EXCLUDED.council_number, agenda_professionals.council_number),
    council_region = COALESCE(EXCLUDED.council_region, agenda_professionals.council_region),
    primary_area = COALESCE(EXCLUDED.primary_area, agenda_professionals.primary_area),
    secondary_areas = CASE WHEN cardinality(EXCLUDED.secondary_areas) > 0 THEN EXCLUDED.secondary_areas ELSE agenda_professionals.secondary_areas END
  RETURNING id INTO v_profile_id;
  DELETE FROM public.health_professional_specialties
   WHERE professional_id = v_profile_id
     AND specialty_id NOT IN (
       SELECT s.id
       FROM public.health_specialties s
       WHERE s.profession_id = v_profession.id
         AND s.is_active
         AND s.id::text IN (
           SELECT jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds', '[]'::jsonb))
         )
     );
  UPDATE public.health_professional_specialties
     SET is_primary = false
   WHERE professional_id = v_profile_id;
  INSERT INTO public.health_professional_specialties(professional_id, specialty_id, is_primary)
  SELECT v_profile_id, s.id, (s.id::text = p_registration->>'primarySpecialtyId')
  FROM public.health_specialties s
  WHERE s.profession_id = v_profession.id
    AND s.is_active
    AND s.id::text IN (SELECT jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds', '[]'::jsonb)))
  ON CONFLICT (professional_id, specialty_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;
  RETURN v_profile_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_chrismed_professional_profile(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_chrismed_professional_profile(jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_chrismed_professional_onboarding(p_config jsonb, p_schedules jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.agenda_professionals;
  v_item jsonb;
BEGIN
  SELECT * INTO v_profile FROM public.agenda_professionals
   WHERE user_id = auth.uid() AND company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'professional profile not found'; END IF;
  IF jsonb_typeof(p_schedules) <> 'array' OR jsonb_array_length(p_schedules) = 0 THEN RAISE EXCEPTION 'at least one schedule required'; END IF;

  DELETE FROM public.agenda_schedules WHERE professional_id = v_profile.id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_schedules) LOOP
    INSERT INTO public.agenda_schedules(company_id, professional_id, weekday, start_time, end_time, is_active)
    VALUES (v_profile.company_id, v_profile.id, (v_item->>'weekday')::smallint, (v_item->>'startTime')::time, (v_item->>'endTime')::time, true);
  END LOOP;

  UPDATE public.agenda_professionals SET
    service_modes = ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_config->'serviceModes', '["presencial"]'::jsonb))),
    agenda_config = p_config,
    profile_status = 'ready',
    onboarding_completed_at = now(),
    updated_at = now()
  WHERE id = v_profile.id;
  RETURN v_profile.id;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_chrismed_professional_onboarding(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_chrismed_professional_onboarding(jsonb, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.bootstrap_chrismed_professional_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profession public.health_professions;
  v_council text;
BEGIN
  IF COALESCE((NEW.raw_user_meta_data->>'chrismed_professional_signup')::boolean, false) IS NOT TRUE THEN RETURN NEW; END IF;
  SELECT * INTO v_profession FROM public.health_professions
   WHERE is_active AND (id::text = NEW.raw_user_meta_data->>'health_profession_id' OR slug = NEW.raw_user_meta_data->>'health_profession_slug') LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_council := nullif(trim(NEW.raw_user_meta_data->>'council_number'), '');
  IF v_profession.council_required AND v_council IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.user_roles(user_id, role, company_id)
  VALUES (NEW.id, 'profissional', '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid)
  ON CONFLICT (user_id, role, company_id) DO NOTHING;
  INSERT INTO public.agenda_professionals(company_id, user_id, name, email, profession_id, council_number, council_region, primary_area, secondary_areas, public_slug, profile_status)
  VALUES ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email,
    v_profession.id, v_council, nullif(upper(trim(NEW.raw_user_meta_data->>'council_region')), ''), nullif(trim(NEW.raw_user_meta_data->>'primary_area'), ''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'secondary_areas', '[]'::jsonb))),
    v_profession.slug || '-' || substr(replace(NEW.id::text, '-', ''), 1, 10), 'onboarding')
  ON CONFLICT (company_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
  INSERT INTO public.health_professional_specialties(professional_id, specialty_id, is_primary)
  SELECT ap.id, s.id, (s.id::text = NEW.raw_user_meta_data->>'primary_specialty_id')
  FROM public.agenda_professionals ap
  JOIN public.health_specialties s ON s.profession_id = v_profession.id
  WHERE ap.company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
    AND ap.user_id = NEW.id AND s.is_active
    AND s.id::text IN (SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'specialty_ids', '[]'::jsonb)))
  ON CONFLICT (professional_id, specialty_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_chrismed_professional ON auth.users;
CREATE TRIGGER on_auth_user_chrismed_professional
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.bootstrap_chrismed_professional_signup();
