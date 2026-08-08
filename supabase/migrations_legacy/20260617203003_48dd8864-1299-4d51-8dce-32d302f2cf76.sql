CREATE OR REPLACE FUNCTION public.realestate_interests_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_count integer;
  v_company_count integer;
  v_actor uuid := COALESCE(auth.uid(), NEW.broker_user_id);
  v_user_email text;
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := v_actor;
  END IF;

  -- email of the acting user (for audit metadata only)
  IF v_actor IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_actor;
  END IF;

  SELECT count(*) INTO v_company_count
    FROM public.realestate_interests
    WHERE company_id = NEW.company_id
      AND created_at > now() - interval '1 minute';
  IF v_company_count >= 60 THEN
    INSERT INTO public.audit_logs (company_id, user_id, user_email, action, entity, entity_id, metadata)
    VALUES (
      NEW.company_id, v_actor, v_user_email,
      'realestate.interest.rate_limited', 'realestate_interests', NULL,
      jsonb_build_object(
        'reason', 'per_company',
        'window_seconds', 60,
        'observed_count', v_company_count,
        'limit', 60,
        'ip', NEW.ip,
        'contact_email', NEW.contact_email
      )
    );
    RAISE EXCEPTION 'rate_limit_exceeded: too many interests for this company (max 60/min)'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_actor IS NOT NULL THEN
    SELECT count(*) INTO v_actor_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND created_by = v_actor
        AND created_at > now() - interval '1 minute';
    IF v_actor_count >= 10 THEN
      INSERT INTO public.audit_logs (company_id, user_id, user_email, action, entity, entity_id, metadata)
      VALUES (
        NEW.company_id, v_actor, v_user_email,
        'realestate.interest.rate_limited', 'realestate_interests', NULL,
        jsonb_build_object(
          'reason', 'per_actor',
          'window_seconds', 60,
          'observed_count', v_actor_count,
          'limit', 10,
          'ip', NEW.ip,
          'contact_email', NEW.contact_email
        )
      );
      RAISE EXCEPTION 'rate_limit_exceeded: too many interests submitted (max 10/min per actor)'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.ip IS NOT NULL THEN
    SELECT count(*) INTO v_actor_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND ip = NEW.ip
        AND created_at > now() - interval '1 minute';
    IF v_actor_count >= 10 THEN
      INSERT INTO public.audit_logs (company_id, user_id, user_email, action, entity, entity_id, metadata)
      VALUES (
        NEW.company_id, NULL, NULL,
        'realestate.interest.rate_limited', 'realestate_interests', NULL,
        jsonb_build_object(
          'reason', 'per_ip',
          'window_seconds', 60,
          'observed_count', v_actor_count,
          'limit', 10,
          'ip', NEW.ip,
          'contact_email', NEW.contact_email
        )
      );
      RAISE EXCEPTION 'rate_limit_exceeded: too many interests submitted (max 10/min per IP)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Rate-limit audit rows are written with SECURITY DEFINER privileges; the existing
-- audit_logs RLS lets company admins / authorized roles read them.