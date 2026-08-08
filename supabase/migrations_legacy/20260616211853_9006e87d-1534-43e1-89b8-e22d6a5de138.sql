-- 1) Novos campos opcionais em evt_events para regras de transferência
ALTER TABLE public.evt_events
  ADD COLUMN IF NOT EXISTS transfer_deadline_hours integer,
  ADD COLUMN IF NOT EXISTS transfer_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_requires_document boolean NOT NULL DEFAULT false;

ALTER TABLE public.evt_events
  DROP CONSTRAINT IF EXISTS evt_events_transfer_fee_chk;
ALTER TABLE public.evt_events
  ADD CONSTRAINT evt_events_transfer_fee_chk CHECK (transfer_fee_cents >= 0);

-- 2) Campo fee_cents + to_document em evt_ticket_transfers
ALTER TABLE public.evt_ticket_transfers
  ADD COLUMN IF NOT EXISTS fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_document text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

-- 3) RPC de transferência atualizada — respeita prazo, exige doc se configurado,
--    e copia fee_cents do evento.
CREATE OR REPLACE FUNCTION public.evt_transfer_ticket(
  _ticket_id uuid,
  _to_name text,
  _to_email text,
  _to_phone text DEFAULT NULL,
  _reason text DEFAULT NULL,
  _to_document text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE t RECORD; e RECORD; tr_id uuid; new_status text; hours_left numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado' USING ERRCODE='28000'; END IF;
  SELECT * INTO t FROM public.evt_tickets WHERE id = _ticket_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ingresso não encontrado'; END IF;
  SELECT * INTO e FROM public.evt_events WHERE id = t.event_id;

  IF e.transfer_policy = 'bloqueada' THEN
    RAISE EXCEPTION 'Transferência bloqueada pelo organizador';
  END IF;

  IF t.status NOT IN ('emitido','transferido') THEN
    RAISE EXCEPTION 'Ingresso não pode ser transferido (status: %)', t.status;
  END IF;

  IF e.transfer_deadline_hours IS NOT NULL THEN
    hours_left := EXTRACT(EPOCH FROM (e.starts_at - now())) / 3600.0;
    IF hours_left < e.transfer_deadline_hours THEN
      RAISE EXCEPTION 'Prazo de transferência expirado (mínimo % h antes do evento)', e.transfer_deadline_hours;
    END IF;
  END IF;

  IF e.transfer_requires_document AND COALESCE(trim(_to_document), '') = '' THEN
    RAISE EXCEPTION 'Documento do novo titular é obrigatório para este evento';
  END IF;

  new_status := CASE WHEN e.transfer_policy = 'com_aprovacao' THEN 'pendente' ELSE 'aprovada' END;

  INSERT INTO public.evt_ticket_transfers(
    company_id, ticket_id, from_name, from_email, to_name, to_email, to_phone,
    to_document, reason, status, fee_cents, created_by, decided_at
  )
  VALUES (
    t.company_id, t.id, t.holder_name, t.holder_email, _to_name, lower(_to_email), _to_phone,
    NULLIF(trim(_to_document), ''), _reason, new_status,
    COALESCE(e.transfer_fee_cents, 0), auth.uid(),
    CASE WHEN new_status = 'aprovada' THEN now() ELSE NULL END
  )
  RETURNING id INTO tr_id;

  IF new_status = 'aprovada' THEN
    UPDATE public.evt_tickets
       SET holder_name = _to_name,
           holder_email = lower(_to_email),
           holder_phone = _to_phone,
           status = 'transferido'
     WHERE id = t.id;
  END IF;

  RETURN tr_id;
END
$function$;

REVOKE EXECUTE ON FUNCTION public.evt_transfer_ticket(uuid, text, text, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.evt_transfer_ticket(uuid, text, text, text, text, text) TO authenticated, service_role;

-- 4) RPC para aprovar/rejeitar uma transferência pendente (com_aprovacao)
CREATE OR REPLACE FUNCTION public.evt_decide_transfer(
  _transfer_id uuid,
  _decision text  -- 'aprovada' | 'rejeitada'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE tr RECORD; t RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado' USING ERRCODE='28000'; END IF;
  IF _decision NOT IN ('aprovada','rejeitada') THEN
    RAISE EXCEPTION 'Decisão inválida (use aprovada ou rejeitada)';
  END IF;

  SELECT * INTO tr FROM public.evt_ticket_transfers WHERE id = _transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transferência não encontrada'; END IF;

  IF NOT (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), tr.company_id)) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501';
  END IF;

  IF tr.status <> 'pendente' THEN
    RAISE EXCEPTION 'Transferência não está pendente (status: %)', tr.status;
  END IF;

  UPDATE public.evt_ticket_transfers
     SET status = _decision, approved_by = auth.uid(), decided_at = now(), updated_at = now()
   WHERE id = _transfer_id;

  IF _decision = 'aprovada' THEN
    SELECT * INTO t FROM public.evt_tickets WHERE id = tr.ticket_id FOR UPDATE;
    IF t.status IN ('emitido','transferido') THEN
      UPDATE public.evt_tickets
         SET holder_name = tr.to_name,
             holder_email = tr.to_email,
             holder_phone = tr.to_phone,
             status = 'transferido'
       WHERE id = tr.ticket_id;
    END IF;
  END IF;

  RETURN _transfer_id;
END
$function$;

REVOKE EXECUTE ON FUNCTION public.evt_decide_transfer(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.evt_decide_transfer(uuid, text) TO authenticated, service_role;