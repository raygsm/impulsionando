-- 1) Estender trial_create para aceitar user_id e link de acesso personalizado
CREATE OR REPLACE FUNCTION public.trial_create(
  _contact_name text,
  _contact_company text,
  _contact_email text,
  _contact_whatsapp text,
  _contact_doc text,
  _chosen_plan trial_plan_choice,
  _source text DEFAULT 'site'::text,
  _terms_ip text DEFAULT NULL::text,
  _user_id uuid DEFAULT NULL::uuid,
  _link_acesso text DEFAULT 'https://impulsionando.com.br/auth'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE s RECORD; trial_id uuid; abuse jsonb; days int;
BEGIN
  SELECT * INTO s FROM public.trial_settings LIMIT 1;
  days := COALESCE(s.duration_days, 7);
  abuse := public.trial_check_abuse(_contact_email, _contact_whatsapp, _contact_doc, _contact_company);
  IF (abuse->>'allowed')::boolean = false THEN
    RAISE EXCEPTION 'Já existe um Trial registrado para estes dados.';
  END IF;

  INSERT INTO public.trial_subscriptions (
    user_id, contact_name, contact_company, contact_email, contact_whatsapp, contact_doc,
    chosen_plan, status, started_at, ends_at, source, terms_ip
  ) VALUES (
    _user_id, _contact_name, _contact_company, lower(_contact_email), _contact_whatsapp, _contact_doc,
    _chosen_plan, 'ativo', now(), now() + (days || ' days')::interval, _source, _terms_ip
  ) RETURNING id INTO trial_id;

  INSERT INTO public.trial_abuse_index (trial_id, email_hash, whatsapp_hash, doc_hash, company_hash)
  VALUES (
    trial_id,
    public._trial_norm(_contact_email),
    public._trial_norm(_contact_whatsapp),
    NULLIF(public._trial_norm(_contact_doc),''),
    NULLIF(public._trial_norm(_contact_company),'')
  );

  INSERT INTO public.trial_events (trial_id, event_type, payload)
  VALUES (trial_id, 'trial.created', jsonb_build_object('plan', _chosen_plan, 'source', _source));

  PERFORM public.enqueue_message(
    'trial_started', NULL, _user_id, _contact_email, _contact_whatsapp, _contact_name,
    jsonb_build_object('nome_cliente', _contact_name, 'nome_plano', _chosen_plan::text,
                       'link_acesso', _link_acesso),
    ARRAY['email','whatsapp']::text[], 'trial', trial_id::text
  );
  RETURN trial_id;
END $function$;

-- 2) Bloqueio total: user_has_permission agora exige assinatura/trial ativo para perms operacionais
CREATE OR REPLACE FUNCTION public.user_has_permission(_user uuid, _company uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _override text;
  _from_profile boolean;
  _is_operational boolean;
  _company_active boolean;
  _is_master_company boolean;
BEGIN
  -- Super admin sempre passa
  IF public.is_super_admin(_user) THEN RETURN true; END IF;

  -- Verifica se a permissão é de natureza operacional (módulo de negócio)
  _is_operational := _perm ~ '^(crm|finance|agenda|sales|inventory|ehr|customer)\.';

  IF _is_operational THEN
    -- Empresa master (Impulsionando) sempre opera
    SELECT is_master INTO _is_master_company FROM public.companies WHERE id = _company;

    IF NOT COALESCE(_is_master_company, false) THEN
      -- Equipe Impulsionando opera em qualquer empresa
      IF NOT public.is_impulsionando_staff(_user) THEN
        -- Empresa tem assinatura paga ativa OU trial em curso?
        SELECT EXISTS (
          SELECT 1
          FROM public.subscriptions s
          JOIN public.user_profiles up ON up.user_id = s.user_id
          WHERE up.company_id = _company
            AND up.is_active = true
            AND (
              (s.status IN ('active','trialing','past_due')
                AND (s.current_period_end IS NULL OR s.current_period_end > now()))
              OR (s.status = 'canceled' AND s.current_period_end > now())
            )
        ) OR EXISTS (
          SELECT 1
          FROM public.trial_subscriptions t
          JOIN public.user_profiles up ON up.user_id = t.user_id
          WHERE up.company_id = _company
            AND up.is_active = true
            AND t.status IN ('ativo','vence_3d','vence_1d','vence_hoje','cobranca_gerada','convertido','regularizado')
        ) INTO _company_active;

        IF NOT COALESCE(_company_active, false) THEN
          RETURN false;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Override individual (grant/deny) tem precedência sobre o perfil
  SELECT o.effect INTO _override
  FROM public.user_permission_overrides o
  JOIN public.permissions p ON p.id = o.permission_id
  WHERE o.user_id = _user AND o.company_id = _company AND p.code = _perm
  LIMIT 1;

  IF _override = 'deny' THEN RETURN false; END IF;
  IF _override = 'grant' THEN RETURN true; END IF;

  -- Permissão herdada do perfil
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.profile_permissions pp ON pp.profile_id = up.profile_id
    JOIN public.permissions perm ON perm.id = pp.permission_id
    WHERE up.user_id = _user AND up.company_id = _company
      AND up.is_active = true AND perm.code = _perm
  ) INTO _from_profile;

  RETURN COALESCE(_from_profile, false);
END $function$;