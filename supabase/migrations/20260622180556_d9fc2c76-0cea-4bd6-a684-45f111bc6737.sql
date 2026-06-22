
-- ============ Cotações RioMed ============
CREATE TABLE public.riomed_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('web','whatsapp','b2b','phone','field')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','negotiating','won','lost','expired','cancelled')),
  currency text NOT NULL DEFAULT 'BOB',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  expires_at timestamptz,
  sent_at timestamptz,
  won_at timestamptz,
  lost_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_quotes TO authenticated;
GRANT ALL ON public.riomed_quotes TO service_role;
ALTER TABLE public.riomed_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY rq_company_rw ON public.riomed_quotes
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_quotes.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_quotes.company_id)
  );

CREATE INDEX riomed_quotes_company_status_idx ON public.riomed_quotes(company_id, status, created_at DESC);
CREATE INDEX riomed_quotes_owner_idx ON public.riomed_quotes(owner_user_id);
CREATE INDEX riomed_quotes_lead_idx ON public.riomed_quotes(lead_id);

CREATE TRIGGER trg_riomed_quotes_updated_at
  BEFORE UPDATE ON public.riomed_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Itens de cotação ============
CREATE TABLE public.riomed_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES public.riomed_quotes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id),
  variant_id uuid REFERENCES public.riomed_product_variants(id),
  description text NOT NULL,
  qty numeric(14,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_quote_items TO authenticated;
GRANT ALL ON public.riomed_quote_items TO service_role;
ALTER TABLE public.riomed_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY rqi_company_rw ON public.riomed_quote_items
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_quote_items.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_quote_items.company_id)
  );

CREATE INDEX riomed_quote_items_quote_idx ON public.riomed_quote_items(quote_id);

-- ============ Regras de roteamento de leads ============
CREATE TABLE public.riomed_lead_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text,
  category text,
  audience text,
  seller_user_ids uuid[] NOT NULL DEFAULT '{}',
  strategy text NOT NULL DEFAULT 'round_robin' CHECK (strategy IN ('round_robin','least_busy','first_available')),
  priority int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  cursor int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_lead_routing_rules TO authenticated;
GRANT ALL ON public.riomed_lead_routing_rules TO service_role;
ALTER TABLE public.riomed_lead_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY rlrr_company_rw ON public.riomed_lead_routing_rules
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_lead_routing_rules.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_lead_routing_rules.company_id)
  );

CREATE TRIGGER trg_riomed_routing_updated_at
  BEFORE UPDATE ON public.riomed_lead_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Recalcula totais da cotação ============
CREATE OR REPLACE FUNCTION public.riomed_quote_recalc(p_quote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sub numeric; v_disc numeric;
BEGIN
  SELECT COALESCE(SUM(qty * unit_price),0), COALESCE(SUM(discount),0)
    INTO v_sub, v_disc
  FROM public.riomed_quote_items WHERE quote_id = p_quote_id;
  UPDATE public.riomed_quotes
    SET subtotal = v_sub, discount_total = v_disc, total = GREATEST(v_sub - v_disc, 0)
    WHERE id = p_quote_id;
END $$;

-- Atualiza total da linha + reagrega o cabeçalho
CREATE OR REPLACE FUNCTION public.riomed_quote_item_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.riomed_quote_recalc(OLD.quote_id);
    RETURN OLD;
  END IF;
  NEW.total := GREATEST(NEW.qty * NEW.unit_price - COALESCE(NEW.discount,0), 0);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_riomed_quote_item_total
  BEFORE INSERT OR UPDATE ON public.riomed_quote_items
  FOR EACH ROW EXECUTE FUNCTION public.riomed_quote_item_sync();

CREATE OR REPLACE FUNCTION public.riomed_quote_item_after()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.riomed_quote_recalc(COALESCE(NEW.quote_id, OLD.quote_id));
  RETURN NULL;
END $$;

CREATE TRIGGER trg_riomed_quote_item_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.riomed_quote_items
  FOR EACH ROW EXECUTE FUNCTION public.riomed_quote_item_after();

-- ============ Confirma cotação → cria sales_order + baixa estoque ============
CREATE OR REPLACE FUNCTION public.riomed_quote_confirm(p_quote_id uuid, p_user_id uuid, p_warehouse_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quote public.riomed_quotes%ROWTYPE;
  v_order_id uuid;
  v_wh uuid;
  v_item RECORD;
  v_default_variant uuid;
BEGIN
  SELECT * INTO v_quote FROM public.riomed_quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotação não encontrada'; END IF;
  IF v_quote.status = 'won' AND v_quote.order_id IS NOT NULL THEN RETURN v_quote.order_id; END IF;
  IF v_quote.status IN ('lost','cancelled','expired') THEN
    RAISE EXCEPTION 'Cotação não pode ser confirmada no status %', v_quote.status;
  END IF;

  v_wh := p_warehouse_id;
  IF v_wh IS NULL THEN
    SELECT id INTO v_wh FROM public.riomed_warehouses
      WHERE company_id = v_quote.company_id AND is_default = true LIMIT 1;
  END IF;
  IF v_wh IS NULL THEN RAISE EXCEPTION 'Almoxarifado padrão não encontrado'; END IF;

  -- Cria sales_order
  INSERT INTO public.sales_orders (company_id, customer_id, status, total, created_at)
  VALUES (v_quote.company_id, v_quote.customer_id, 'confirmed', v_quote.total, now())
  RETURNING id INTO v_order_id;

  -- Cria itens + baixa estoque
  FOR v_item IN
    SELECT qi.*, COALESCE(qi.variant_id,
      (SELECT id FROM public.riomed_product_variants WHERE product_id = qi.product_id AND is_default = true LIMIT 1)
    ) AS resolved_variant
    FROM public.riomed_quote_items qi WHERE qi.quote_id = p_quote_id
  LOOP
    INSERT INTO public.sales_order_items (order_id, company_id, product_id, description, quantity, unit_price, discount, total)
    VALUES (v_order_id, v_quote.company_id, v_item.product_id, v_item.description,
            v_item.qty, v_item.unit_price, v_item.discount, v_item.total);

    IF v_item.resolved_variant IS NOT NULL THEN
      INSERT INTO public.riomed_stock_movements
        (company_id, variant_id, warehouse_id, kind, qty, reason, ref_table, ref_id, performed_by, metadata)
      VALUES
        (v_quote.company_id, v_item.resolved_variant, v_wh, 'out', CEIL(v_item.qty)::int,
         'quote_confirm', 'riomed_quotes', p_quote_id, p_user_id,
         jsonb_build_object('order_id', v_order_id, 'quote_id', p_quote_id));

      UPDATE public.riomed_stock_levels
        SET on_hand = on_hand - CEIL(v_item.qty)::int, updated_at = now()
        WHERE company_id = v_quote.company_id AND variant_id = v_item.resolved_variant AND warehouse_id = v_wh;
    END IF;
  END LOOP;

  UPDATE public.riomed_quotes
    SET status = 'won', won_at = now(), order_id = v_order_id, updated_at = now()
    WHERE id = p_quote_id;

  -- Se ligado a uma opportunity, marca won
  IF v_quote.opportunity_id IS NOT NULL THEN
    UPDATE public.crm_opportunities
      SET status = 'won', closed_at = now(), value = v_quote.total, updated_at = now()
      WHERE id = v_quote.opportunity_id;
  END IF;

  RETURN v_order_id;
END $$;

-- ============ Roteamento round-robin ============
CREATE OR REPLACE FUNCTION public.riomed_lead_assign(p_lead_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lead public.crm_leads%ROWTYPE;
  v_rule RECORD;
  v_owner uuid;
  v_idx int;
BEGIN
  SELECT * INTO v_lead FROM public.crm_leads WHERE id = p_lead_id;
  IF NOT FOUND OR v_lead.owner_user_id IS NOT NULL THEN
    RETURN v_lead.owner_user_id;
  END IF;

  SELECT * INTO v_rule FROM public.riomed_lead_routing_rules
    WHERE company_id = v_lead.company_id AND is_active = true
      AND (channel IS NULL OR channel = v_lead.source)
      AND array_length(seller_user_ids,1) > 0
    ORDER BY priority ASC, created_at ASC LIMIT 1
    FOR UPDATE;

  IF NOT FOUND THEN RETURN NULL; END IF;
  v_idx := (v_rule.cursor % array_length(v_rule.seller_user_ids, 1)) + 1;
  v_owner := v_rule.seller_user_ids[v_idx];

  UPDATE public.riomed_lead_routing_rules SET cursor = v_rule.cursor + 1 WHERE id = v_rule.id;
  UPDATE public.crm_leads SET owner_user_id = v_owner, updated_at = now() WHERE id = p_lead_id;
  RETURN v_owner;
END $$;
