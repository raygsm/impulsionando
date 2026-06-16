
CREATE OR REPLACE FUNCTION public.tg_notify_evt_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _event_title text;
  _action text;
  _title text;
  _msg text;
  _severity text := 'info';
  _url text;
  _u record;
BEGIN
  SELECT t.event_id, e.title
    INTO _event_id, _event_title
    FROM public.evt_tickets t
    JOIN public.evt_events e ON e.id = t.event_id
   WHERE t.id = NEW.ticket_id;

  IF _event_id IS NULL THEN RETURN NEW; END IF;
  _url := '/eventos/' || _event_id::text;

  IF (TG_OP = 'INSERT') THEN
    _action := 'solicitada';
    _title := 'Transferência solicitada — ' || COALESCE(_event_title, 'evento');
    _msg := NEW.from_name || ' → ' || NEW.to_name || ' (' || NEW.to_email || ')';
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NEW.status = 'aprovada' THEN
      _action := 'aprovada';
      _title := 'Transferência aprovada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Novo titular: ' || NEW.to_name || ' (' || NEW.to_email || ')';
    ELSIF NEW.status = 'rejeitada' THEN
      _action := 'rejeitada';
      _severity := 'warning';
      _title := 'Transferência rejeitada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Solicitação de ' || NEW.from_name || ' para ' || NEW.to_name || ' foi recusada.';
    ELSIF NEW.status = 'cancelada' THEN
      _action := 'cancelada';
      _title := 'Transferência cancelada — ' || COALESCE(_event_title, 'evento');
      _msg := 'Solicitação de ' || NEW.from_name || ' foi cancelada.';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  FOR _u IN
    SELECT DISTINCT user_id
      FROM public.user_profiles
     WHERE company_id = NEW.company_id AND is_active = true
  LOOP
    PERFORM public.notify_user(
      _u.user_id, NEW.company_id,
      'events', _severity, _title, _msg, _url, 'Abrir evento'
    );
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_evt_transfer_ins ON public.evt_ticket_transfers;
DROP TRIGGER IF EXISTS trg_notify_evt_transfer_upd ON public.evt_ticket_transfers;

CREATE TRIGGER trg_notify_evt_transfer_ins
AFTER INSERT ON public.evt_ticket_transfers
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_evt_transfer();

CREATE TRIGGER trg_notify_evt_transfer_upd
AFTER UPDATE OF status ON public.evt_ticket_transfers
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_evt_transfer();
