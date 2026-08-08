
-- Templates globais para transferências de ingresso (in_app + email)
INSERT INTO public.message_templates (company_id, event_code, channel, locale, subject, body, variables, is_active)
VALUES
  (NULL, 'evt_transfer_requested', 'email', 'pt-BR',
   'Nova solicitação de transferência — {{event_title}}',
   'Olá {{recipient_name}},\n\nUma transferência de ingresso foi solicitada para o evento "{{event_title}}".\n\nDe: {{from_name}} ({{from_email}})\nPara: {{to_name}} ({{to_email}})\nMotivo: {{reason}}\nTaxa: R$ {{fee_brl}}\n\nAbra o evento para revisar: {{event_url}}',
   '["event_title","from_name","from_email","to_name","to_email","reason","fee_brl","event_url","recipient_name"]'::jsonb, true),
  (NULL, 'evt_transfer_requested', 'in_app', 'pt-BR', NULL,
   'Transferência solicitada por {{from_name}} para {{to_name}} no evento {{event_title}}.',
   '["event_title","from_name","to_name"]'::jsonb, true),
  (NULL, 'evt_transfer_approved', 'email', 'pt-BR',
   'Transferência aprovada — {{event_title}}',
   'Olá {{recipient_name}},\n\nA transferência do ingresso do evento "{{event_title}}" foi aprovada.\n\nNovo titular: {{to_name}} ({{to_email}})\n\nAcesse o evento: {{event_url}}',
   '["event_title","to_name","to_email","event_url","recipient_name"]'::jsonb, true),
  (NULL, 'evt_transfer_approved', 'in_app', 'pt-BR', NULL,
   'Transferência aprovada para {{to_name}} no evento {{event_title}}.',
   '["event_title","to_name"]'::jsonb, true),
  (NULL, 'evt_transfer_rejected', 'email', 'pt-BR',
   'Transferência recusada — {{event_title}}',
   'Olá {{recipient_name}},\n\nA solicitação de transferência do ingresso do evento "{{event_title}}" foi recusada.\n\nDe: {{from_name}} → Para: {{to_name}}\n\nAcesse o evento: {{event_url}}',
   '["event_title","from_name","to_name","event_url","recipient_name"]'::jsonb, true),
  (NULL, 'evt_transfer_rejected', 'in_app', 'pt-BR', NULL,
   'Transferência recusada — {{event_title}}.',
   '["event_title"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Atualiza trigger para também enfileirar e-mail
CREATE OR REPLACE FUNCTION public.tg_notify_evt_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _event_title text;
  _event_starts timestamptz;
  _action text;
  _title text;
  _msg text;
  _severity text := 'info';
  _url text;
  _event_code text;
  _u record;
  _fee_brl text;
  _payload jsonb;
BEGIN
  SELECT t.event_id, e.title, e.starts_at
    INTO _event_id, _event_title, _event_starts
    FROM public.evt_tickets t
    JOIN public.evt_events e ON e.id = t.event_id
   WHERE t.id = NEW.ticket_id;

  IF _event_id IS NULL THEN RETURN NEW; END IF;
  _url := '/eventos/' || _event_id::text;
  _fee_brl := to_char(COALESCE(NEW.fee_cents,0)::numeric / 100.0, 'FM999G990D00');

  IF (TG_OP = 'INSERT') THEN
    _action := 'solicitada'; _event_code := 'evt_transfer_requested';
    _title := 'Transferência solicitada — ' || COALESCE(_event_title, 'evento');
    _msg := NEW.from_name || ' → ' || NEW.to_name || ' (' || NEW.to_email || ')';
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NEW.status = 'aprovada' THEN
      _action := 'aprovada'; _event_code := 'evt_transfer_approved';
      _title := 'Transferência aprovada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Novo titular: ' || NEW.to_name || ' (' || NEW.to_email || ')';
    ELSIF NEW.status = 'rejeitada' THEN
      _action := 'rejeitada'; _severity := 'warning'; _event_code := 'evt_transfer_rejected';
      _title := 'Transferência rejeitada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Solicitação de ' || NEW.from_name || ' para ' || NEW.to_name || ' foi recusada.';
    ELSIF NEW.status = 'cancelada' THEN
      _action := 'cancelada'; _event_code := 'evt_transfer_rejected';
      _title := 'Transferência cancelada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Solicitação de ' || NEW.from_name || ' foi cancelada.';
    ELSE RETURN NEW; END IF;
  ELSE RETURN NEW; END IF;

  _payload := jsonb_build_object(
    'event_title', COALESCE(_event_title,''),
    'event_url', _url,
    'from_name', COALESCE(NEW.from_name,''),
    'from_email', COALESCE(NEW.from_email,''),
    'to_name', COALESCE(NEW.to_name,''),
    'to_email', COALESCE(NEW.to_email,''),
    'reason', COALESCE(NEW.reason,''),
    'fee_brl', _fee_brl
  );

  FOR _u IN
    SELECT DISTINCT user_id, email, display_name
      FROM public.user_profiles
     WHERE company_id = NEW.company_id AND is_active = true
  LOOP
    PERFORM public.notify_user(
      _u.user_id, NEW.company_id,
      'events', _severity, _title, _msg, _url, 'Abrir evento'
    );
    BEGIN
      PERFORM public.enqueue_message(
        _event_code, NEW.company_id, _u.user_id,
        _u.email, NULL, _u.display_name,
        _payload || jsonb_build_object('recipient_name', COALESCE(_u.display_name,'')),
        ARRAY['email','in_app']::text[],
        'evt_ticket_transfer', NEW.id::text
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'enqueue_message evt_transfer failed: %', SQLERRM;
    END;
  END LOOP;

  -- Também avisa o novo titular por e-mail
  IF COALESCE(NEW.to_email,'') <> '' THEN
    BEGIN
      PERFORM public.enqueue_message(
        _event_code, NEW.company_id, NULL,
        NEW.to_email, NEW.to_phone, NEW.to_name,
        _payload || jsonb_build_object('recipient_name', COALESCE(NEW.to_name,'')),
        ARRAY['email']::text[],
        'evt_ticket_transfer', NEW.id::text
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  RETURN NEW;
END $$;

-- Auditoria nas transferências
DROP TRIGGER IF EXISTS trg_audit_evt_ticket_transfers ON public.evt_ticket_transfers;
CREATE TRIGGER trg_audit_evt_ticket_transfers
AFTER INSERT OR UPDATE OR DELETE ON public.evt_ticket_transfers
FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
