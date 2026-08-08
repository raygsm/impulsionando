
-- 1) Aditivo em companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS segment text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS financial_email text,
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS commercial_email text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS owner_name text;

-- 2) Função de payload de identidade
CREATE OR REPLACE FUNCTION public.company_identity_payload(_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT * INTO c FROM public.companies
   WHERE id = COALESCE(_company_id, public.master_company_id());
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN jsonb_strip_nulls(jsonb_build_object(
    'company_id',              c.id::text,
    'company_name',            COALESCE(c.trade_name, c.name),
    'company_legal_name',      c.legal_name,
    'company_trade_name',      c.trade_name,
    'company_type',            c.company_type,
    'company_segment',         c.segment,
    'company_logo',            c.logo_url,
    'company_primary_color',   c.primary_color,
    'company_secondary_color', c.secondary_color,
    'company_email',           c.email,
    'company_phone',           c.phone,
    'company_whatsapp',        COALESCE(c.whatsapp, c.phone),
    'company_financial_email', COALESCE(c.financial_email, c.email),
    'company_support_email',   COALESCE(c.support_email, c.email),
    'company_commercial_email',COALESCE(c.commercial_email, c.email),
    'company_domain',          c.domain,
    'company_subdomain',       c.subdomain,
    'company_website',         COALESCE(c.website, c.domain),
    'company_instagram',       c.instagram,
    'company_facebook',        c.facebook,
    'company_address',         c.address_line,
    'company_city',            c.address_city,
    'company_state',           c.address_state,
    'company_zip',             c.address_zip,
    'company_owner',           c.owner_name,
    'company_document',        c.document,
    'company_status',          c.status
  ));
END $$;

GRANT EXECUTE ON FUNCTION public.company_identity_payload(uuid) TO authenticated, service_role;

-- 3) Patch em enqueue_message para mesclar identidade automaticamente
CREATE OR REPLACE FUNCTION public.enqueue_message(
  _event_code text,
  _company_id uuid,
  _recipient_user_id uuid,
  _recipient_email text,
  _recipient_phone text,
  _recipient_name text,
  _payload jsonb DEFAULT '{}'::jsonb,
  _channels text[] DEFAULT ARRAY['whatsapp'::text, 'email'::text, 'in_app'::text],
  _reference_type text DEFAULT NULL::text,
  _reference_id text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ch text;
  _tpl RECORD;
  _enabled boolean;
  _count int := 0;
  _subj text;
  _body text;
  _identity jsonb;
  _merged jsonb;
BEGIN
  -- Identidade da empresa = fonte única; payload do chamador tem prioridade em colisão
  _identity := public.company_identity_payload(_company_id);
  _merged := _identity || COALESCE(_payload, '{}'::jsonb);

  FOREACH _ch IN ARRAY _channels LOOP
    IF _ch = 'email'    AND COALESCE(_recipient_email,'') = '' THEN CONTINUE; END IF;
    IF _ch = 'whatsapp' AND COALESCE(_recipient_phone,'') = '' THEN CONTINUE; END IF;
    IF _ch = 'in_app'   AND _recipient_user_id IS NULL          THEN CONTINUE; END IF;

    IF _ch = 'in_app' THEN
      SELECT enabled INTO _enabled FROM public.notification_preferences
       WHERE user_id = _recipient_user_id AND category = _event_code AND channel = 'in_app'
         AND (company_id = _company_id OR company_id IS NULL)
       ORDER BY company_id NULLS LAST LIMIT 1;
      IF _enabled = false THEN CONTINUE; END IF;
    END IF;

    SELECT * INTO _tpl FROM public.message_templates
     WHERE event_code = _event_code AND channel = _ch AND is_active = true
       AND (company_id = _company_id OR company_id IS NULL)
     ORDER BY company_id NULLS LAST LIMIT 1;
    IF NOT FOUND THEN CONTINUE; END IF;

    _body := public.render_template(_tpl.body, _merged);
    _subj := CASE WHEN _tpl.subject IS NOT NULL THEN public.render_template(_tpl.subject, _merged) ELSE NULL END;

    INSERT INTO public.message_outbox(
      company_id, event_code, channel, template_id,
      recipient_user_id, recipient_email, recipient_phone, recipient_name,
      subject, body, payload, status, reference_type, reference_id, sent_at
    ) VALUES (
      _company_id, _event_code, _ch, _tpl.id,
      _recipient_user_id, _recipient_email, _recipient_phone, _recipient_name,
      _subj, _body, _merged,
      CASE WHEN _ch = 'in_app' THEN 'sent' ELSE 'queued' END,
      _reference_type, _reference_id,
      CASE WHEN _ch = 'in_app' THEN now() ELSE NULL END
    );
    _count := _count + 1;

    IF _ch = 'in_app' THEN
      PERFORM public.notify_user(
        _recipient_user_id, _company_id, _event_code, 'info',
        COALESCE(_subj, left(_body, 80)), _body, NULL, NULL
      );
    END IF;
  END LOOP;
  RETURN _count;
END $$;
