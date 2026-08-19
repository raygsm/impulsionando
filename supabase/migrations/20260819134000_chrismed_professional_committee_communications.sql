-- CHRISMED: canonical professional registration communications and approval-first activation.

CREATE OR REPLACE FUNCTION public.enqueue_chrismed_professional_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profession text;
  v_specialties text[];
  v_payload jsonb;
  v_patient_email text;
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

  SELECT patient_email INTO v_patient_email FROM public.get_chrismed_contact_emails();

  v_payload := jsonb_build_object(
    'professional_id',NEW.id,
    'recipient_name',NEW.name,
    'first_name',split_part(NEW.name,' ',1),
    'professional_name',NEW.name,
    'profession',v_profession,
    'specialties',v_specialties,
    'registration_council',NEW.council_number,
    'registration_region',NEW.council_region,
    'modalities',NEW.service_modes,
    'languages',NEW.languages,
    'status',NEW.profile_status,
    'registered_at',COALESCE(NEW.onboarding_completed_at,now()),
    'access_url','https://chrismed.impulsionando.com.br/chrismed/profissional/cadastro',
    'management_url','https://chrismed.impulsionando.com.br/chrismed/time'
  );

  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.chrismed_communication_outbox
      (company_id,event_code,channel,recipient,from_email,reply_to_email,payload,idempotency_key)
    VALUES (
      NEW.company_id,'professional.registration.received','email',NEW.email,
      v_patient_email,v_patient_email,v_payload,
      'professional:'||NEW.id||':registration-received:email'
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  INSERT INTO public.chrismed_communication_outbox
    (company_id,event_code,channel,recipient,from_email,reply_to_email,payload,idempotency_key)
  VALUES (
    NEW.company_id,'professional.registration.management','email',v_patient_email,
    v_patient_email,v_patient_email,v_payload,
    'professional:'||NEW.id||':registration-management:email'
  ) ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
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

  UPDATE public.agenda_professional_eligibility
  SET is_active=true,updated_at=now()
  WHERE professional_id=v_profile.id;

  RETURN v_profile.id;
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
    SET profile_status='approved',is_active=false,reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now()
    WHERE id=v_prof.id;

    UPDATE public.health_professional_specialties
    SET review_status='approved'
    WHERE professional_id=v_prof.id;

    INSERT INTO public.agenda_professional_eligibility(
      company_id,professional_id,profession_id,primary_area,priority,is_active
    )
    VALUES(v_prof.company_id,v_prof.id,v_prof.profession_id,v_prof.primary_area,100,false)
    ON CONFLICT DO NOTHING;
    UPDATE public.agenda_professional_eligibility
    SET is_active=false,updated_at=now()
    WHERE professional_id=v_prof.id;

    INSERT INTO public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,
      available_at,from_email,reply_to_email
    ) VALUES(
      v_prof.company_id,'professional.registration.approved','email',v_prof.email,
      jsonb_build_object(
        'recipient_name',v_prof.name,
        'professional_id',v_prof.id,
        'professional_name',v_prof.name,
        'access_url','https://chrismed.impulsionando.com.br/chrismed/profissional/onboarding',
        'agenda_url','https://chrismed.impulsionando.com.br/chrismed/profissional/onboarding',
        'finance_url','https://chrismed.impulsionando.com.br/chrismed/profissional/financeiro',
        'payout_countdown_url','https://chrismed.impulsionando.com.br/chrismed/profissional/repasses',
        'next_step','configure_office_and_agenda',
        'office_required',true,
        'has_schedule',v_has_schedule,
        'invoice_required',true,
        'payout_policy',jsonb_build_object(
          'pix_days',7,'card_days',37,
          'invoice_due','primeiro dia util do mes seguinte ao periodo de referencia'
        )
      ),
      'chrismed-professional-approved:'||v_prof.id::text,
      'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br'
    )
    ON CONFLICT(idempotency_key) DO UPDATE
    SET event_code=excluded.event_code,
        payload=excluded.payload,
        available_at=least(public.chrismed_communication_outbox.available_at,excluded.available_at),
        updated_at=now();

    RETURN jsonb_build_object(
      'approved',true,'professional_id',v_prof.id,'public_profile',false,
      'schedule_configured',v_has_schedule,'next_step','configure_office_and_agenda',
      'agenda_url','https://chrismed.impulsionando.com.br/chrismed/profissional/onboarding',
      'finance_url','https://chrismed.impulsionando.com.br/chrismed/profissional/financeiro',
      'payout_countdown_url','https://chrismed.impulsionando.com.br/chrismed/profissional/repasses'
    );
  ELSE
    UPDATE public.agenda_professionals
    SET profile_status='rejected',is_active=false,reviewed_at=now(),reviewed_by=auth.uid(),
        preferences=coalesce(preferences,'{}'::jsonb)||jsonb_build_object(
          'rejection_reason',coalesce(p_rejection_reason,'Cadastro não aprovado pela gestão CHRISMED.')
        ),updated_at=now()
    WHERE id=v_prof.id;
    UPDATE public.health_professional_specialties SET review_status='rejected' WHERE professional_id=v_prof.id;
    UPDATE public.agenda_professional_eligibility SET is_active=false,updated_at=now() WHERE professional_id=v_prof.id;

    INSERT INTO public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,
      available_at,from_email,reply_to_email
    ) VALUES(
      v_prof.company_id,'professional.registration.rejected','email',v_prof.email,
      jsonb_build_object(
        'recipient_name',v_prof.name,
        'professional_id',v_prof.id,
        'professional_name',v_prof.name,
        'reason',coalesce(p_rejection_reason,'Cadastro não aprovado pela gestão CHRISMED.'),
        'support_url','mailto:sac@chrismed.com.br'
      ),
      'chrismed-professional-rejected:'||v_prof.id::text||':'||extract(epoch from now())::bigint,
      'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br'
    );
    RETURN jsonb_build_object('approved',false,'professional_id',v_prof.id);
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.chrismed_set_professional_status(p_professional_id uuid, p_action text)
RETURNS TABLE(id uuid, profile_status text, is_active boolean, reviewed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_uid uuid:=auth.uid();
  v_action text:=lower(trim(p_action));
  v_result jsonb;
BEGIN
  IF NOT public.is_chrismed_management(v_uid) THEN
    RAISE EXCEPTION 'Acesso restrito à gestão CHRISMED.';
  END IF;

  IF v_action='approve' THEN
    v_result:=public.chrismed_review_professional(p_professional_id,true,NULL);
  ELSIF v_action='reject' THEN
    v_result:=public.chrismed_review_professional(p_professional_id,false,'Cadastro não aprovado pelo Comitê CHRISMED.');
  ELSIF v_action='suspend' THEN
    UPDATE public.agenda_professionals p
    SET profile_status='suspended',is_active=false,reviewed_at=now(),reviewed_by=v_uid,updated_at=now()
    WHERE p.id=p_professional_id AND p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
    UPDATE public.agenda_professional_eligibility SET is_active=false,updated_at=now() WHERE professional_id=p_professional_id;
  ELSIF v_action='reactivate' THEN
    UPDATE public.agenda_professionals p
    SET profile_status=CASE
          WHEN p.onboarding_completed_at IS NOT NULL
           AND EXISTS(SELECT 1 FROM public.agenda_schedules s WHERE s.professional_id=p.id AND s.is_active)
          THEN 'active' ELSE 'approved' END,
        is_active=CASE
          WHEN p.onboarding_completed_at IS NOT NULL
           AND EXISTS(SELECT 1 FROM public.agenda_schedules s WHERE s.professional_id=p.id AND s.is_active)
          THEN true ELSE false END,
        reviewed_at=now(),reviewed_by=v_uid,updated_at=now()
    WHERE p.id=p_professional_id AND p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
    UPDATE public.agenda_professional_eligibility e
    SET is_active=EXISTS(
      SELECT 1 FROM public.agenda_professionals p
      WHERE p.id=p_professional_id AND p.profile_status='active' AND p.is_active
    ),updated_at=now()
    WHERE e.professional_id=p_professional_id;
  ELSE
    RAISE EXCEPTION 'Ação inválida.';
  END IF;

  RETURN QUERY
  SELECT p.id,p.profile_status,p.is_active,p.reviewed_at
  FROM public.agenda_professionals p
  WHERE p.id=p_professional_id
    AND p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
END
$function$;

-- Add canonical rejection template by inheriting tenant/brand/category/status from the approved professional template.
WITH source_template AS (
  SELECT t.*,v.approval_status
  FROM public.communication_templates t
  JOIN public.communication_template_versions v ON v.template_id=t.id AND v.version=t.current_version
  WHERE t.template_key='professional.registration.approved'
  LIMIT 1
), inserted_template AS (
  INSERT INTO public.communication_templates(
    tenant_id,brand_id,parent_template_id,template_key,event_type,channel,category,locale,status,current_version,created_by
  )
  SELECT tenant_id,brand_id,id,'professional.registration.rejected','professional.registration.rejected',channel,category,locale,status,1,created_by
  FROM source_template
  WHERE NOT EXISTS(
    SELECT 1 FROM public.communication_templates WHERE template_key='professional.registration.rejected'
  )
  RETURNING id,tenant_id
), target_template AS (
  SELECT id,tenant_id FROM inserted_template
  UNION ALL
  SELECT id,tenant_id FROM public.communication_templates WHERE template_key='professional.registration.rejected'
  LIMIT 1
), source_version AS (
  SELECT v.approval_status
  FROM public.communication_templates t
  JOIN public.communication_template_versions v ON v.template_id=t.id AND v.version=t.current_version
  WHERE t.template_key='professional.registration.approved'
  LIMIT 1
)
INSERT INTO public.communication_template_versions(
  tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
  variables_schema,required_variables,optional_variables,fallback_values,approval_status,published_at
)
SELECT tt.tenant_id,tt.id,1,
  'Atualização sobre seu cadastro profissional',
  'Comitê CHRISMED — resultado da análise do cadastro',
  '<p>Olá, {{recipient_name}}.</p><p>Após análise, seu cadastro profissional não foi aprovado neste momento.</p><p><strong>Motivo:</strong> {{reason}}</p><p>Se precisar de esclarecimentos, entre em contato com a CHRISMED.</p>',
  'Olá, {{recipient_name}}. Após análise, seu cadastro profissional não foi aprovado neste momento. Motivo: {{reason}}. Em caso de dúvida, fale com a CHRISMED.',
  '{}'::jsonb,ARRAY['recipient_name','reason']::text[],ARRAY[]::text[],'{}'::jsonb,sv.approval_status,now()
FROM target_template tt CROSS JOIN source_version sv
WHERE NOT EXISTS(
  SELECT 1 FROM public.communication_template_versions v WHERE v.template_id=tt.id AND v.version=1
);
