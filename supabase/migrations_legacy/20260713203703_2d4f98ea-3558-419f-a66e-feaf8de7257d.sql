-- Trigger de DB: dispara "conversao.cadastro-concluido" no N8N via pg_net
-- quando um novo user_profile é criado.

CREATE OR REPLACE FUNCTION public.trigger_n8n_cadastro_concluido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_active boolean;
  v_body jsonb;
BEGIN
  SELECT webhook_url, is_active INTO v_url, v_active
  FROM public.n8n_workflows
  WHERE event_code = 'conversao.cadastro-concluido'
  LIMIT 1;

  IF v_url IS NULL OR v_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_body := jsonb_build_object(
    'event_code', 'conversao.cadastro-concluido',
    'company_id', NEW.company_id,
    'dispatched_at', now(),
    'data', jsonb_build_object(
      'user_id', NEW.user_id,
      'user_profile_id', NEW.id,
      'company_id', NEW.company_id,
      'unit_id', NEW.unit_id,
      'profile_id', NEW.profile_id,
      'display_name', NEW.display_name,
      'email', NEW.email
    )
  );

  PERFORM net.http_post(
    url := v_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := v_body
  );

  -- log best-effort
  BEGIN
    INSERT INTO public.n8n_dispatch_log (event_code, company_id, payload, status_code, response_body, error)
    VALUES ('conversao.cadastro-concluido', NEW.company_id, v_body->'data', 202, 'dispatched via pg_net', NULL);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_n8n_cadastro_concluido ON public.user_profiles;
CREATE TRIGGER trg_n8n_cadastro_concluido
AFTER INSERT ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_n8n_cadastro_concluido();