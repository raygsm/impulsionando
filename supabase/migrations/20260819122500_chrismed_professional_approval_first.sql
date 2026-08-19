-- CHRISMED professional onboarding: approval-first state machine
-- Flow: registration -> pending_review -> approved -> onboarding/office+agenda -> active

CREATE OR REPLACE FUNCTION public.ensure_chrismed_professional_profile(p_registration jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_profession public.health_professions;
  v_profile_id uuid;
  v_name text;
  v_email text;
  v_council text;
  v_primary uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO v_profession
  FROM public.health_professions
  WHERE is_active
    AND (id::text=p_registration->>'professionId' OR slug=p_registration->>'professionSlug')
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'valid health profession required'; END IF;

  v_council := nullif(trim(p_registration->>'councilNumber'),'');
  IF v_profession.council_required AND v_council IS NULL THEN
    RAISE EXCEPTION 'professional council registration required';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'display_name',split_part(email,'@',1))
  INTO v_email,v_name
  FROM auth.users WHERE id=v_user_id;
  v_name := COALESCE(nullif(trim(p_registration->>'displayName'),''),v_name);

  INSERT INTO public.agenda_professionals(
    company_id,user_id,name,email,profession_id,council_number,council_region,
    primary_area,secondary_areas,public_slug,profile_status,is_active
  )
  VALUES(
    '642096b5-a9ff-4521-a82a-c004f6d2e2d2',v_user_id,v_name,v_email,v_profession.id,v_council,
    nullif(upper(trim(p_registration->>'councilRegion')),''),nullif(trim(p_registration->>'primaryArea'),''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_registration->'secondaryAreas','[]'))),
    v_profession.slug||'-'||substr(replace(v_user_id::text,'-',''),1,10),'pending_review',false
  )
  ON CONFLICT(company_id,user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    name=EXCLUDED.name,
    email=EXCLUDED.email,
    profession_id=EXCLUDED.profession_id,
    council_number=EXCLUDED.council_number,
    council_region=EXCLUDED.council_region,
    primary_area=EXCLUDED.primary_area,
    secondary_areas=EXCLUDED.secondary_areas,
    profile_status=CASE
      WHEN agenda_professionals.profile_status IN ('approved','active','suspended','rejected')
        THEN agenda_professionals.profile_status
      ELSE 'pending_review'
    END,
    is_active=CASE
      WHEN agenda_professionals.profile_status IN ('approved','active') THEN agenda_professionals.is_active
      ELSE false
    END,
    updated_at=now()
  RETURNING id INTO v_profile_id;

  v_primary := nullif(p_registration->>'primarySpecialtyId','')::uuid;
  DELETE FROM public.health_professional_specialties
  WHERE professional_id=v_profile_id
    AND specialty_id NOT IN (
      SELECT value::uuid
      FROM jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds','[]')) value
    );
  UPDATE public.health_professional_specialties
  SET is_primary=false
  WHERE professional_id=v_profile_id;
  INSERT INTO public.health_professional_specialties(professional_id,specialty_id,is_primary)
  SELECT v_profile_id,s.id,(s.id=v_primary)
  FROM public.health_specialties s
  WHERE s.profession_id=v_profession.id
    AND s.is_active
    AND s.id IN (
      SELECT value::uuid
      FROM jsonb_array_elements_text(COALESCE(p_registration->'specialtyIds','[]')) value
    )
  ON CONFLICT(professional_id,specialty_id)
  DO UPDATE SET is_primary=EXCLUDED.is_primary;

  RETURN v_profile_id;
END
$function$;

CREATE OR REPLACE FUNCTION public.complete_chrismed_professional_onboarding(p_config jsonb, p_schedules jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_profile public.agenda_professionals;
  v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;

  SELECT * INTO v_profile
  FROM public.agenda_professionals
  WHERE user_id=auth.uid()
    AND company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'professional profile not found'; END IF;
  IF v_profile.profile_status NOT IN ('approved','active') THEN
    RAISE EXCEPTION 'professional_approval_required';
  END IF;
  IF jsonb_typeof(p_schedules)<>'array' OR jsonb_array_length(p_schedules)=0 THEN
    RAISE EXCEPTION 'at least one schedule required';
  END IF;

  DELETE FROM public.agenda_schedules WHERE professional_id=v_profile.id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_schedules) LOOP
    INSERT INTO public.agenda_schedules(company_id,professional_id,weekday,start_time,end_time)
    VALUES(
      v_profile.company_id,v_profile.id,(v_item->>'weekday')::smallint,
      (v_item->>'startTime')::time,(v_item->>'endTime')::time
    );
  END LOOP;

  UPDATE public.agenda_professionals
  SET service_modes=ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(p_config->'serviceModes','["presencial"]'))
      ),
      agenda_config=p_config,
      profile_status='active',
      is_active=true,
      onboarding_completed_at=COALESCE(onboarding_completed_at,now()),
      updated_at=now()
  WHERE id=v_profile.id;

  RETURN v_profile.id;
END
$function$;

CREATE OR REPLACE FUNCTION public.guard_chrismed_professional_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE v_uid uuid:=auth.uid();
BEGIN
  IF new.company_id<>'642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid THEN RETURN new; END IF;
  IF new.profile_status IS DISTINCT FROM old.profile_status THEN
    IF public.is_chrismed_management(v_uid) THEN
      NULL;
    ELSIF old.user_id=v_uid AND new.profile_status IN ('draft','incomplete','pending_review') THEN
      NULL;
    ELSIF old.user_id=v_uid
      AND old.profile_status='approved'
      AND new.profile_status='active'
      AND new.onboarding_completed_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.agenda_schedules s
        WHERE s.professional_id=new.id AND s.is_active
      ) THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Somente a gestão CHRISMED pode aprovar, suspender, reativar ou rejeitar profissionais.';
    END IF;
  END IF;
  RETURN new;
END
$function$;

CREATE OR REPLACE FUNCTION public.chrismed_review_professional(
  p_professional_id uuid,
  p_approve boolean,
  p_rejection_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_prof public.agenda_professionals%rowtype;
  v_has_schedule boolean;
BEGIN
  IF NOT public.is_impulsionando_staff(auth.uid())
     AND NOT public.chrismed_is_clinical_admin('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO v_prof
  FROM public.agenda_professionals
  WHERE id=p_professional_id
    AND company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  FOR UPDATE;
  IF v_prof.id IS NULL THEN RAISE EXCEPTION 'professional_not_found'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.agenda_schedules s
    WHERE s.professional_id=v_prof.id AND s.is_active
  ) INTO v_has_schedule;

  IF p_approve THEN
    UPDATE public.agenda_professionals
    SET profile_status='approved',is_active=true,reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now()
    WHERE id=v_prof.id;

    UPDATE public.health_professional_specialties
    SET review_status='approved'
    WHERE professional_id=v_prof.id;

    INSERT INTO public.agenda_professional_eligibility(
      company_id,professional_id,profession_id,primary_area,priority,is_active
    )
    VALUES(v_prof.company_id,v_prof.id,v_prof.profession_id,v_prof.primary_area,100,true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,
      available_at,from_email,reply_to_email
    ) VALUES(
      v_prof.company_id,'PROFESSIONAL_APPROVED','email',v_prof.email,
      jsonb_build_object(
        'professional_id',v_prof.id,
        'professional_name',v_prof.name,
        'next_step','configure_office_and_agenda',
        'office_required',true,
        'agenda_url','https://chrismed.impulsionando.com.br/chrismed/profissional/onboarding',
        'finance_url','https://chrismed.impulsionando.com.br/chrismed/profissional/financeiro',
        'has_schedule',v_has_schedule,
        'invoice_required',true,
        'payout_policy',jsonb_build_object(
          'pix_days',7,
          'card_days',37,
          'invoice_due','primeiro dia util do mes seguinte ao periodo de referencia'
        )
      ),
      'chrismed-professional-approved:'||v_prof.id::text,
      'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br'
    )
    ON CONFLICT(idempotency_key) DO UPDATE
    SET payload=excluded.payload,
        available_at=least(public.chrismed_communication_outbox.available_at,excluded.available_at),
        updated_at=now();

    RETURN jsonb_build_object(
      'approved',true,
      'professional_id',v_prof.id,
      'public_profile',true,
      'schedule_configured',v_has_schedule,
      'next_step','configure_office_and_agenda',
      'agenda_url','https://chrismed.impulsionando.com.br/chrismed/profissional/onboarding',
      'finance_url','https://chrismed.impulsionando.com.br/chrismed/profissional/financeiro'
    );
  ELSE
    UPDATE public.agenda_professionals
    SET profile_status='rejected',is_active=false,reviewed_at=now(),reviewed_by=auth.uid(),
        preferences=coalesce(preferences,'{}'::jsonb)||jsonb_build_object(
          'rejection_reason',coalesce(p_rejection_reason,'Cadastro não aprovado pela gestão CHRISMED.')
        ),updated_at=now()
    WHERE id=v_prof.id;

    UPDATE public.health_professional_specialties
    SET review_status='rejected'
    WHERE professional_id=v_prof.id;
    UPDATE public.agenda_professional_eligibility
    SET is_active=false,updated_at=now()
    WHERE professional_id=v_prof.id;

    INSERT INTO public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,
      available_at,from_email,reply_to_email
    ) VALUES(
      v_prof.company_id,'PROFESSIONAL_REJECTED','email',v_prof.email,
      jsonb_build_object(
        'professional_id',v_prof.id,
        'professional_name',v_prof.name,
        'reason',coalesce(p_rejection_reason,'Cadastro não aprovado pela gestão CHRISMED.')
      ),
      'chrismed-professional-rejected:'||v_prof.id::text||':'||extract(epoch from now())::bigint,
      'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br'
    );
    RETURN jsonb_build_object('approved',false,'professional_id',v_prof.id);
  END IF;
END
$function$;
