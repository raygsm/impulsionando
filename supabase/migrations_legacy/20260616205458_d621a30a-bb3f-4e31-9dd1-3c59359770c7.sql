
-- =================== EVENTOS / INGRESSOS ===================
CREATE TABLE public.evt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  cover_url text,
  venue_name text,
  venue_address text,
  city text, state text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','encerrado','cancelado')),
  transfer_policy text NOT NULL DEFAULT 'livre' CHECK (transfer_policy IN ('livre','com_aprovacao','bloqueada')),
  refund_policy text,
  organizer_name text,
  organizer_contact text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evt_events TO authenticated;
GRANT ALL ON public.evt_events TO service_role;
GRANT SELECT ON public.evt_events TO anon;
ALTER TABLE public.evt_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_events public read published" ON public.evt_events FOR SELECT TO anon
  USING (is_published = true AND status = 'publicado');
CREATE POLICY "evt_events company read" ON public.evt_events FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "evt_events company write" ON public.evt_events FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_evt_events_uat BEFORE UPDATE ON public.evt_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.evt_ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.evt_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL,
  quantity_sold int NOT NULL DEFAULT 0,
  per_person_limit int NOT NULL DEFAULT 5,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evt_ticket_types TO authenticated;
GRANT ALL ON public.evt_ticket_types TO service_role;
GRANT SELECT ON public.evt_ticket_types TO anon;
ALTER TABLE public.evt_ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_tt public read" ON public.evt_ticket_types FOR SELECT TO anon
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.evt_events e WHERE e.id = event_id AND e.is_published));
CREATE POLICY "evt_tt company read" ON public.evt_ticket_types FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "evt_tt company write" ON public.evt_ticket_types FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_evt_tt_uat BEFORE UPDATE ON public.evt_ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.evt_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.evt_events(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES public.evt_ticket_types(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  qr_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'emitido'
    CHECK (status IN ('emitido','transferido','usado','cancelado','reembolsado')),
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  buyer_doc text,
  holder_name text NOT NULL,
  holder_email text NOT NULL,
  holder_phone text,
  holder_user_id uuid REFERENCES auth.users(id),
  price_paid numeric(12,2) NOT NULL DEFAULT 0,
  payment_reference text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  cancelled_at timestamptz,
  customer_id uuid REFERENCES public.customers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evt_tickets_event ON public.evt_tickets(event_id, status);
CREATE INDEX idx_evt_tickets_holder_email ON public.evt_tickets(holder_email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evt_tickets TO authenticated;
GRANT ALL ON public.evt_tickets TO service_role;
ALTER TABLE public.evt_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_tickets company read" ON public.evt_tickets FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
    OR holder_user_id = auth.uid()
  );
CREATE POLICY "evt_tickets company write" ON public.evt_tickets FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_evt_tickets_uat BEFORE UPDATE ON public.evt_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.evt_ticket_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.evt_tickets(id) ON DELETE CASCADE,
  from_name text NOT NULL,
  from_email text NOT NULL,
  to_name text NOT NULL,
  to_email text NOT NULL,
  to_phone text,
  reason text,
  status text NOT NULL DEFAULT 'aprovada' CHECK (status IN ('pendente','aprovada','rejeitada','cancelada')),
  approved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evt_ticket_transfers TO authenticated;
GRANT ALL ON public.evt_ticket_transfers TO service_role;
ALTER TABLE public.evt_ticket_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_tr company read" ON public.evt_ticket_transfers FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "evt_tr company write" ON public.evt_ticket_transfers FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

CREATE TABLE public.evt_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.evt_events(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.evt_tickets(id) ON DELETE CASCADE,
  gate text,
  operator_user_id uuid REFERENCES auth.users(id),
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evt_checkins_ticket ON public.evt_checkins(ticket_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evt_checkins TO authenticated;
GRANT ALL ON public.evt_checkins TO service_role;
ALTER TABLE public.evt_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_ck company read" ON public.evt_checkins FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "evt_ck company write" ON public.evt_checkins FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- Função de check-in transacional via QR (impede duplo uso).
CREATE OR REPLACE FUNCTION public.evt_checkin_by_qr(_qr_token text, _gate text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t RECORD; c_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE='28000';
  END IF;
  SELECT * INTO t FROM public.evt_tickets WHERE qr_token = _qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF NOT (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), t.company_id)) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501';
  END IF;
  IF t.status = 'usado' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used', 'used_at', t.used_at);
  END IF;
  IF t.status IN ('cancelado','reembolsado') THEN
    RETURN jsonb_build_object('ok', false, 'reason', t.status);
  END IF;
  UPDATE public.evt_tickets SET status = 'usado', used_at = now() WHERE id = t.id;
  INSERT INTO public.evt_checkins(company_id, event_id, ticket_id, gate, operator_user_id)
  VALUES (t.company_id, t.event_id, t.id, _gate, auth.uid())
  RETURNING id INTO c_id;
  RETURN jsonb_build_object('ok', true, 'checkin_id', c_id,
    'holder', t.holder_name, 'event_id', t.event_id, 'ticket_code', t.code);
END $$;

-- Transferência de ingresso conforme política do evento.
CREATE OR REPLACE FUNCTION public.evt_transfer_ticket(
  _ticket_id uuid, _to_name text, _to_email text, _to_phone text DEFAULT NULL, _reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t RECORD; e RECORD; tr_id uuid; new_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado' USING ERRCODE='28000'; END IF;
  SELECT * INTO t FROM public.evt_tickets WHERE id = _ticket_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ingresso não encontrado'; END IF;
  SELECT * INTO e FROM public.evt_events WHERE id = t.event_id;
  IF e.transfer_policy = 'bloqueada' THEN RAISE EXCEPTION 'Transferência bloqueada pelo organizador'; END IF;
  IF t.status NOT IN ('emitido','transferido') THEN RAISE EXCEPTION 'Ingresso não pode ser transferido'; END IF;
  new_status := CASE WHEN e.transfer_policy = 'com_aprovacao' THEN 'pendente' ELSE 'aprovada' END;
  INSERT INTO public.evt_ticket_transfers(company_id, ticket_id, from_name, from_email, to_name, to_email, to_phone, reason, status, created_by)
  VALUES (t.company_id, t.id, t.holder_name, t.holder_email, _to_name, lower(_to_email), _to_phone, _reason, new_status, auth.uid())
  RETURNING id INTO tr_id;
  IF new_status = 'aprovada' THEN
    UPDATE public.evt_tickets
       SET holder_name = _to_name, holder_email = lower(_to_email), holder_phone = _to_phone, status = 'transferido'
     WHERE id = t.id;
  END IF;
  RETURN tr_id;
END $$;

-- =================== COMUNIDADE / ASSOCIAÇÕES / CLUBES ===================
CREATE TABLE public.comm_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  kind text NOT NULL DEFAULT 'comunidade' CHECK (kind IN ('comunidade','associacao','clube','igreja','ong')),
  description text,
  monthly_fee numeric(12,2) NOT NULL DEFAULT 0,
  accepts_donations boolean NOT NULL DEFAULT true,
  donation_purpose text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_communities TO authenticated;
GRANT ALL ON public.comm_communities TO service_role;
ALTER TABLE public.comm_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_c company" ON public.comm_communities FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_comm_c_uat BEFORE UPDATE ON public.comm_communities
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.comm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.comm_communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  birthdate date,
  member_since date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inadimplente','afastado','desligado')),
  member_user_id uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES public.customers(id),
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comm_members_comm ON public.comm_members(community_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_members TO authenticated;
GRANT ALL ON public.comm_members TO service_role;
ALTER TABLE public.comm_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_m read" ON public.comm_members FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id) OR member_user_id = auth.uid());
CREATE POLICY "comm_m write" ON public.comm_members FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_comm_m_uat BEFORE UPDATE ON public.comm_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.comm_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.comm_communities(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.comm_members(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('em_aberto','pago','vencido','isento','cancelado')),
  due_date date NOT NULL,
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  fin_transaction_id uuid REFERENCES public.fin_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_memberships TO authenticated;
GRANT ALL ON public.comm_memberships TO service_role;
ALTER TABLE public.comm_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_ms read" ON public.comm_memberships FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id)
    OR EXISTS(SELECT 1 FROM public.comm_members m WHERE m.id = member_id AND m.member_user_id = auth.uid()));
CREATE POLICY "comm_ms write" ON public.comm_memberships FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE TRIGGER tg_comm_ms_uat BEFORE UPDATE ON public.comm_memberships
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.comm_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.comm_communities(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.comm_members(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_date date NOT NULL,
  status text NOT NULL DEFAULT 'presente' CHECK (status IN ('presente','ausente','justificado')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comm_att_member ON public.comm_attendance(member_id, event_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_attendance TO authenticated;
GRANT ALL ON public.comm_attendance TO service_role;
ALTER TABLE public.comm_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_at read" ON public.comm_attendance FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id)
    OR EXISTS(SELECT 1 FROM public.comm_members m WHERE m.id = member_id AND m.member_user_id = auth.uid()));
CREATE POLICY "comm_at write" ON public.comm_attendance FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

CREATE TABLE public.comm_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.comm_communities(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.comm_members(id) ON DELETE SET NULL,
  donor_name text NOT NULL,
  donor_email text,
  donor_phone text,
  amount numeric(12,2) NOT NULL,
  purpose text,
  payment_method text,
  payment_reference text,
  received_at timestamptz NOT NULL DEFAULT now(),
  fin_transaction_id uuid REFERENCES public.fin_transactions(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comm_don_comm ON public.comm_donations(community_id, received_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_donations TO authenticated;
GRANT ALL ON public.comm_donations TO service_role;
ALTER TABLE public.comm_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_do read" ON public.comm_donations FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "comm_do write" ON public.comm_donations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- =================== VIEW N8N por empresa (cross-niche dashboard) ===================
CREATE OR REPLACE VIEW public.n8n_runs_by_company AS
SELECT
  r.tenant_id AS company_id,
  r.regua,
  r.workflow_name,
  r.status,
  date_trunc('day', r.started_at) AS day,
  count(*) AS total,
  count(*) FILTER (WHERE r.status = 'failed') AS failures,
  count(*) FILTER (WHERE r.status = 'ok') AS oks
FROM public.n8n_workflow_runs r
GROUP BY 1,2,3,4,5;

GRANT SELECT ON public.n8n_runs_by_company TO authenticated;
GRANT SELECT ON public.n8n_runs_by_company TO service_role;
