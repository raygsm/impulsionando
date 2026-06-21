
-- =====================================================================
-- MÓDULO CORE: AGENDA INTELIGENTE — FASE 1 (SCHEMA) v2
-- =====================================================================

CREATE TABLE public.agenda_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  address text, city text, state text, zip text,
  geo_lat numeric(10,7), geo_lng numeric(10,7),
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_locations TO authenticated;
GRANT ALL ON public.agenda_locations TO service_role;
ALTER TABLE public.agenda_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY al_select ON public.agenda_locations FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.location.read'));
CREATE POLICY al_write ON public.agenda_locations TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.location.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.location.write'));
CREATE INDEX idx_aloc_company ON public.agenda_locations(company_id);
CREATE TRIGGER tg_aloc_updated BEFORE UPDATE ON public.agenda_locations FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aloc_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_locations FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  location_id uuid REFERENCES public.agenda_locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'room',
  capacity int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_rooms TO authenticated;
GRANT ALL ON public.agenda_rooms TO service_role;
ALTER TABLE public.agenda_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY ar_select ON public.agenda_rooms FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.room.read'));
CREATE POLICY ar_write ON public.agenda_rooms TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.room.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.room.write'));
CREATE INDEX idx_aroom_company ON public.agenda_rooms(company_id);
CREATE INDEX idx_aroom_location ON public.agenda_rooms(location_id);
CREATE TRIGGER tg_aroom_updated BEFORE UPDATE ON public.agenda_rooms FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aroom_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_rooms FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  starts_time time NOT NULL,
  ends_time time NOT NULL,
  weekdays int[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_shifts TO authenticated;
GRANT ALL ON public.agenda_shifts TO service_role;
ALTER TABLE public.agenda_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ash_select ON public.agenda_shifts FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.shift.read'));
CREATE POLICY ash_write ON public.agenda_shifts TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.shift.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.shift.write'));
CREATE INDEX idx_ashift_company ON public.agenda_shifts(company_id);
CREATE TRIGGER tg_ashift_updated BEFORE UPDATE ON public.agenda_shifts FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_ashift_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_shifts FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_oncall_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  location_id uuid REFERENCES public.agenda_locations(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.agenda_rooms(id) ON DELETE SET NULL,
  service_id uuid,
  specialty text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  assigned_professional_id uuid REFERENCES public.agenda_professionals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','covered','in_progress','completed','uncovered','cancelled')),
  hourly_rate numeric(10,2),
  flat_rate numeric(10,2),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_oncall_shifts TO authenticated;
GRANT ALL ON public.agenda_oncall_shifts TO service_role;
ALTER TABLE public.agenda_oncall_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY aoc_select ON public.agenda_oncall_shifts FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.oncall.read')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = assigned_professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY aoc_write ON public.agenda_oncall_shifts TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.oncall.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.oncall.write'));
CREATE INDEX idx_aoc_company_time ON public.agenda_oncall_shifts(company_id, starts_at);
CREATE INDEX idx_aoc_status ON public.agenda_oncall_shifts(company_id, status);
CREATE TRIGGER tg_aoc_updated BEFORE UPDATE ON public.agenda_oncall_shifts FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aoc_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_oncall_shifts FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_professional_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  service_id uuid,
  specialty text,
  location_id uuid REFERENCES public.agenda_locations(id) ON DELETE SET NULL,
  priority int NOT NULL DEFAULT 100,
  performance_score numeric(5,2) NOT NULL DEFAULT 0,
  no_show_rate numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_professional_eligibility TO authenticated;
GRANT ALL ON public.agenda_professional_eligibility TO service_role;
ALTER TABLE public.agenda_professional_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY ape_select ON public.agenda_professional_eligibility FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY ape_write ON public.agenda_professional_eligibility TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write'));
CREATE INDEX idx_ape_company ON public.agenda_professional_eligibility(company_id);
CREATE INDEX idx_ape_prof ON public.agenda_professional_eligibility(professional_id);
CREATE TRIGGER tg_ape_updated BEFORE UPDATE ON public.agenda_professional_eligibility FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_ape_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_professional_eligibility FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  accepts_walkin boolean NOT NULL DEFAULT false,
  accepts_oncall boolean NOT NULL DEFAULT false,
  accepts_emergency boolean NOT NULL DEFAULT false,
  accepts_substitution boolean NOT NULL DEFAULT true,
  accepts_in_person boolean NOT NULL DEFAULT true,
  accepts_telehealth boolean NOT NULL DEFAULT false,
  accepts_home boolean NOT NULL DEFAULT false,
  min_notice_minutes int NOT NULL DEFAULT 30,
  max_response_minutes int NOT NULL DEFAULT 15,
  travel_radius_km int,
  served_regions text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_professional_availability TO authenticated;
GRANT ALL ON public.agenda_professional_availability TO service_role;
ALTER TABLE public.agenda_professional_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY apav_select ON public.agenda_professional_availability FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY apav_write ON public.agenda_professional_availability TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE INDEX idx_apav_company ON public.agenda_professional_availability(company_id);
CREATE TRIGGER tg_apav_updated BEFORE UPDATE ON public.agenda_professional_availability FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_apav_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_professional_availability FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_professional_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agenda_professional_terms TO authenticated;
GRANT ALL ON public.agenda_professional_terms TO service_role;
ALTER TABLE public.agenda_professional_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY apt_select ON public.agenda_professional_terms FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY apt_insert ON public.agenda_professional_terms FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE INDEX idx_apt_prof ON public.agenda_professional_terms(professional_id);

CREATE TABLE public.agenda_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('no_show_customer','no_show_professional','cancellation','rescheduling','substitution','distribution','reminder','payment')),
  scope_service_id uuid,
  scope_specialty text,
  scope_plan text,
  version int NOT NULL DEFAULT 1,
  rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_rules TO authenticated;
GRANT ALL ON public.agenda_rules TO service_role;
ALTER TABLE public.agenda_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY arl_select ON public.agenda_rules FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.rule.read'));
CREATE POLICY arl_write ON public.agenda_rules TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.rule.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.rule.write'));
CREATE INDEX idx_arl_company_kind ON public.agenda_rules(company_id, kind);
CREATE TRIGGER tg_arl_updated BEFORE UPDATE ON public.agenda_rules FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_arl_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_rules FOR EACH ROW EXECUTE FUNCTION tg_audit();

-- ---- VAGAS ABERTAS (sem dependência circular ainda) ----
CREATE TABLE public.agenda_open_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  origin text NOT NULL CHECK (origin IN ('cancellation','no_show','oncall','walkin','manual','substitution','emergency')),
  appointment_id uuid REFERENCES public.agenda_appointments(id) ON DELETE SET NULL,
  oncall_shift_id uuid REFERENCES public.agenda_oncall_shifts(id) ON DELETE SET NULL,
  service_id uuid,
  specialty text,
  location_id uuid REFERENCES public.agenda_locations(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.agenda_rooms(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  payout_amount numeric(10,2),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','expired','cancelled')),
  claimed_by_professional_id uuid REFERENCES public.agenda_professionals(id) ON DELETE SET NULL,
  claimed_at timestamptz, claimed_ip text, claimed_user_agent text,
  expires_at timestamptz,
  current_wave int NOT NULL DEFAULT 0,
  distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_open_slots TO authenticated;
GRANT ALL ON public.agenda_open_slots TO service_role;
ALTER TABLE public.agenda_open_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY aos_select_admin ON public.agenda_open_slots FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.slot.read'));
CREATE POLICY aos_write ON public.agenda_open_slots TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write'));
CREATE INDEX idx_aos_company_status ON public.agenda_open_slots(company_id, status, starts_at);
CREATE TRIGGER tg_aos_updated BEFORE UPDATE ON public.agenda_open_slots FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aos_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_open_slots FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_slot_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  open_slot_id uuid NOT NULL REFERENCES public.agenda_open_slots(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.agenda_professionals(id) ON DELETE CASCADE,
  wave int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','seen','accepted','declined','expired','locked')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  channel text[] NOT NULL DEFAULT '{push}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (open_slot_id, professional_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_slot_offers TO authenticated;
GRANT ALL ON public.agenda_slot_offers TO service_role;
ALTER TABLE public.agenda_slot_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY aso_select ON public.agenda_slot_offers FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.slot.read')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY aso_update_own ON public.agenda_slot_offers FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write')
    OR EXISTS (SELECT 1 FROM public.agenda_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY aso_admin_insert ON public.agenda_slot_offers FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write'));
CREATE POLICY aso_admin_delete ON public.agenda_slot_offers FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.slot.write'));
CREATE INDEX idx_aso_slot ON public.agenda_slot_offers(open_slot_id);
CREATE INDEX idx_aso_prof_status ON public.agenda_slot_offers(professional_id, status);
CREATE TRIGGER tg_aso_updated BEFORE UPDATE ON public.agenda_slot_offers FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aso_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_slot_offers FOR EACH ROW EXECUTE FUNCTION tg_audit();

-- Agora que slot_offers existe, libera leitura para o profissional que recebeu oferta
CREATE POLICY aos_select_offered ON public.agenda_open_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agenda_slot_offers o
      JOIN public.agenda_professionals p ON p.id = o.professional_id
      WHERE o.open_slot_id = agenda_open_slots.id AND p.user_id = auth.uid()
    )
  );

CREATE TABLE public.agenda_no_show_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('customer','professional')),
  appointment_id uuid REFERENCES public.agenda_appointments(id) ON DELETE SET NULL,
  oncall_shift_id uuid REFERENCES public.agenda_oncall_shifts(id) ON DELETE SET NULL,
  customer_id uuid,
  professional_id uuid REFERENCES public.agenda_professionals(id) ON DELETE SET NULL,
  reason text,
  policy_applied jsonb NOT NULL DEFAULT '{}'::jsonb,
  charged_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.agenda_no_show_events TO authenticated;
GRANT ALL ON public.agenda_no_show_events TO service_role;
ALTER TABLE public.agenda_no_show_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY anse_select ON public.agenda_no_show_events FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.no_show.read'));
CREATE POLICY anse_write ON public.agenda_no_show_events TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.no_show.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.no_show.write'));
CREATE INDEX idx_anse_company ON public.agenda_no_show_events(company_id, created_at DESC);
CREATE TRIGGER tg_anse_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_no_show_events FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('customer','professional')),
  subject_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fine','block','priority_loss','warning','suspension')),
  reason text,
  amount numeric(10,2),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_penalties TO authenticated;
GRANT ALL ON public.agenda_penalties TO service_role;
ALTER TABLE public.agenda_penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY apen_select ON public.agenda_penalties FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.penalty.read'));
CREATE POLICY apen_write ON public.agenda_penalties TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.penalty.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.penalty.write'));
CREATE INDEX idx_apen_subject ON public.agenda_penalties(company_id, subject_type, subject_id);
CREATE TRIGGER tg_apen_updated BEFORE UPDATE ON public.agenda_penalties FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_apen_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_penalties FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_settings TO authenticated;
GRANT ALL ON public.agenda_settings TO service_role;
ALTER TABLE public.agenda_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY aset_select ON public.agenda_settings FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.settings.read'));
CREATE POLICY aset_write ON public.agenda_settings TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.settings.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.settings.write'));
CREATE INDEX idx_aset_company ON public.agenda_settings(company_id);
CREATE TRIGGER tg_aset_updated BEFORE UPDATE ON public.agenda_settings FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_aset_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_settings FOR EACH ROW EXECUTE FUNCTION tg_audit();

CREATE TABLE public.agenda_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before jsonb, after jsonb,
  ip text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agenda_audit_log TO authenticated;
GRANT ALL ON public.agenda_audit_log TO service_role;
ALTER TABLE public.agenda_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY aalog_select ON public.agenda_audit_log FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.audit.read'));
CREATE POLICY aalog_insert ON public.agenda_audit_log FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.audit.write'));
CREATE INDEX idx_aalog_company_time ON public.agenda_audit_log(company_id, created_at DESC);

INSERT INTO public.core_module_catalog (slug, name, category, short_description, long_description, features, niches, base_price_cents, setup_price_cents, icon, active)
VALUES (
  'agenda-inteligente',
  'Agenda Inteligente / Plantões / Pega-Horário',
  'operacional',
  'Agenda universal com plantões, no-show, regras e alerta Pega-Horário.',
  'Módulo CORE universal para qualquer operação baseada em horário: clínicas, consultórios, academias, prestadores de serviço, equipes técnicas. Cobre cadastro de locais, salas, profissionais, regras de no-show, plantões, distribuição automática de vagas, aceite em tempo real (pega-horário), penalidades, painéis de gestor/profissional/cliente, integração com Mercado Pago e auditoria completa.',
  '["plantoes","pega_horario","no_show","substituicao","encaixe","painel_profissional","painel_cliente","mercado_pago","auditoria"]'::jsonb,
  '{}'::text[],
  0, 0,
  'calendar-clock',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  features = EXCLUDED.features,
  icon = EXCLUDED.icon;

CREATE OR REPLACE FUNCTION public.agenda_claim_open_slot(
  _slot_id uuid,
  _professional_id uuid,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS public.agenda_open_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.agenda_open_slots;
  _prof public.agenda_professionals;
BEGIN
  SELECT * INTO _prof FROM public.agenda_professionals
   WHERE id = _professional_id AND user_id = auth.uid() AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'professional not allowed'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.agenda_slot_offers
     WHERE open_slot_id = _slot_id
       AND professional_id = _professional_id
       AND status IN ('sent','seen')
  ) THEN
    RAISE EXCEPTION 'no active offer for this professional';
  END IF;

  UPDATE public.agenda_open_slots
     SET status = 'claimed',
         claimed_by_professional_id = _professional_id,
         claimed_at = now(),
         claimed_ip = _ip,
         claimed_user_agent = _user_agent
   WHERE id = _slot_id
     AND status = 'open'
     AND company_id = _prof.company_id
   RETURNING * INTO _slot;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot already taken';
  END IF;

  UPDATE public.agenda_slot_offers
     SET status = 'accepted', responded_at = now()
   WHERE open_slot_id = _slot_id AND professional_id = _professional_id;

  UPDATE public.agenda_slot_offers
     SET status = 'locked', responded_at = now()
   WHERE open_slot_id = _slot_id AND professional_id <> _professional_id AND status IN ('sent','seen');

  IF _slot.appointment_id IS NOT NULL THEN
    UPDATE public.agenda_appointments
       SET professional_id = _professional_id, status = 'scheduled', updated_at = now()
     WHERE id = _slot.appointment_id;
  END IF;

  IF _slot.oncall_shift_id IS NOT NULL THEN
    UPDATE public.agenda_oncall_shifts
       SET assigned_professional_id = _professional_id, status = 'covered', updated_at = now()
     WHERE id = _slot.oncall_shift_id;
  END IF;

  INSERT INTO public.agenda_audit_log(company_id, actor_id, action, entity, entity_id, after, ip, user_agent)
  VALUES (_prof.company_id, auth.uid(), 'claim', 'agenda_open_slots', _slot.id, to_jsonb(_slot), _ip, _user_agent);

  RETURN _slot;
END $$;
GRANT EXECUTE ON FUNCTION public.agenda_claim_open_slot(uuid, uuid, text, text) TO authenticated;
