-- CHRISMED P0 operational core.
-- Intentionally self-contained: it does not import the legacy ecosystem schema.

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  is_master boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.companies (id, name, email, is_active, status)
VALUES ('642096b5-a9ff-4521-a82a-c004f6d2e2d2', 'CHRISMED', 'sac@chrismed.com.br', true, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, is_active = true;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','gestor','profissional','paciente','empresa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id)
);

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
  kind text NOT NULL DEFAULT 'specialty' CHECK (kind IN ('specialty','practice_area','subspecialty')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profession_id, name)
);

CREATE TABLE IF NOT EXISTS public.agenda_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  profession_id uuid REFERENCES public.health_professions(id),
  council_number text,
  council_region text,
  primary_area text,
  secondary_areas text[] NOT NULL DEFAULT '{}'::text[],
  languages text[] NOT NULL DEFAULT '{}'::text[],
  service_modes text[] NOT NULL DEFAULT ARRAY['presencial']::text[],
  curriculum jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  public_slug text,
  profile_status text NOT NULL DEFAULT 'draft'
    CHECK (profile_status IN ('draft','incomplete','pending_review','approved','active','suspended','rejected')),
  agenda_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agenda_professionals_company_user_unique
  ON public.agenda_professionals(company_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS agenda_professionals_public_slug_unique
  ON public.agenda_professionals(public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.health_professional_specialties (
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES public.health_specialties(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending_review','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (professional_id, specialty_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS health_professional_one_primary_specialty
  ON public.health_professional_specialties(professional_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS public.agenda_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agenda_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
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
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, council_acronym=EXCLUDED.council_acronym,
  council_required=EXCLUDED.council_required, sort_order=EXCLUDED.sort_order;

WITH seed(profession_slug, specialty_name, sort_order) AS (VALUES
  ('medico','Clínica Médica',10), ('medico','Cardiologia',20), ('medico','Dermatologia',30),
  ('medico','Gastroenterologia',40), ('medico','Ginecologia e Obstetrícia',50), ('medico','Hepatologia',60),
  ('medico','Medicina do Trabalho',70), ('medico','Pediatria',80),
  ('dentista','Clínica Geral',10), ('dentista','Ortodontia',20), ('dentista','Endodontia',30),
  ('dentista','Implantodontia',40), ('dentista','Odontopediatria',50),
  ('psicologo','Psicologia Clínica',10), ('psicologo','Neuropsicologia',20),
  ('psicologo','Psicologia Infantil',30), ('psicologo','Psicologia Organizacional',40),
  ('nutricionista','Nutrição Clínica',10), ('nutricionista','Nutrição Esportiva',20),
  ('nutricionista','Nutrição Materno-Infantil',30), ('nutricionista','Nutrição Comportamental',40),
  ('enfermeiro','Enfermagem Clínica',10), ('enfermeiro','Saúde da Família',20),
  ('enfermeiro','Urgência e Emergência',30), ('enfermeiro','Estomaterapia',40),
  ('fisioterapeuta','Fisioterapia Traumato-Ortopédica',10), ('fisioterapeuta','Fisioterapia Respiratória',20),
  ('fisioterapeuta','Fisioterapia Neurológica',30), ('fisioterapeuta','Fisioterapia Pélvica',40),
  ('fonoaudiologo','Linguagem',10), ('fonoaudiologo','Audiologia',20),
  ('fonoaudiologo','Motricidade Orofacial',30), ('fonoaudiologo','Voz',40)
)
INSERT INTO public.health_specialties (profession_id, name, sort_order)
SELECT p.id, seed.specialty_name, seed.sort_order
FROM seed JOIN public.health_professions p ON p.slug = seed.profession_slug
ON CONFLICT (profession_id, name) DO UPDATE SET sort_order=EXCLUDED.sort_order, is_active=true;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_specialty_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.health_professions, public.health_specialties TO anon, authenticated;
GRANT SELECT ON public.companies, public.user_roles, public.agenda_professionals,
  public.health_professional_specialties, public.agenda_schedules, public.agenda_blocks,
  public.health_specialty_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.health_professional_specialties,
  public.agenda_schedules, public.agenda_blocks TO authenticated;
GRANT ALL ON public.companies, public.user_roles, public.health_professions,
  public.health_specialties, public.agenda_professionals, public.health_professional_specialties,
  public.agenda_schedules, public.agenda_blocks, public.health_specialty_requests TO service_role;

-- Historical CHRISMED schemas may already contain some of these policies from
-- earlier migrations. Recreate the intended policy set deterministically so a
-- clean migration replay and an upgraded production schema converge safely.
DROP POLICY IF EXISTS companies_staff_read ON public.companies;
DROP POLICY IF EXISTS user_roles_self_read ON public.user_roles;
DROP POLICY IF EXISTS health_professions_public_read ON public.health_professions;
DROP POLICY IF EXISTS health_professions_staff_manage ON public.health_professions;
DROP POLICY IF EXISTS health_specialties_public_read ON public.health_specialties;
DROP POLICY IF EXISTS health_specialties_staff_manage ON public.health_specialties;
DROP POLICY IF EXISTS agenda_professionals_self_or_staff_read ON public.agenda_professionals;
DROP POLICY IF EXISTS agenda_professionals_self_or_staff_update ON public.agenda_professionals;
DROP POLICY IF EXISTS health_professional_specialties_self_or_staff ON public.health_professional_specialties;
DROP POLICY IF EXISTS agenda_schedules_self_or_staff ON public.agenda_schedules;
DROP POLICY IF EXISTS agenda_blocks_self_or_staff ON public.agenda_blocks;
DROP POLICY IF EXISTS health_specialty_requests_self_or_staff_read ON public.health_specialty_requests;
DROP POLICY IF EXISTS health_specialty_requests_self_insert ON public.health_specialty_requests;

CREATE POLICY companies_staff_read ON public.companies FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY user_roles_self_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_impulsionando_staff(auth.uid()));
CREATE POLICY health_professions_public_read ON public.health_professions FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY health_professions_staff_manage ON public.health_professions FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY health_specialties_public_read ON public.health_specialties FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY health_specialties_staff_manage ON public.health_specialties FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY agenda_professionals_self_or_staff_read ON public.agenda_professionals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_impulsionando_staff(auth.uid()));
CREATE POLICY agenda_professionals_self_or_staff_update ON public.agenda_professionals FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid AND (user_id = auth.uid() OR public.is_impulsionando_staff(auth.uid())));
CREATE POLICY health_professional_specialties_self_or_staff ON public.health_professional_specialties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))));
CREATE POLICY agenda_schedules_self_or_staff ON public.agenda_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))));
CREATE POLICY agenda_blocks_self_or_staff ON public.agenda_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))));
CREATE POLICY health_specialty_requests_self_or_staff_read ON public.health_specialty_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND (p.user_id=auth.uid() OR public.is_impulsionando_staff(auth.uid()))));
CREATE POLICY health_specialty_requests_self_insert ON public.health_specialty_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id=professional_id AND p.user_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.ensure_chrismed_professional_profile(p_registration jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  v_user_id uuid := auth.uid(); v_profession public.health_professions; v_profile_id uuid;
  v_name text; v_email text; v_council text; v_primary uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO v_profession FROM public.health_professions
   WHERE is_active AND (id::text=p_registration->>'professionId' OR slug=p_registration->>'professionSlug') LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'valid health profession required'; END IF;
  v_council := nullif(trim(p_registration->>'councilNumber'),'');
  IF v_profession.council_required AND v_council IS NULL THEN RAISE EXCEPTION 'professional council registration required'; END IF;
  SELECT email, COALESCE(raw_user_meta_data->>'display_name',split_part(email,'@',1)) INTO v_email,v_name FROM auth.users WHERE id=v_user_id;
  v_name := COALESCE(nullif(trim(p_registration->>'displayName'),''),v_name);
  INSERT INTO public.user_roles(user_id,role,company_id) VALUES(v_user_id,'profissional','642096b5-a9ff-4521-a82a-c004f6d2e2d2')
    ON CONFLICT(user_id,role,company_id) DO NOTHING;
  INSERT INTO public.agenda_professionals(company_id,user_id,name,email,profession_id,council_number,council_region,primary_area,secondary_areas,public_slug,profile_status)
  VALUES('642096b5-a9ff-4521-a82a-c004f6d2e2d2',v_user_id,v_name,v_email,v_profession.id,v_council,
    nullif(upper(trim(p_registration->>'councilRegion')),''),nullif(trim(p_registration->>'primaryArea'),''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_registration->'secondaryAreas','[]'))),
    v_profession.slug||'-'||substr(replace(v_user_id::text,'-',''),1,10),'incomplete')
  ON CONFLICT(company_id,user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    name=EXCLUDED.name,email=EXCLUDED.email,profession_id=EXCLUDED.profession_id,council_number=EXCLUDED.council_number,
    council_region=EXCLUDED.council_region,primary_area=EXCLUDED.primary_area,secondary_areas=EXCLUDED.secondary_areas,updated_at=now()
  RETURNING id INTO v_profile_id;
  v_primary := nullif(p_registration->>'primarySpecialtyId','')::uuid;
  DELETE FROM public.health_professional_specialties WHERE professional_id=v_profile_id
    AND specialty_id NOT IN (SELECT value::uuid FROM jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds','[]')) value);
  UPDATE public.health_professional_specialties SET is_primary=false WHERE professional_id=v_profile_id;
  INSERT INTO public.health_professional_specialties(professional_id,specialty_id,is_primary)
  SELECT v_profile_id,s.id,(s.id=v_primary) FROM public.health_specialties s
  WHERE s.profession_id=v_profession.id AND s.is_active
    AND s.id IN (SELECT value::uuid FROM jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds','[]')) value)
  ON CONFLICT(professional_id,specialty_id) DO UPDATE SET is_primary=EXCLUDED.is_primary;
  RETURN v_profile_id;
END $$;

CREATE OR REPLACE FUNCTION public.complete_chrismed_professional_onboarding(p_config jsonb,p_schedules jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_profile public.agenda_professionals; v_item jsonb;
BEGIN
  SELECT * INTO v_profile FROM public.agenda_professionals WHERE user_id=auth.uid()
    AND company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'professional profile not found'; END IF;
  IF jsonb_typeof(p_schedules)<>'array' OR jsonb_array_length(p_schedules)=0 THEN RAISE EXCEPTION 'at least one schedule required'; END IF;
  DELETE FROM public.agenda_schedules WHERE professional_id=v_profile.id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_schedules) LOOP
    INSERT INTO public.agenda_schedules(company_id,professional_id,weekday,start_time,end_time)
    VALUES(v_profile.company_id,v_profile.id,(v_item->>'weekday')::smallint,(v_item->>'startTime')::time,(v_item->>'endTime')::time);
  END LOOP;
  UPDATE public.agenda_professionals SET service_modes=ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_config->'serviceModes','["presencial"]'))),
    agenda_config=p_config,profile_status='pending_review',onboarding_completed_at=now(),updated_at=now() WHERE id=v_profile.id;
  RETURN v_profile.id;
END $$;

CREATE OR REPLACE FUNCTION public.bootstrap_chrismed_professional_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_registration jsonb;
BEGIN
  IF COALESCE((NEW.raw_user_meta_data->>'chrismed_professional_signup')::boolean,false) IS NOT TRUE THEN RETURN NEW; END IF;
  v_registration := jsonb_build_object('professionId',NEW.raw_user_meta_data->>'health_profession_id',
    'professionSlug',NEW.raw_user_meta_data->>'health_profession_slug','councilNumber',NEW.raw_user_meta_data->>'council_number',
    'councilRegion',NEW.raw_user_meta_data->>'council_region','primaryArea',NEW.raw_user_meta_data->>'primary_area',
    'primarySpecialtyId',NEW.raw_user_meta_data->>'primary_specialty_id','specialtyIds',COALESCE(NEW.raw_user_meta_data->'specialty_ids','[]'),
    'secondaryAreas',COALESCE(NEW.raw_user_meta_data->'secondary_areas','[]'),'displayName',NEW.raw_user_meta_data->>'display_name');
  PERFORM set_config('request.jwt.claim.sub',NEW.id::text,true);
  PERFORM public.ensure_chrismed_professional_profile(v_registration);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_chrismed_professional ON auth.users;
CREATE TRIGGER on_auth_user_chrismed_professional AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_chrismed_professional_signup();

REVOKE ALL ON FUNCTION public.ensure_chrismed_professional_profile(jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.complete_chrismed_professional_onboarding(jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bootstrap_chrismed_professional_signup() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_chrismed_professional_profile(jsonb) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.complete_chrismed_professional_onboarding(jsonb,jsonb) TO authenticated,service_role;