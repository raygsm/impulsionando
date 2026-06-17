CREATE OR REPLACE FUNCTION public.realestate_interests_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_count integer;
  v_company_count integer;
  v_actor uuid := COALESCE(NEW.broker_user_id, auth.uid());
BEGIN
  SELECT count(*) INTO v_company_count
    FROM public.realestate_interests
    WHERE company_id = NEW.company_id
      AND created_at > now() - interval '1 minute';
  IF v_company_count >= 60 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: too many interests for this company (max 60/min)'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_actor IS NOT NULL THEN
    SELECT count(*) INTO v_actor_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND COALESCE(broker_user_id::text, ip::text) = COALESCE(v_actor::text, NEW.ip::text)
        AND created_at > now() - interval '1 minute';
    IF v_actor_count >= 10 THEN
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
      RAISE EXCEPTION 'rate_limit_exceeded: too many interests submitted (max 10/min per IP)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;