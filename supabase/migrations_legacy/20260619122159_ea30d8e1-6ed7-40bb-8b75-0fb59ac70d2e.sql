
-- Marocas Phase 1: Foundation (owners, apartments, professionals, services, schedules, supplies, maintenance, financials)
-- All linked via tenant_slug = 'marocas' to the CORE Impulsionando.

-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.marocas_apartment_status AS ENUM ('disponivel','ocupado','manutencao','bloqueado');
CREATE TYPE public.marocas_professional_role AS ENUM ('camareira','lavanderia','manutencao','vistoriador','gerente');
CREATE TYPE public.marocas_service_type AS ENUM ('limpeza','reposicao','enxoval','lavanderia','manutencao','vistoria');
CREATE TYPE public.marocas_service_status AS ENUM ('agendado','em_andamento','concluido','cancelado','atrasado');
CREATE TYPE public.marocas_payment_status AS ENUM ('pendente','pago','atrasado','estornado');
CREATE TYPE public.marocas_payout_status AS ENUM ('previsto','liberado','pago','contestado');
CREATE TYPE public.marocas_maintenance_priority AS ENUM ('baixa','media','alta','urgente');

-- =========================================================
-- OWNERS (proprietários)
-- =========================================================
CREATE TABLE public.marocas_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  pix_key TEXT,
  bank_info JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_owners TO authenticated;
GRANT ALL ON public.marocas_owners TO service_role;
ALTER TABLE public.marocas_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas admins manage owners"
  ON public.marocas_owners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

-- =========================================================
-- APARTMENTS
-- =========================================================
CREATE TABLE public.marocas_apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.marocas_owners(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  building TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  capacity INTEGER DEFAULT 2,
  area_m2 NUMERIC(8,2),
  cover_photo_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  status public.marocas_apartment_status NOT NULL DEFAULT 'disponivel',
  daily_rate NUMERIC(10,2),
  marocas_commission_percent NUMERIC(5,2) DEFAULT 20.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_apartments TO authenticated;
GRANT ALL ON public.marocas_apartments TO service_role;
ALTER TABLE public.marocas_apartments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas apartments visibility"
  ON public.marocas_apartments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.marocas_owners o WHERE o.id = owner_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Marocas admins manage apartments"
  ON public.marocas_apartments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- PROFESSIONALS (camareiras, lavanderia, manutenção)
-- =========================================================
CREATE TABLE public.marocas_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role public.marocas_professional_role NOT NULL,
  phone TEXT,
  email TEXT,
  document TEXT,
  pix_key TEXT,
  hourly_rate NUMERIC(10,2),
  per_service_rate NUMERIC(10,2),
  rating NUMERIC(3,2) DEFAULT 5.00,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_professionals TO authenticated;
GRANT ALL ON public.marocas_professionals TO service_role;
ALTER TABLE public.marocas_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas admins manage professionals"
  ON public.marocas_professionals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

-- =========================================================
-- SERVICES (ordens de serviço: limpeza, reposição, manutenção, vistoria)
-- =========================================================
CREATE TABLE public.marocas_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.marocas_apartments(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.marocas_professionals(id) ON DELETE SET NULL,
  service_type public.marocas_service_type NOT NULL,
  status public.marocas_service_status NOT NULL DEFAULT 'agendado',
  priority public.marocas_maintenance_priority DEFAULT 'media',
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  photos_before JSONB DEFAULT '[]'::jsonb,
  photos_after JSONB DEFAULT '[]'::jsonb,
  cost NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_services TO authenticated;
GRANT ALL ON public.marocas_services TO service_role;
ALTER TABLE public.marocas_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas services visibility"
  ON public.marocas_services FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.marocas_apartments a
      JOIN public.marocas_owners o ON o.id = a.owner_id
      WHERE a.id = apartment_id AND o.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.marocas_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Marocas admins manage services"
  ON public.marocas_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- SUPPLIES / ENXOVAL inventory
-- =========================================================
CREATE TABLE public.marocas_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES public.marocas_apartments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  current_qty INTEGER NOT NULL DEFAULT 0,
  min_qty INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un',
  unit_cost NUMERIC(10,2),
  last_restocked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_supplies TO authenticated;
GRANT ALL ON public.marocas_supplies TO service_role;
ALTER TABLE public.marocas_supplies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas supplies visibility"
  ON public.marocas_supplies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.marocas_apartments a
      JOIN public.marocas_owners o ON o.id = a.owner_id
      WHERE a.id = apartment_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Marocas admins manage supplies"
  ON public.marocas_supplies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- MAINTENANCE REQUESTS (com bidding marketplace)
-- =========================================================
CREATE TABLE public.marocas_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.marocas_apartments(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority public.marocas_maintenance_priority NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'aberto',
  photos JSONB DEFAULT '[]'::jsonb,
  approved_quote_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_maintenance_requests TO authenticated;
GRANT ALL ON public.marocas_maintenance_requests TO service_role;
ALTER TABLE public.marocas_maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas maintenance visibility"
  ON public.marocas_maintenance_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.marocas_apartments a
      JOIN public.marocas_owners o ON o.id = a.owner_id
      WHERE a.id = apartment_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Marocas admins manage maintenance"
  ON public.marocas_maintenance_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.marocas_maintenance_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.marocas_maintenance_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.marocas_professionals(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  estimated_hours NUMERIC(6,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_maintenance_quotes TO authenticated;
GRANT ALL ON public.marocas_maintenance_quotes TO service_role;
ALTER TABLE public.marocas_maintenance_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas quotes visibility"
  ON public.marocas_maintenance_quotes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.marocas_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.marocas_maintenance_requests r
      JOIN public.marocas_apartments a ON a.id = r.apartment_id
      JOIN public.marocas_owners o ON o.id = a.owner_id
      WHERE r.id = request_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Marocas admins manage quotes"
  ON public.marocas_maintenance_quotes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- OWNER FINANCIALS (cobranças, repasses PIX)
-- =========================================================
CREATE TABLE public.marocas_owner_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.marocas_owners(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES public.marocas_apartments(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  gross_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  marocas_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.marocas_payout_status NOT NULL DEFAULT 'previsto',
  pix_txid TEXT,
  paid_at TIMESTAMPTZ,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_owner_statements TO authenticated;
GRANT ALL ON public.marocas_owner_statements TO service_role;
ALTER TABLE public.marocas_owner_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marocas statements visibility"
  ON public.marocas_owner_statements FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.marocas_owners o WHERE o.id = owner_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Marocas admins manage statements"
  ON public.marocas_owner_statements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- TRIGGERS updated_at (reuse public.update_updated_at_column if exists)
-- =========================================================
CREATE OR REPLACE FUNCTION public.marocas_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_marocas_owners_updated BEFORE UPDATE ON public.marocas_owners FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_apartments_updated BEFORE UPDATE ON public.marocas_apartments FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_professionals_updated BEFORE UPDATE ON public.marocas_professionals FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_services_updated BEFORE UPDATE ON public.marocas_services FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_supplies_updated BEFORE UPDATE ON public.marocas_supplies FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_maint_req_updated BEFORE UPDATE ON public.marocas_maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_maint_quotes_updated BEFORE UPDATE ON public.marocas_maintenance_quotes FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();
CREATE TRIGGER trg_marocas_statements_updated BEFORE UPDATE ON public.marocas_owner_statements FOR EACH ROW EXECUTE FUNCTION public.marocas_set_updated_at();

-- =========================================================
-- SEED: Loft Copacabana 811
-- =========================================================
DO $$
DECLARE
  v_owner_id UUID;
  v_apt_id UUID;
  v_prof_camareira UUID;
  v_prof_lavanderia UUID;
  v_prof_manut UUID;
BEGIN
  INSERT INTO public.marocas_owners (full_name, email, phone, pix_key, notes)
  VALUES ('Carlos Eduardo Menezes', 'carlos.menezes@example.com', '+55 21 99876-5432', 'carlos.menezes@example.com', 'Proprietário do Loft Copacabana 811')
  RETURNING id INTO v_owner_id;

  INSERT INTO public.marocas_apartments
    (owner_id, code, title, building, address, city, state, zip, bedrooms, bathrooms, capacity, area_m2, daily_rate, status, amenities, cover_photo_url)
  VALUES
    (v_owner_id, 'COPA-811', 'Loft Copacabana 811', 'Edifício Atlântico Sul',
     'Av. Atlântica, 2000 - apto 811', 'Rio de Janeiro', 'RJ', '22021-001',
     1, 1, 2, 42.5, 480.00, 'disponivel',
     '["wifi 600MB","ar-condicionado","cofre","vista mar","cozinha equipada"]'::jsonb,
     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200')
  RETURNING id INTO v_apt_id;

  INSERT INTO public.marocas_professionals (full_name, role, phone, per_service_rate, rating)
  VALUES ('Dona Marlene Souza', 'camareira', '+55 21 98111-2233', 120.00, 4.95)
  RETURNING id INTO v_prof_camareira;

  INSERT INTO public.marocas_professionals (full_name, role, phone, per_service_rate, rating)
  VALUES ('Lavanderia Copa Express', 'lavanderia', '+55 21 3333-4444', 95.00, 4.80)
  RETURNING id INTO v_prof_lavanderia;

  INSERT INTO public.marocas_professionals (full_name, role, phone, hourly_rate, rating)
  VALUES ('João Reparos 24h', 'manutencao', '+55 21 99222-3344', 85.00, 4.70)
  RETURNING id INTO v_prof_manut;

  -- Supplies / enxoval
  INSERT INTO public.marocas_supplies (apartment_id, category, item_name, current_qty, min_qty, unit, unit_cost) VALUES
    (v_apt_id, 'enxoval', 'Jogo de lençol queen', 4, 3, 'jogo', 220.00),
    (v_apt_id, 'enxoval', 'Toalha de banho', 8, 6, 'un', 65.00),
    (v_apt_id, 'enxoval', 'Toalha de rosto', 8, 6, 'un', 28.00),
    (v_apt_id, 'amenities', 'Shampoo 30ml', 24, 12, 'un', 4.50),
    (v_apt_id, 'amenities', 'Condicionador 30ml', 24, 12, 'un', 4.50),
    (v_apt_id, 'amenities', 'Sabonete 25g', 30, 15, 'un', 2.80),
    (v_apt_id, 'limpeza', 'Detergente neutro', 3, 2, 'un', 8.90),
    (v_apt_id, 'cozinha', 'Cápsula de café', 40, 20, 'un', 2.50);

  -- Serviços agendados / históricos
  INSERT INTO public.marocas_services (apartment_id, professional_id, service_type, status, scheduled_for, completed_at, cost, checklist) VALUES
    (v_apt_id, v_prof_camareira, 'limpeza', 'concluido', now() - interval '7 days', now() - interval '7 days' + interval '2 hours', 120,
      '[{"item":"Trocar roupa de cama","done":true},{"item":"Limpar banheiro","done":true},{"item":"Repor amenities","done":true}]'::jsonb),
    (v_apt_id, v_prof_lavanderia, 'lavanderia', 'concluido', now() - interval '7 days', now() - interval '6 days', 95, '[]'::jsonb),
    (v_apt_id, v_prof_camareira, 'limpeza', 'agendado', now() + interval '2 days', NULL, 120,
      '[{"item":"Check-out 11h","done":false},{"item":"Limpeza completa","done":false},{"item":"Vistoria fotográfica","done":false}]'::jsonb),
    (v_apt_id, v_prof_manut, 'manutencao', 'agendado', now() + interval '5 days', NULL, 170, '[{"item":"Trocar chuveiro elétrico","done":false}]'::jsonb);

  -- Manutenção: pedido + cotações
  WITH req AS (
    INSERT INTO public.marocas_maintenance_requests (apartment_id, title, description, category, priority, status)
    VALUES (v_apt_id, 'Chuveiro com baixa pressão', 'Hóspede relatou pressão fraca no chuveiro principal', 'hidráulica', 'alta', 'aberto')
    RETURNING id
  )
  INSERT INTO public.marocas_maintenance_quotes (request_id, professional_id, amount, estimated_hours, notes)
  SELECT req.id, v_prof_manut, 280.00, 2.5, 'Troca de registro + revisão geral' FROM req;

  -- Statement do mês
  INSERT INTO public.marocas_owner_statements
    (owner_id, apartment_id, reference_month, gross_revenue, marocas_fee, expenses, net_payout, status, breakdown)
  VALUES
    (v_owner_id, v_apt_id, date_trunc('month', now())::date,
     12480.00, 2496.00, 845.00, 9139.00, 'previsto',
     '{"diarias":26,"ocupacao_percent":87,"servicos":[{"tipo":"limpeza","total":480},{"tipo":"lavanderia","total":285},{"tipo":"manutencao","total":80}]}'::jsonb);
END $$;
