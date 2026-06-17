-- ====== Tables ======
CREATE TABLE public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  number integer NOT NULL,
  label text,
  capacity integer NOT NULL DEFAULT 4,
  area text,
  qr_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64'),
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre','ocupada','reservada','manutencao')),
  current_session_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT ALL ON public.restaurant_tables TO service_role;

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY rt_company_read ON public.restaurant_tables FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_tables.company_id));
CREATE POLICY rt_company_write ON public.restaurant_tables FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_tables.company_id));
CREATE POLICY rt_company_update ON public.restaurant_tables FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_tables.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_tables.company_id));
CREATE POLICY rt_company_delete ON public.restaurant_tables FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_tables.company_id));

-- ====== Sessions / comandas ======
CREATE TABLE public.restaurant_table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  party_size integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','fechando','fechada','cancelada')),
  total numeric(12,2) NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opened_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_table_sessions TO authenticated;
GRANT ALL ON public.restaurant_table_sessions TO service_role;

ALTER TABLE public.restaurant_table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rts_company_read ON public.restaurant_table_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_table_sessions.company_id));
CREATE POLICY rts_company_write ON public.restaurant_table_sessions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_table_sessions.company_id));
CREATE POLICY rts_company_update ON public.restaurant_table_sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_table_sessions.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=restaurant_table_sessions.company_id));

-- FK posterior para evitar referência circular na criação
ALTER TABLE public.restaurant_tables
  ADD CONSTRAINT restaurant_tables_session_fk
  FOREIGN KEY (current_session_id) REFERENCES public.restaurant_table_sessions(id) ON DELETE SET NULL;

CREATE INDEX rt_company_idx ON public.restaurant_tables(company_id, status);
CREATE INDEX rts_company_open_idx ON public.restaurant_table_sessions(company_id, status, opened_at DESC);
CREATE INDEX rts_table_idx ON public.restaurant_table_sessions(table_id, opened_at DESC);

-- ====== Triggers ======
CREATE TRIGGER trg_restaurant_tables_updated BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_restaurant_sessions_updated BEFORE UPDATE ON public.restaurant_table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sincroniza status / current_session_id da mesa
CREATE OR REPLACE FUNCTION public.restaurant_sync_table_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP='INSERT') AND NEW.status='aberta' THEN
    UPDATE public.restaurant_tables SET status='ocupada', current_session_id=NEW.id WHERE id=NEW.table_id;
  ELSIF (TG_OP='UPDATE') AND NEW.status IN ('fechada','cancelada') AND OLD.status<>NEW.status THEN
    UPDATE public.restaurant_tables SET status='livre', current_session_id=NULL WHERE id=NEW.table_id AND current_session_id=NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restaurant_sync_table_status
  AFTER INSERT OR UPDATE ON public.restaurant_table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.restaurant_sync_table_status();

-- ====== Public QR resolver (anon-callable) ======
CREATE OR REPLACE FUNCTION public.resolve_table_qr(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_table record;
  v_session record;
  v_company record;
BEGIN
  SELECT id, company_id, number, label, capacity, area, status, current_session_id
    INTO v_table FROM public.restaurant_tables WHERE qr_token=_token AND is_active=true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  SELECT id, name, trade_name, primary_color, logo_url INTO v_company
    FROM public.companies WHERE id=v_table.company_id;
  IF v_table.current_session_id IS NOT NULL THEN
    SELECT id, customer_name, party_size, total, opened_at, status
      INTO v_session FROM public.restaurant_table_sessions WHERE id=v_table.current_session_id;
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'table', jsonb_build_object(
      'id', v_table.id, 'number', v_table.number, 'label', v_table.label,
      'capacity', v_table.capacity, 'area', v_table.area, 'status', v_table.status),
    'company', jsonb_build_object(
      'id', v_company.id, 'name', COALESCE(v_company.trade_name, v_company.name),
      'primary_color', v_company.primary_color, 'logo_url', v_company.logo_url),
    'session', CASE WHEN v_session.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_session.id, 'customer_name', v_session.customer_name,
      'party_size', v_session.party_size, 'total', v_session.total,
      'opened_at', v_session.opened_at, 'status', v_session.status) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_table_qr(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_table_qr(text) TO anon, authenticated, service_role;

-- ====== Public: registrar check-in do cliente pelo QR ======
CREATE OR REPLACE FUNCTION public.restaurant_table_checkin(_token text, _name text, _phone text, _party integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_table record;
  v_session_id uuid;
BEGIN
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;
  IF _phone IS NULL OR length(regexp_replace(_phone,'\D','','g')) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone');
  END IF;
  SELECT id, company_id, current_session_id INTO v_table
    FROM public.restaurant_tables WHERE qr_token=_token AND is_active=true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_table.current_session_id IS NULL THEN
    INSERT INTO public.restaurant_table_sessions(company_id, table_id, customer_name, customer_phone, party_size, status)
      VALUES (v_table.company_id, v_table.id, _name, _phone, GREATEST(1,_party), 'aberta')
      RETURNING id INTO v_session_id;
  ELSE
    UPDATE public.restaurant_table_sessions
      SET customer_name = COALESCE(NULLIF(customer_name,''), _name),
          customer_phone = COALESCE(NULLIF(customer_phone,''), _phone),
          party_size = GREATEST(party_size, _party)
      WHERE id = v_table.current_session_id
      RETURNING id INTO v_session_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'session_id', v_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.restaurant_table_checkin(text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restaurant_table_checkin(text,text,text,integer) TO anon, authenticated, service_role;