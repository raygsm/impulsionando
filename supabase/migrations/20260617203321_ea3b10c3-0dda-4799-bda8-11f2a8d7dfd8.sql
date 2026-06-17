-- Drop the autonomous helper (it required dblink auth which is not feasible from a trigger)
DROP FUNCTION IF EXISTS public.audit_log_autonomous(uuid, uuid, text, text, text, text, jsonb);

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
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := v_actor;
  END IF;

  SELECT count(*) INTO v_company_count
    FROM public.realestate_interests
    WHERE company_id = NEW.company_id
      AND created_at > now() - interval '1 minute';
  IF v_company_count >= 60 THEN
    RAISE EXCEPTION 'rate_limit_exceeded reason=per_company company=% observed=% limit=60', NEW.company_id, v_company_count
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_actor IS NOT NULL THEN
    SELECT count(*) INTO v_actor_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND created_by = v_actor
        AND created_at > now() - interval '1 minute';
    IF v_actor_count >= 10 THEN
      RAISE EXCEPTION 'rate_limit_exceeded reason=per_actor company=% actor=% observed=% limit=10', NEW.company_id, v_actor, v_actor_count
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.ip IS NOT NULL THEN
    SELECT count(*) INTO v_actor_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND ip = NEW.ip
        AND created_at > now() - interval '1 minute';
    IF v_actor_count >= 10 THEN
      RAISE EXCEPTION 'rate_limit_exceeded reason=per_ip company=% ip=% observed=% limit=10', NEW.company_id, NEW.ip, v_actor_count
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Application-callable audit RPC. Frontend/server catches the rate_limit_exceeded
-- error and calls this RPC to record the denied attempt with actor + company info.
CREATE OR REPLACE FUNCTION public.record_realestate_rate_limit_event(
  _company_id uuid,
  _reason text,
  _observed_count integer,
  _limit integer,
  _ip text DEFAULT NULL,
  _contact_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_id uuid;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  INSERT INTO public.audit_logs (company_id, user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    _company_id, v_uid, v_email,
    'realestate.interest.rate_limited', 'realestate_interests', NULL,
    jsonb_build_object(
      'reason', _reason,
      'observed_count', _observed_count,
      'limit', _limit,
      'window_seconds', 60,
      'ip', _ip,
      'contact_email', _contact_email
    )
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_realestate_rate_limit_event(uuid, text, integer, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_realestate_rate_limit_event(uuid, text, integer, integer, text, text) TO authenticated, service_role;