-- =========================================================
-- PROMPT 4 — MÓDULO AGENDA ONLINE
-- =========================================================

-- 1) PERMISSÕES NOVAS
INSERT INTO public.permissions(module, code, description) VALUES
  ('agenda','agenda.professional.read','Visualizar profissionais'),
  ('agenda','agenda.professional.write','Gerenciar profissionais'),
  ('agenda','agenda.service.read','Visualizar serviços'),
  ('agenda','agenda.service.write','Gerenciar serviços'),
  ('agenda','agenda.schedule.write','Gerenciar horários e bloqueios'),
  ('agenda','agenda.appointment.read','Visualizar agendamentos'),
  ('agenda','agenda.appointment.write','Criar/editar agendamentos'),
  ('agenda','agenda.appointment.cancel','Cancelar agendamentos'),
  ('agenda','agenda.waitlist.write','Gerenciar fila de espera')
ON CONFLICT (code) DO NOTHING;

-- 2) ASSOCIAÇÃO DE PERFIS PADRÃO
DO $$
DECLARE
  super_id uuid; admin_imp_id uuid; gestor_id uuid; admin_un_id uuid;
  recep_id uuid; oper_id uuid; prof_id uuid; auditor_id uuid;
BEGIN
  SELECT id INTO super_id FROM public.profiles WHERE slug='super-admin-impulsionando';
  SELECT id INTO admin_imp_id FROM public.profiles WHERE slug='admin-impulsionando';
  SELECT id INTO gestor_id FROM public.profiles WHERE slug='gestor-empresa';
  SELECT id INTO admin_un_id FROM public.profiles WHERE slug='admin-unidade';
  SELECT id INTO recep_id FROM public.profiles WHERE slug='recepcao';
  SELECT id INTO oper_id FROM public.profiles WHERE slug='operador';
  SELECT id INTO prof_id FROM public.profiles WHERE slug='profissional';
  SELECT id INTO auditor_id FROM public.profiles WHERE slug='auditor';

  -- gestores/admins: tudo
  INSERT INTO public.profile_permissions(profile_id, permission_id)
  SELECT p_id, perm.id FROM (VALUES (super_id),(admin_imp_id),(gestor_id),(admin_un_id)) AS t(p_id)
  CROSS JOIN public.permissions perm
  WHERE perm.module='agenda' AND p_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- recepção/operador: agendamentos + fila + leitura
  INSERT INTO public.profile_permissions(profile_id, permission_id)
  SELECT p_id, perm.id FROM (VALUES (recep_id),(oper_id)) AS t(p_id)
  CROSS JOIN public.permissions perm
  WHERE perm.code IN ('agenda.professional.read','agenda.service.read','agenda.appointment.read',
                      'agenda.appointment.write','agenda.appointment.cancel','agenda.waitlist.write')
    AND p_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- profissional: leitura + criar agendamento + fila
  INSERT INTO public.profile_permissions(profile_id, permission_id)
  SELECT prof_id, perm.id FROM public.permissions perm
  WHERE perm.code IN ('agenda.professional.read','agenda.service.read','agenda.appointment.read',
                      'agenda.appointment.write','agenda.waitlist.write')
    AND prof_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- auditor: só leitura
  INSERT INTO public.profile_permissions(profile_id, permission_id)
  SELECT auditor_id, perm.id FROM public.permissions perm
  WHERE perm.module='agenda' AND perm.code LIKE '%.read' AND auditor_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END $$;

-- 3) MÓDULO NO CATÁLOGO
INSERT INTO public.modules(slug, name, description, category, icon, is_core, sort_order)
VALUES ('agenda','Agenda','Agendamento online com profissionais, serviços, horários e fila','operacional','calendar', false, 20)
ON CONFLICT (slug) DO NOTHING;

-- ATIVAR PARA EMPRESAS NÃO-MASTER
INSERT INTO public.company_modules(company_id, module_id, is_enabled)
SELECT c.id, m.id, true
FROM public.companies c CROSS JOIN public.modules m
WHERE c.is_master = false AND m.slug='agenda'
ON CONFLICT DO NOTHING;

-- 4) TABELAS

-- 4.1 Profissionais
CREATE TABLE public.agenda_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  unit_id uuid,
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  color text NOT NULL DEFAULT '#6366f1',
  bio text,
  commission_pct numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_professionals TO authenticated;
GRANT ALL ON public.agenda_professionals TO service_role;
ALTER TABLE public.agenda_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY ap_select ON public.agenda_professionals FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY ap_write ON public.agenda_professionals FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.write'));

CREATE INDEX idx_ap_company ON public.agenda_professionals(company_id);
CREATE TRIGGER tg_ap_updated BEFORE UPDATE ON public.agenda_professionals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_ap_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_professionals
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- 4.2 Serviços
CREATE TABLE public.agenda_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL DEFAULT 30 CHECK (duration_min > 0 AND duration_min <= 1440),
  price numeric(10,2) NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#10b981',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_services TO authenticated;
GRANT ALL ON public.agenda_services TO service_role;
ALTER TABLE public.agenda_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY as_select ON public.agenda_services FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY as_write ON public.agenda_services FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.service.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.service.write'));

CREATE INDEX idx_as_company ON public.agenda_services(company_id);
CREATE TRIGGER tg_as_updated BEFORE UPDATE ON public.agenda_services
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_as_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_services
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- 4.3 Vínculo profissional x serviço
CREATE TABLE public.agenda_professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  service_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_professional_services TO authenticated;
GRANT ALL ON public.agenda_professional_services TO service_role;
ALTER TABLE public.agenda_professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY aps_select ON public.agenda_professional_services FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY aps_write ON public.agenda_professional_services FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.service.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.service.write'));

-- 4.4 Horários semanais
CREATE TABLE public.agenda_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_schedules TO authenticated;
GRANT ALL ON public.agenda_schedules TO service_role;
ALTER TABLE public.agenda_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY asch_select ON public.agenda_schedules FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY asch_write ON public.agenda_schedules FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.schedule.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.schedule.write'));

CREATE INDEX idx_asch_prof ON public.agenda_schedules(professional_id, weekday);
CREATE TRIGGER tg_asch_updated BEFORE UPDATE ON public.agenda_schedules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4.5 Bloqueios pontuais
CREATE TABLE public.agenda_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_blocks TO authenticated;
GRANT ALL ON public.agenda_blocks TO service_role;
ALTER TABLE public.agenda_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_select ON public.agenda_blocks FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY ab_write ON public.agenda_blocks FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.schedule.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.schedule.write'));

CREATE INDEX idx_ab_prof_time ON public.agenda_blocks(professional_id, starts_at, ends_at);

-- 4.6 Agendamentos
CREATE TABLE public.agenda_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  unit_id uuid,
  professional_id uuid NOT NULL,
  service_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  lead_id uuid,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','checked_in','in_progress','completed','no_show','cancelled')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  cancel_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_appointments TO authenticated;
GRANT ALL ON public.agenda_appointments TO service_role;
ALTER TABLE public.agenda_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY aa_select ON public.agenda_appointments FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY aa_insert ON public.agenda_appointments FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.write'));
CREATE POLICY aa_update ON public.agenda_appointments FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.write')
       OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.cancel'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.write')
            OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.cancel'));
CREATE POLICY aa_delete ON public.agenda_appointments FOR DELETE TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.cancel'));

CREATE INDEX idx_aa_company_time ON public.agenda_appointments(company_id, starts_at);
CREATE INDEX idx_aa_prof_time ON public.agenda_appointments(professional_id, starts_at);
CREATE TRIGGER tg_aa_updated BEFORE UPDATE ON public.agenda_appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_aa_audit AFTER INSERT OR UPDATE OR DELETE ON public.agenda_appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- 4.7 Validador anti-conflito de horário
CREATE OR REPLACE FUNCTION public.tg_agenda_check_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('cancelled','no_show') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.agenda_appointments a
    WHERE a.professional_id = NEW.professional_id
      AND a.id <> NEW.id
      AND a.status NOT IN ('cancelled','no_show','completed')
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(NEW.starts_at, NEW.ends_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Conflito de horário com agendamento existente do profissional';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.agenda_blocks b
    WHERE (b.professional_id IS NULL OR b.professional_id = NEW.professional_id)
      AND b.company_id = NEW.company_id
      AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(NEW.starts_at, NEW.ends_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Horário bloqueado para o profissional';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_aa_conflict BEFORE INSERT OR UPDATE ON public.agenda_appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_agenda_check_conflict();

-- 4.8 Fila de espera
CREATE TABLE public.agenda_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  professional_id uuid,
  service_id uuid,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  preferred_date date,
  notes text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','contacted','converted','expired','cancelled')),
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_waitlist TO authenticated;
GRANT ALL ON public.agenda_waitlist TO service_role;
ALTER TABLE public.agenda_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY aw_select ON public.agenda_waitlist FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY aw_write ON public.agenda_waitlist FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.waitlist.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.waitlist.write'));

CREATE INDEX idx_aw_company ON public.agenda_waitlist(company_id, status);
CREATE TRIGGER tg_aw_updated BEFORE UPDATE ON public.agenda_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();