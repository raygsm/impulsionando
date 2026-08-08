
-- ============================================================
-- Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.support_ticket_status AS ENUM (
    'new','received','in_review','waiting_customer','waiting_core',
    'waiting_third_party','in_development','resolved','closed','reopened','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_priority AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_type AS ENUM (
    'financial','payment','payout','commission','contract','access','technical',
    'whatsapp','email','mercadopago','dashboard','permission','registration',
    'marketplace','clube','consumer','lgpd','suggestion','question','commercial','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_origin AS ENUM (
    'form','email','whatsapp','manual','system_error','payment_failure',
    'integration_failure','webhook_failure'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- support_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text UNIQUE NOT NULL DEFAULT ('TK-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  consumer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email text,
  requester_name text,
  subject text NOT NULL,
  description text NOT NULL,
  type public.support_ticket_type NOT NULL DEFAULT 'question',
  priority public.support_ticket_priority NOT NULL DEFAULT 'medium',
  status public.support_ticket_status NOT NULL DEFAULT 'new',
  origin public.support_ticket_origin NOT NULL DEFAULT 'form',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  rating int CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  rating_comment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON public.support_tickets(company_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_consumer ON public.support_tickets(consumer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee ON public.support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON public.support_tickets(status, priority);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Cliente: vê tickets da sua empresa OU os que ele abriu
CREATE POLICY "tickets_select_tenant_or_consumer_or_staff"
ON public.support_tickets FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR (company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), company_id))
  OR consumer_user_id = auth.uid()
  OR requester_user_id = auth.uid()
);

-- Inserção: cliente abre para sua empresa; consumidor abre como próprio; staff sempre
CREATE POLICY "tickets_insert_owner_or_staff"
ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (
  public.is_impulsionando_staff(auth.uid())
  OR (company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), company_id) AND requester_user_id = auth.uid())
  OR (consumer_user_id = auth.uid() AND requester_user_id = auth.uid())
);

-- Update: staff sempre; o requester só pode reabrir/avaliar
CREATE POLICY "tickets_update_staff_or_requester"
ON public.support_tickets FOR UPDATE TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR requester_user_id = auth.uid()
  OR consumer_user_id = auth.uid()
)
WITH CHECK (
  public.is_impulsionando_staff(auth.uid())
  OR requester_user_id = auth.uid()
  OR consumer_user_id = auth.uid()
);

-- ============================================================
-- support_ticket_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role text NOT NULL CHECK (author_role IN ('customer','consumer','staff','system')),
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_msgs_ticket ON public.support_ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: vê mensagens dos tickets a que tem acesso; mensagens internas só staff
CREATE POLICY "ticket_msgs_select"
ON public.support_ticket_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (
        public.is_impulsionando_staff(auth.uid())
        OR ((NOT is_internal) AND (
          (t.company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), t.company_id))
          OR t.consumer_user_id = auth.uid()
          OR t.requester_user_id = auth.uid()
        ))
      )
  )
);

-- INSERT: precisa ter acesso ao ticket; só staff escreve mensagem interna
CREATE POLICY "ticket_msgs_insert"
ON public.support_ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (
        public.is_impulsionando_staff(auth.uid())
        OR (
          (NOT is_internal)
          AND (
            (t.company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), t.company_id))
            OR t.consumer_user_id = auth.uid()
            OR t.requester_user_id = auth.uid()
          )
        )
      )
  )
  AND author_user_id = auth.uid()
);

-- ============================================================
-- support_email_inbox (e-mails recebidos por webhook que viram ticket)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_email_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox text NOT NULL,                 -- ex.: 'suporte@impulsionando.com.br'
  from_email text NOT NULL,
  from_name text,
  subject text,
  body_text text,
  body_html text,
  headers jsonb,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_inbox_processed ON public.support_email_inbox(processed, received_at);

GRANT SELECT ON public.support_email_inbox TO authenticated;
GRANT ALL ON public.support_email_inbox TO service_role;
ALTER TABLE public.support_email_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_staff_only"
ON public.support_email_inbox FOR SELECT TO authenticated
USING (public.is_impulsionando_staff(auth.uid()));

-- ============================================================
-- Trigger updated_at + auto first_response_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.support_tickets_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  END IF;
  IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_support_tickets_touch ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_touch
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.support_tickets_touch();

-- Marca first_response_at quando uma mensagem staff entra
CREATE OR REPLACE FUNCTION public.support_msg_first_response()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.author_role = 'staff' AND NEW.is_internal = false THEN
    UPDATE public.support_tickets
       SET first_response_at = COALESCE(first_response_at, now()),
           status = CASE WHEN status IN ('new','received') THEN 'in_review'::public.support_ticket_status ELSE status END
     WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_support_msg_first_response ON public.support_ticket_messages;
CREATE TRIGGER trg_support_msg_first_response
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.support_msg_first_response();
