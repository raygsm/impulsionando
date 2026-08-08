
-- =============================================
-- B24: Tabelas operacionais Contabilidade
-- =============================================

CREATE TABLE public.contab_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  legal_name text NOT NULL,
  trade_name text,
  document text NOT NULL,
  document_type text NOT NULL DEFAULT 'CNPJ' CHECK (document_type IN ('CNPJ','CPF')),
  tax_regime text CHECK (tax_regime IN ('mei','simples','lucro_presumido','lucro_real','imune','isento')),
  cnae text,
  state_registration text,
  municipal_registration text,
  responsible_user_id uuid,
  contact_name text,
  contact_email text,
  contact_phone text,
  monthly_fee numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','onboarding','suspended','churned')),
  onboarding_step int DEFAULT 0,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, document)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_clients TO authenticated;
GRANT ALL ON public.contab_clients TO service_role;
ALTER TABLE public.contab_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_clients_select ON public.contab_clients FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_clients_write ON public.contab_clients FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.client.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.client.write'));
CREATE INDEX idx_contab_clients_company ON public.contab_clients(company_id);
CREATE INDEX idx_contab_clients_responsible ON public.contab_clients(responsible_user_id);
CREATE INDEX idx_contab_clients_status ON public.contab_clients(company_id, status);
CREATE TRIGGER trg_contab_clients_updated BEFORE UPDATE ON public.contab_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.contab_clients(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  title text NOT NULL,
  competence date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','processed','rejected','archived')),
  file_path text,
  file_size bigint,
  mime_type text,
  source text NOT NULL DEFAULT 'portal' CHECK (source IN ('portal','email','whatsapp','upload','integration')),
  uploaded_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_documents TO authenticated;
GRANT ALL ON public.contab_documents TO service_role;
ALTER TABLE public.contab_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_documents_select ON public.contab_documents FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_documents_write ON public.contab_documents FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.document.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.document.write'));
CREATE INDEX idx_contab_docs_client ON public.contab_documents(client_id, competence DESC);
CREATE INDEX idx_contab_docs_company_status ON public.contab_documents(company_id, status);
CREATE TRIGGER trg_contab_docs_updated BEFORE UPDATE ON public.contab_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.contab_clients(id) ON DELETE CASCADE,
  obligation_type text NOT NULL,
  title text NOT NULL,
  competence date NOT NULL,
  due_date date NOT NULL,
  amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','generated','sent','paid','overdue','cancelled','exempt')),
  scope text NOT NULL DEFAULT 'federal' CHECK (scope IN ('federal','state','municipal','labor','custom')),
  responsible_user_id uuid,
  generated_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  receipt_path text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_obligations TO authenticated;
GRANT ALL ON public.contab_obligations TO service_role;
ALTER TABLE public.contab_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_obligations_select ON public.contab_obligations FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_obligations_write ON public.contab_obligations FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'));
CREATE INDEX idx_contab_obl_client_due ON public.contab_obligations(client_id, due_date);
CREATE INDEX idx_contab_obl_company_status ON public.contab_obligations(company_id, status, due_date);
CREATE TRIGGER trg_contab_obl_updated BEFORE UPDATE ON public.contab_obligations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_fiscal_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  obligation_type text NOT NULL,
  scope text NOT NULL DEFAULT 'federal' CHECK (scope IN ('federal','state','municipal','labor','custom')),
  state_code text,
  city_code text,
  recurrence text NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('monthly','quarterly','yearly','one_off')),
  day_of_month int,
  applies_to_regime text[] DEFAULT ARRAY['simples','lucro_presumido','lucro_real']::text[],
  description text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_fiscal_calendar TO authenticated;
GRANT ALL ON public.contab_fiscal_calendar TO service_role;
ALTER TABLE public.contab_fiscal_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_cal_select ON public.contab_fiscal_calendar FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_cal_write ON public.contab_fiscal_calendar FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.calendar.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.calendar.write'));
CREATE INDEX idx_contab_cal_company ON public.contab_fiscal_calendar(company_id, is_active);
CREATE TRIGGER trg_contab_cal_updated BEFORE UPDATE ON public.contab_fiscal_calendar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  obligation_id uuid NOT NULL REFERENCES public.contab_obligations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.contab_clients(id) ON DELETE CASCADE,
  offset_days int NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','whatsapp','sms','in_app')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','failed','cancelled')),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_reminders TO authenticated;
GRANT ALL ON public.contab_reminders TO service_role;
ALTER TABLE public.contab_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_rem_select ON public.contab_reminders FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_rem_write ON public.contab_reminders FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'));
CREATE INDEX idx_contab_rem_scheduled ON public.contab_reminders(status, scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_contab_rem_obligation ON public.contab_reminders(obligation_id);
CREATE TRIGGER trg_contab_rem_updated BEFORE UPDATE ON public.contab_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Régua automática
CREATE OR REPLACE FUNCTION public.contab_seed_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offsets int[] := ARRAY[-7,-3,-1,0,5];
  o int;
BEGIN
  IF NEW.due_date IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH o IN ARRAY offsets LOOP
    INSERT INTO public.contab_reminders(
      company_id, obligation_id, client_id, offset_days, channel, scheduled_for, status
    ) VALUES (
      NEW.company_id, NEW.id, NEW.client_id, o, 'email',
      (NEW.due_date + (o || ' days')::interval)::timestamptz + interval '9 hours',
      'scheduled'
    );
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_contab_obl_reminders AFTER INSERT ON public.contab_obligations
FOR EACH ROW EXECUTE FUNCTION public.contab_seed_reminders();

-- Permissões base
INSERT INTO public.permissions (code, module, description) VALUES
  ('contab.client.write', 'contabilidade', 'Gerenciar clientes contábeis'),
  ('contab.document.write', 'contabilidade', 'Gerenciar documentos contábeis'),
  ('contab.obligation.write', 'contabilidade', 'Gerenciar obrigações fiscais'),
  ('contab.calendar.write', 'contabilidade', 'Gerenciar calendário fiscal')
ON CONFLICT (code) DO NOTHING;
