-- Qualify appointment columns that collide with RETURNS TABLE output names.
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

  UPDATE public.chrismed_appointments AS a
     SET status='expired', updated_at=now()
   WHERE a.status IN ('held','pending_payment') AND a.hold_expires_at <= now();

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
