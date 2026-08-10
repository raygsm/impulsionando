-- CHRISMED production booking gate.
-- Payment is allowed only after a server-validated, concurrency-safe slot hold.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.chrismed_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE RESTRICT,
  offering_id uuid NOT NULL REFERENCES public.chrismed_service_offerings(id) ON DELETE RESTRICT,
  patient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name text NOT NULL CHECK (char_length(trim(patient_name)) BETWEEN 2 AND 160),
  patient_email text NOT NULL CHECK (patient_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  patient_phone text,
  patient_document_last4 text CHECK (patient_document_last4 IS NULL OR patient_document_last4 ~ '^[0-9]{4}$'),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held','pending_payment','confirmed','cancelled','expired','completed','no_show')),
  hold_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  hold_expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  payment_id uuid,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'chrismed_public_booking',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chrismed_appointment_company CHECK (company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid),
  CONSTRAINT chrismed_appointments_no_overlap EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('held','pending_payment','confirmed'))
);

CREATE INDEX IF NOT EXISTS chrismed_appointments_professional_time_idx
  ON public.chrismed_appointments(professional_id, starts_at);
CREATE INDEX IF NOT EXISTS chrismed_appointments_hold_expiry_idx
  ON public.chrismed_appointments(hold_expires_at)
  WHERE status IN ('held','pending_payment');
CREATE INDEX IF NOT EXISTS chrismed_appointments_patient_user_idx
  ON public.chrismed_appointments(patient_user_id) WHERE patient_user_id IS NOT NULL;

ALTER TABLE public.chrismed_appointments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chrismed_appointments FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.chrismed_appointments TO service_role;

CREATE POLICY chrismed_appointments_patient_read
  ON public.chrismed_appointments FOR SELECT TO authenticated
  USING (patient_user_id = (SELECT auth.uid()));

CREATE POLICY chrismed_appointments_professional_read
  ON public.chrismed_appointments FOR SELECT TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM public.agenda_professionals
      WHERE user_id = (SELECT auth.uid())
    )
    OR public.is_impulsionando_staff((SELECT auth.uid()))
  );

CREATE TABLE IF NOT EXISTS public.chrismed_communication_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  event_code text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','in_app')),
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','dead_letter')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chrismed_outbox_company CHECK (company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid)
);

CREATE INDEX IF NOT EXISTS chrismed_outbox_dispatch_idx
  ON public.chrismed_communication_outbox(status, available_at);
ALTER TABLE public.chrismed_communication_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chrismed_communication_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.chrismed_communication_outbox TO service_role;
CREATE POLICY chrismed_outbox_staff_read ON public.chrismed_communication_outbox
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.create_chrismed_booking_hold(p_request jsonb)
RETURNS TABLE(appointment_id uuid, hold_token uuid, hold_expires_at timestamptz, amount_cents integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_offering public.chrismed_service_offerings;
  v_professional public.agenda_professionals;
  v_starts timestamptz;
  v_ends timestamptz;
  v_name text := trim(COALESCE(p_request->>'patientName',''));
  v_email text := lower(trim(COALESCE(p_request->>'patientEmail','')));
  v_phone text := nullif(regexp_replace(COALESCE(p_request->>'patientPhone',''), '[^0-9+]', '', 'g'), '');
  v_doc text := regexp_replace(COALESCE(p_request->>'patientDocument',''), '[^0-9]', '', 'g');
  v_terms text := trim(COALESCE(p_request->>'termsVersion',''));
  v_privacy text := trim(COALESCE(p_request->>'privacyVersion',''));
BEGIN
  IF pg_column_size(p_request) > 16384 THEN RAISE EXCEPTION 'request too large'; END IF;
  IF char_length(v_name) NOT BETWEEN 2 AND 160 THEN RAISE EXCEPTION 'valid patient name required'; END IF;
  IF v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'valid patient email required'; END IF;
  IF v_terms = '' OR v_privacy = '' OR COALESCE((p_request->>'accepted')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'terms and privacy acceptance required';
  END IF;

  SELECT * INTO v_offering FROM public.chrismed_service_offerings
   WHERE id = (p_request->>'offeringId')::uuid AND company_id = v_company AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'active offering not found'; END IF;

  SELECT * INTO v_professional FROM public.agenda_professionals
   WHERE company_id = v_company
     AND (
       id = nullif(p_request->>'professionalId','')::uuid
       OR (nullif(p_request->>'professionalSlug','') IS NOT NULL AND public_slug = p_request->>'professionalSlug')
     )
     AND profile_status IN ('approved','active');
  IF NOT FOUND THEN RAISE EXCEPTION 'active professional not found'; END IF;

  v_starts := (p_request->>'startsAt')::timestamptz;
  v_ends := v_starts + make_interval(mins => v_offering.duration_minutes);
  IF v_starts < now() + interval '30 minutes' OR v_starts > now() + interval '120 days' THEN
    RAISE EXCEPTION 'appointment start outside allowed window';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.agenda_schedules s
    WHERE s.company_id = v_company AND s.professional_id = v_professional.id AND s.is_active
      AND s.weekday = EXTRACT(dow FROM v_starts AT TIME ZONE 'America/Sao_Paulo')::smallint
      AND (v_starts AT TIME ZONE 'America/Sao_Paulo')::time >= s.start_time
      AND (v_ends AT TIME ZONE 'America/Sao_Paulo')::time <= s.end_time
  ) THEN RAISE EXCEPTION 'slot is outside professional schedule'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.agenda_blocks b
    WHERE b.company_id = v_company AND b.professional_id = v_professional.id
      AND tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(v_starts,v_ends,'[)')
  ) THEN RAISE EXCEPTION 'slot is blocked'; END IF;

  UPDATE public.chrismed_appointments SET status='expired', updated_at=now()
   WHERE status IN ('held','pending_payment') AND hold_expires_at <= now();

  RETURN QUERY
  INSERT INTO public.chrismed_appointments(
    company_id,professional_id,offering_id,patient_user_id,patient_name,patient_email,
    patient_phone,patient_document_last4,starts_at,ends_at,terms_version,privacy_version,metadata
  ) VALUES (
    v_company,v_professional.id,v_offering.id,auth.uid(),v_name,v_email,v_phone,
    CASE WHEN char_length(v_doc)>=4 THEN right(v_doc,4) ELSE NULL END,
    v_starts,v_ends,v_terms,v_privacy,
    jsonb_build_object('requestId',nullif(p_request->>'requestId',''),'locale',COALESCE(p_request->>'locale','pt-BR'))
  )
  RETURNING chrismed_appointments.id, chrismed_appointments.hold_token,
    chrismed_appointments.hold_expires_at, v_offering.price_cents;
EXCEPTION
  WHEN exclusion_violation OR unique_violation THEN
    RAISE EXCEPTION 'slot is no longer available' USING ERRCODE='23P01';
END $$;

REVOKE ALL ON FUNCTION public.create_chrismed_booking_hold(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_chrismed_booking_hold(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_chrismed_booking_status(p_hold_token uuid)
RETURNS TABLE(status text, starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT a.status, a.starts_at, a.ends_at
  FROM public.chrismed_appointments a
  WHERE a.hold_token = p_hold_token
    AND (a.patient_user_id IS NULL OR a.patient_user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_chrismed_booking_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chrismed_booking_status(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.list_chrismed_available_slots(
  p_professional_slug text,
  p_offering_id uuid,
  p_from date DEFAULT CURRENT_DATE,
  p_days integer DEFAULT 42
)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH selected AS (
    SELECT p.id AS professional_id, o.duration_minutes
    FROM public.agenda_professionals p
    JOIN public.chrismed_service_offerings o ON o.company_id=p.company_id
    WHERE p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
      AND p.public_slug=p_professional_slug AND p.profile_status IN ('approved','active')
      AND o.id=p_offering_id AND o.active
  ), candidates AS (
    SELECT s.professional_id,
      (((p_from + d.day_offset) + s.start_time) AT TIME ZONE 'America/Sao_Paulo') AS window_start,
      (((p_from + d.day_offset) + s.end_time) AT TIME ZONE 'America/Sao_Paulo') AS window_end,
      selected.duration_minutes
    FROM selected
    JOIN public.agenda_schedules s ON s.professional_id=selected.professional_id
      AND s.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid AND s.is_active
    CROSS JOIN LATERAL generate_series(0, LEAST(GREATEST(p_days,1),60) - 1) d(day_offset)
    WHERE s.weekday=EXTRACT(dow FROM (p_from + d.day_offset))::smallint
  ), slots AS (
    SELECT c.professional_id, slot_start,
      slot_start + make_interval(mins=>c.duration_minutes) AS slot_end
    FROM candidates c
    CROSS JOIN LATERAL generate_series(
      c.window_start,
      c.window_end - make_interval(mins=>c.duration_minutes),
      make_interval(mins=>c.duration_minutes)
    ) slot_start
  )
  SELECT slot_start,slot_end FROM slots x
  WHERE slot_start >= now() + interval '30 minutes'
    AND NOT EXISTS (SELECT 1 FROM public.agenda_blocks b
      WHERE b.professional_id=x.professional_id
        AND tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(x.slot_start,x.slot_end,'[)'))
    AND NOT EXISTS (SELECT 1 FROM public.chrismed_appointments a
      WHERE a.professional_id=x.professional_id AND a.status IN ('held','pending_payment','confirmed')
        AND (a.status='confirmed' OR a.hold_expires_at>now())
        AND tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(x.slot_start,x.slot_end,'[)'))
  ORDER BY slot_start;
$$;
REVOKE ALL ON FUNCTION public.list_chrismed_available_slots(text,uuid,date,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_chrismed_available_slots(text,uuid,date,integer) TO anon,authenticated,service_role;

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
BEGIN
  IF NEW.company_id <> '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
     OR NEW.profile_status <> 'pending_review'
     OR (TG_OP = 'UPDATE' AND OLD.profile_status = 'pending_review') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_profession FROM public.health_professions WHERE id = NEW.profession_id;
  SELECT COALESCE(array_agg(s.name ORDER BY ps.is_primary DESC, s.name), ARRAY[]::text[])
    INTO v_specialties
  FROM public.health_professional_specialties ps
  JOIN public.health_specialties s ON s.id = ps.specialty_id
  WHERE ps.professional_id = NEW.id;

  v_payload := jsonb_build_object(
    'professional_id', NEW.id,
    'first_name', split_part(NEW.name, ' ', 1),
    'professional_name', NEW.name,
    'profession', v_profession,
    'specialties', v_specialties,
    'registration_council', NEW.council_number,
    'registration_region', NEW.council_region,
    'modalities', NEW.service_modes,
    'languages', NEW.languages,
    'status', NEW.profile_status,
    'registered_at', COALESCE(NEW.onboarding_completed_at, now())
  );

  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key
    ) VALUES (
      NEW.company_id,'professional_registration_received','email',NEW.email,v_payload,
      'professional:'||NEW.id||':registration-received:email'
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  INSERT INTO public.chrismed_communication_outbox(
    company_id,event_code,channel,recipient,payload,idempotency_key
  ) VALUES (
    NEW.company_id,'professional_registration_management','email','sac@chrismed.com.br',v_payload,
    'professional:'||NEW.id||':registration-management:email'
  ) ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_chrismed_professional_registration() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_chrismed_professional_registration_outbox ON public.agenda_professionals;
CREATE TRIGGER trg_chrismed_professional_registration_outbox
AFTER INSERT OR UPDATE OF profile_status ON public.agenda_professionals
FOR EACH ROW EXECUTE FUNCTION public.enqueue_chrismed_professional_registration();

CREATE OR REPLACE FUNCTION public.sync_chrismed_professional_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id <> '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.profile_status IN ('approved','active') THEN
    INSERT INTO public.user_roles(user_id,role,company_id)
    VALUES(NEW.user_id,'profissional',NEW.company_id)
    ON CONFLICT(user_id,role,company_id) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id=NEW.user_id AND role='profissional' AND company_id=NEW.company_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_chrismed_professional_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_chrismed_professional_role ON public.agenda_professionals;
CREATE TRIGGER trg_chrismed_professional_role
AFTER INSERT OR UPDATE OF profile_status ON public.agenda_professionals
FOR EACH ROW EXECUTE FUNCTION public.sync_chrismed_professional_role();

-- Repair any premature role created by the legacy signup bootstrap.
DELETE FROM public.user_roles r
USING public.agenda_professionals p
WHERE r.user_id=p.user_id AND r.company_id=p.company_id AND r.role='profissional'
  AND p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  AND p.profile_status NOT IN ('approved','active');

CREATE OR REPLACE FUNCTION public.capture_chrismed_professional_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF COALESCE((NEW.raw_user_meta_data->>'chrismed_professional_signup')::boolean,false)
     AND COALESCE((NEW.raw_user_meta_data->>'chrismed_terms_accepted')::boolean,false) THEN
    UPDATE public.agenda_professionals
    SET consents=jsonb_build_object(
      'termsAccepted',true,
      'termsVersion',NEW.raw_user_meta_data->>'chrismed_terms_version',
      'privacyAccepted',true,
      'privacyVersion',NEW.raw_user_meta_data->>'chrismed_privacy_version',
      'acceptedAt',now()
    ), updated_at=now()
    WHERE company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid AND user_id=NEW.id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_chrismed_professional_consent() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_auth_user_chrismed_consent ON auth.users;
CREATE TRIGGER zz_auth_user_chrismed_consent AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.capture_chrismed_professional_consent();
