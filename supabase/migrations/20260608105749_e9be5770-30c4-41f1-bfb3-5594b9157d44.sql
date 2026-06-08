
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.realestate_operation AS ENUM ('venda','locacao','venda_ou_locacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.realestate_property_type AS ENUM (
    'apartamento','casa','casa_condominio','terreno','sala_comercial',
    'loja','galpao','sitio','chacara','cobertura','kitnet','studio','outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.realestate_property_status AS ENUM (
    'rascunho','ativo','reservado','vendido','locado','inativo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.realestate_intent_status AS ENUM ('ativo','pausado','atendido','arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLE: realestate_properties ============
CREATE TABLE IF NOT EXISTS public.realestate_properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_code  text,
  title           text NOT NULL,
  description     text,
  operation       public.realestate_operation NOT NULL DEFAULT 'venda',
  property_type   public.realestate_property_type NOT NULL DEFAULT 'apartamento',
  status          public.realestate_property_status NOT NULL DEFAULT 'ativo',
  sale_price      numeric(14,2),
  rent_price      numeric(14,2),
  condo_fee       numeric(14,2),
  iptu            numeric(14,2),
  area_total      numeric(10,2),
  area_useful     numeric(10,2),
  bedrooms        int NOT NULL DEFAULT 0,
  suites          int NOT NULL DEFAULT 0,
  bathrooms       int NOT NULL DEFAULT 0,
  parking_spots   int NOT NULL DEFAULT 0,
  address_line    text,
  neighborhood    text,
  city            text,
  state           text,
  zip             text,
  latitude        numeric(10,7),
  longitude       numeric(10,7),
  features        jsonb NOT NULL DEFAULT '[]'::jsonb,
  photos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  broker_user_id  uuid,
  is_published    boolean NOT NULL DEFAULT true,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realestate_props_company ON public.realestate_properties(company_id);
CREATE INDEX IF NOT EXISTS idx_realestate_props_status ON public.realestate_properties(company_id, status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_realestate_props_city ON public.realestate_properties(company_id, city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_realestate_props_op_type ON public.realestate_properties(company_id, operation, property_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_properties TO authenticated;
GRANT ALL ON public.realestate_properties TO service_role;

ALTER TABLE public.realestate_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate_props_read"
  ON public.realestate_properties FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_props_write"
  ON public.realestate_properties FOR INSERT TO authenticated
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_props_update"
  ON public.realestate_properties FOR UPDATE TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  )
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_props_delete"
  ON public.realestate_properties FOR DELETE TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE TRIGGER trg_realestate_props_updated_at
  BEFORE UPDATE ON public.realestate_properties
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ TABLE: realestate_search_intents ============
CREATE TABLE IF NOT EXISTS public.realestate_search_intents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id         uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  operation       public.realestate_operation NOT NULL DEFAULT 'venda',
  property_types  public.realestate_property_type[] NOT NULL DEFAULT '{}',
  price_min       numeric(14,2),
  price_max       numeric(14,2),
  area_min        numeric(10,2),
  bedrooms_min    int NOT NULL DEFAULT 0,
  bathrooms_min   int NOT NULL DEFAULT 0,
  parking_min     int NOT NULL DEFAULT 0,
  cities          text[] NOT NULL DEFAULT '{}',
  neighborhoods   text[] NOT NULL DEFAULT '{}',
  status          public.realestate_intent_status NOT NULL DEFAULT 'ativo',
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realestate_intents_company ON public.realestate_search_intents(company_id);
CREATE INDEX IF NOT EXISTS idx_realestate_intents_status ON public.realestate_search_intents(company_id, status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_realestate_intents_lead ON public.realestate_search_intents(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_search_intents TO authenticated;
GRANT ALL ON public.realestate_search_intents TO service_role;

ALTER TABLE public.realestate_search_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate_intents_read"
  ON public.realestate_search_intents FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_intents_write"
  ON public.realestate_search_intents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_intents_update"
  ON public.realestate_search_intents FOR UPDATE TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  )
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_intents_delete"
  ON public.realestate_search_intents FOR DELETE TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE TRIGGER trg_realestate_intents_updated_at
  BEFORE UPDATE ON public.realestate_search_intents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ TABLE: realestate_property_matches ============
CREATE TABLE IF NOT EXISTS public.realestate_property_matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id   uuid NOT NULL REFERENCES public.realestate_properties(id) ON DELETE CASCADE,
  intent_id     uuid NOT NULL REFERENCES public.realestate_search_intents(id) ON DELETE CASCADE,
  score         int NOT NULL DEFAULT 100,
  notified_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, intent_id)
);

CREATE INDEX IF NOT EXISTS idx_realestate_matches_company ON public.realestate_property_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_realestate_matches_intent ON public.realestate_property_matches(intent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_property_matches TO authenticated;
GRANT ALL ON public.realestate_property_matches TO service_role;

ALTER TABLE public.realestate_property_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate_matches_read"
  ON public.realestate_property_matches FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_matches_service_write"
  ON public.realestate_property_matches FOR INSERT TO authenticated
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

-- ============ MATCHING ENGINE ============
-- For a property, find intents that match; insert new matches; enqueue messages.
CREATE OR REPLACE FUNCTION public.realestate_run_match_for_property(_property_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  i RECORD;
  v_price numeric(14,2);
  v_inserted int := 0;
BEGIN
  SELECT * INTO p FROM public.realestate_properties WHERE id = _property_id;
  IF NOT FOUND OR p.status <> 'ativo' OR NOT p.is_published THEN
    RETURN 0;
  END IF;

  v_price := CASE WHEN p.operation = 'locacao' THEN p.rent_price ELSE p.sale_price END;

  FOR i IN
    SELECT * FROM public.realestate_search_intents
    WHERE company_id = p.company_id
      AND status = 'ativo'
      AND (operation = p.operation OR operation = 'venda_ou_locacao' OR p.operation = 'venda_ou_locacao')
      AND (cardinality(property_types) = 0 OR p.property_type = ANY(property_types))
      AND (price_min IS NULL OR v_price IS NULL OR v_price >= price_min)
      AND (price_max IS NULL OR v_price IS NULL OR v_price <= price_max)
      AND (area_min IS NULL OR COALESCE(p.area_useful, p.area_total, 0) >= area_min)
      AND p.bedrooms      >= bedrooms_min
      AND p.bathrooms     >= bathrooms_min
      AND p.parking_spots >= parking_min
      AND (cardinality(cities) = 0 OR lower(COALESCE(p.city,'')) = ANY(SELECT lower(c) FROM unnest(cities) c))
      AND (cardinality(neighborhoods) = 0 OR lower(COALESCE(p.neighborhood,'')) = ANY(SELECT lower(n) FROM unnest(neighborhoods) n))
  LOOP
    BEGIN
      INSERT INTO public.realestate_property_matches(company_id, property_id, intent_id)
      VALUES (p.company_id, p.id, i.id);
      v_inserted := v_inserted + 1;

      PERFORM public.enqueue_message(
        'realestate_match_found',
        p.company_id,
        NULL,
        i.contact_email,
        i.contact_phone,
        i.contact_name,
        jsonb_build_object(
          'lead_name', COALESCE(i.contact_name,''),
          'property_title', p.title,
          'property_reference', COALESCE(p.reference_code,''),
          'property_operation', p.operation::text,
          'property_type', p.property_type::text,
          'property_price', COALESCE(to_char(v_price, 'FM999G999G990D00'), 'Sob consulta'),
          'property_bedrooms', p.bedrooms::text,
          'property_bathrooms', p.bathrooms::text,
          'property_parking', p.parking_spots::text,
          'property_area', COALESCE(to_char(COALESCE(p.area_useful, p.area_total), 'FM999G990D00'), '-'),
          'property_neighborhood', COALESCE(p.neighborhood,''),
          'property_city', COALESCE(p.city,''),
          'property_state', COALESCE(p.state,'')
        ),
        ARRAY['whatsapp','email']::text[],
        'realestate_property',
        p.id::text
      );
    EXCEPTION WHEN unique_violation THEN
      -- já notificado antes
      NULL;
    END;
  END LOOP;

  RETURN v_inserted;
END $$;

-- For an intent, find matching properties.
CREATE OR REPLACE FUNCTION public.realestate_run_match_for_intent(_intent_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i RECORD;
  p RECORD;
  v_price numeric(14,2);
  v_inserted int := 0;
BEGIN
  SELECT * INTO i FROM public.realestate_search_intents WHERE id = _intent_id;
  IF NOT FOUND OR i.status <> 'ativo' THEN RETURN 0; END IF;

  FOR p IN
    SELECT * FROM public.realestate_properties
    WHERE company_id = i.company_id
      AND status = 'ativo'
      AND is_published = true
      AND (operation = i.operation OR operation = 'venda_ou_locacao' OR i.operation = 'venda_ou_locacao')
      AND (cardinality(i.property_types) = 0 OR property_type = ANY(i.property_types))
      AND bedrooms >= i.bedrooms_min
      AND bathrooms >= i.bathrooms_min
      AND parking_spots >= i.parking_min
      AND (cardinality(i.cities) = 0 OR lower(COALESCE(city,'')) = ANY(SELECT lower(c) FROM unnest(i.cities) c))
      AND (cardinality(i.neighborhoods) = 0 OR lower(COALESCE(neighborhood,'')) = ANY(SELECT lower(n) FROM unnest(i.neighborhoods) n))
  LOOP
    v_price := CASE WHEN p.operation = 'locacao' THEN p.rent_price ELSE p.sale_price END;
    CONTINUE WHEN i.price_min IS NOT NULL AND v_price IS NOT NULL AND v_price < i.price_min;
    CONTINUE WHEN i.price_max IS NOT NULL AND v_price IS NOT NULL AND v_price > i.price_max;
    CONTINUE WHEN i.area_min IS NOT NULL AND COALESCE(p.area_useful, p.area_total, 0) < i.area_min;

    BEGIN
      INSERT INTO public.realestate_property_matches(company_id, property_id, intent_id)
      VALUES (i.company_id, p.id, i.id);
      v_inserted := v_inserted + 1;

      PERFORM public.enqueue_message(
        'realestate_match_found',
        i.company_id,
        NULL,
        i.contact_email,
        i.contact_phone,
        i.contact_name,
        jsonb_build_object(
          'lead_name', COALESCE(i.contact_name,''),
          'property_title', p.title,
          'property_reference', COALESCE(p.reference_code,''),
          'property_operation', p.operation::text,
          'property_type', p.property_type::text,
          'property_price', COALESCE(to_char(v_price, 'FM999G999G990D00'), 'Sob consulta'),
          'property_bedrooms', p.bedrooms::text,
          'property_bathrooms', p.bathrooms::text,
          'property_parking', p.parking_spots::text,
          'property_area', COALESCE(to_char(COALESCE(p.area_useful, p.area_total), 'FM999G990D00'), '-'),
          'property_neighborhood', COALESCE(p.neighborhood,''),
          'property_city', COALESCE(p.city,''),
          'property_state', COALESCE(p.state,'')
        ),
        ARRAY['whatsapp','email']::text[],
        'realestate_property',
        p.id::text
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  RETURN v_inserted;
END $$;

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.tg_realestate_property_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativo' AND NEW.is_published = true THEN
    PERFORM public.realestate_run_match_for_property(NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_realestate_property_match_ins ON public.realestate_properties;
CREATE TRIGGER trg_realestate_property_match_ins
  AFTER INSERT ON public.realestate_properties
  FOR EACH ROW EXECUTE FUNCTION public.tg_realestate_property_match();

DROP TRIGGER IF EXISTS trg_realestate_property_match_upd ON public.realestate_properties;
CREATE TRIGGER trg_realestate_property_match_upd
  AFTER UPDATE ON public.realestate_properties
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.is_published IS DISTINCT FROM NEW.is_published
    OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
    OR OLD.rent_price IS DISTINCT FROM NEW.rent_price
    OR OLD.property_type IS DISTINCT FROM NEW.property_type
    OR OLD.operation IS DISTINCT FROM NEW.operation
    OR OLD.city IS DISTINCT FROM NEW.city
    OR OLD.neighborhood IS DISTINCT FROM NEW.neighborhood
  )
  EXECUTE FUNCTION public.tg_realestate_property_match();

CREATE OR REPLACE FUNCTION public.tg_realestate_intent_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativo' THEN
    PERFORM public.realestate_run_match_for_intent(NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_realestate_intent_match_ins ON public.realestate_search_intents;
CREATE TRIGGER trg_realestate_intent_match_ins
  AFTER INSERT ON public.realestate_search_intents
  FOR EACH ROW EXECUTE FUNCTION public.tg_realestate_intent_match();

DROP TRIGGER IF EXISTS trg_realestate_intent_match_upd ON public.realestate_search_intents;
CREATE TRIGGER trg_realestate_intent_match_upd
  AFTER UPDATE ON public.realestate_search_intents
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.tg_realestate_intent_match();

-- ============ DEFAULT MESSAGE TEMPLATES ============
INSERT INTO public.message_templates(event_code, channel, subject, body, is_active)
SELECT 'realestate_match_found', 'whatsapp', NULL,
  E'Olá {{lead_name}}! 🏠\n\nEncontramos um imóvel que combina com sua busca:\n\n*{{property_title}}*\n📍 {{property_neighborhood}}, {{property_city}}/{{property_state}}\n🛏️ {{property_bedrooms}} quartos • 🚿 {{property_bathrooms}} banh • 🚗 {{property_parking}} vagas\n📐 {{property_area}} m²\n💰 R$ {{property_price}}\n\nQuer agendar uma visita? Responda esta mensagem.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_templates
  WHERE event_code = 'realestate_match_found' AND channel = 'whatsapp' AND company_id IS NULL
);

INSERT INTO public.message_templates(event_code, channel, subject, body, is_active)
SELECT 'realestate_match_found', 'email',
  'Novo imóvel que combina com sua busca: {{property_title}}',
  E'<p>Olá {{lead_name}},</p><p>Encontramos um imóvel que combina com sua busca:</p><h3>{{property_title}}</h3><p><strong>Localização:</strong> {{property_neighborhood}}, {{property_city}}/{{property_state}}<br/><strong>Quartos:</strong> {{property_bedrooms}} • <strong>Banheiros:</strong> {{property_bathrooms}} • <strong>Vagas:</strong> {{property_parking}}<br/><strong>Área:</strong> {{property_area}} m²<br/><strong>Valor:</strong> R$ {{property_price}}</p><p>Responda este e-mail para agendar uma visita.</p>',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_templates
  WHERE event_code = 'realestate_match_found' AND channel = 'email' AND company_id IS NULL
);
