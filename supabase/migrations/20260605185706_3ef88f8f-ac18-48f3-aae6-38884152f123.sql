
CREATE OR REPLACE FUNCTION public.trial_convert(_trial_id uuid, _paddle_sub text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode converter Trial';
  END IF;
  SELECT * INTO r FROM public.trial_subscriptions WHERE id = _trial_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trial não encontrado'; END IF;
  UPDATE public.trial_subscriptions
     SET status = 'convertido', converted_at = now(), paddle_subscription_id = _paddle_sub
   WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type, payload)
  VALUES (_trial_id, 'trial.converted', jsonb_build_object('paddle_sub', _paddle_sub));
  PERFORM public.enqueue_message('trial_payment_approved', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
    jsonb_build_object('nome_cliente', r.contact_name, 'nome_plano', r.chosen_plan::text),
    ARRAY['email','whatsapp']::text[], 'trial', _trial_id::text);
  RETURN _trial_id;
END $function$;

CREATE OR REPLACE FUNCTION public.trial_regularize(_trial_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode regularizar Trial';
  END IF;
  SELECT * INTO r FROM public.trial_subscriptions WHERE id = _trial_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trial não encontrado'; END IF;
  UPDATE public.trial_subscriptions SET status = 'regularizado', regularized_at = now() WHERE id = _trial_id;
  INSERT INTO public.trial_events (trial_id, event_type) VALUES (_trial_id, 'trial.regularized');
  PERFORM public.enqueue_message('trial_regularized', NULL, r.user_id, r.contact_email, r.contact_whatsapp, r.contact_name,
    jsonb_build_object('nome_cliente', r.contact_name), ARRAY['email','whatsapp']::text[], 'trial', _trial_id::text);
  RETURN _trial_id;
END $function$;

REVOKE EXECUTE ON FUNCTION public.trial_convert(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_convert(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.trial_regularize(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_regularize(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.enqueue_message(text, uuid, uuid, text, text, text, jsonb, text[], text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_message(text, uuid, uuid, text, text, text, jsonb, text[], text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_impulsionando_staff(_user uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE up.user_id = _user
      AND up.is_active = true
      AND p.is_master_profile = true
      AND p.slug IN ('super-admin-impulsionando', 'staff-impulsionando')
  );
$function$;

INSERT INTO public.permissions (code, module, description)
VALUES ('communication.outbox.write', 'communication', 'Editar mensagens da fila de envio')
ON CONFLICT (code) DO NOTHING;

DROP POLICY IF EXISTS mo_update ON public.message_outbox;
CREATE POLICY mo_update ON public.message_outbox
  FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR ((company_id IS NOT NULL) AND public.user_has_permission(auth.uid(), company_id, 'communication.outbox.write'))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR ((company_id IS NOT NULL) AND public.user_has_permission(auth.uid(), company_id, 'communication.outbox.write'))
  );
