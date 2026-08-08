-- Public token for quotes
ALTER TABLE public.riomed_quotes
  ADD COLUMN IF NOT EXISTS public_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_name text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Product-level commission rule key
ALTER TABLE public.riomed_commission_rules
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.riomed_products(id) ON DELETE CASCADE;

-- Allow anon to read a quote when it presents a valid token (token equality in app layer)
GRANT SELECT ON public.riomed_quotes TO anon;
GRANT SELECT ON public.riomed_quote_items TO anon;
GRANT SELECT ON public.riomed_products TO anon;

DROP POLICY IF EXISTS "Public read quote by token" ON public.riomed_quotes;
CREATE POLICY "Public read quote by token" ON public.riomed_quotes FOR SELECT TO anon
  USING (public_token IS NOT NULL);

DROP POLICY IF EXISTS "Public read quote items by token" ON public.riomed_quote_items;
CREATE POLICY "Public read quote items by token" ON public.riomed_quote_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.riomed_quotes q WHERE q.id = quote_id AND q.public_token IS NOT NULL));

-- Hierarchical commission rate lookup
CREATE OR REPLACE FUNCTION public.riomed_get_commission_rate(
  _company_id uuid, _seller_user_id uuid, _product_id uuid, _category text
) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rate numeric;
BEGIN
  -- Product
  SELECT rate_pct INTO v_rate FROM public.riomed_commission_rules
    WHERE company_id = _company_id AND active AND scope = 'product' AND product_id = _product_id
    ORDER BY updated_at DESC LIMIT 1;
  IF v_rate IS NOT NULL THEN RETURN v_rate; END IF;
  -- Category
  SELECT rate_pct INTO v_rate FROM public.riomed_commission_rules
    WHERE company_id = _company_id AND active AND scope = 'category' AND category = _category
    ORDER BY updated_at DESC LIMIT 1;
  IF v_rate IS NOT NULL THEN RETURN v_rate; END IF;
  -- Seller default
  SELECT commission_rate INTO v_rate FROM public.riomed_sellers
    WHERE user_id = _seller_user_id LIMIT 1;
  RETURN COALESCE(v_rate, 0);
END;
$$;

-- Convert a quote into a sales order + commissions + stock movements
CREATE OR REPLACE FUNCTION public.riomed_convert_quote_to_order(_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quote public.riomed_quotes%ROWTYPE;
  v_order_id uuid;
  v_item record;
  v_product record;
  v_seller_user uuid;
  v_warehouse uuid;
  v_rate numeric;
  v_commission numeric;
BEGIN
  SELECT * INTO v_quote FROM public.riomed_quotes WHERE id = _quote_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF v_quote.order_id IS NOT NULL THEN RETURN v_quote.order_id; END IF;

  v_seller_user := v_quote.owner_user_id;

  -- Default warehouse
  SELECT id INTO v_warehouse FROM public.riomed_warehouses
    WHERE company_id = v_quote.company_id AND is_default LIMIT 1;
  IF v_warehouse IS NULL THEN
    SELECT id INTO v_warehouse FROM public.riomed_warehouses
      WHERE company_id = v_quote.company_id AND is_active LIMIT 1;
  END IF;

  -- Create sales order
  INSERT INTO public.sales_orders (
    company_id, status, customer_lead_id, customer_id, customer_name,
    subtotal, discount, total, notes, created_by
  ) VALUES (
    v_quote.company_id, 'confirmed', v_quote.lead_id, v_quote.customer_id,
    COALESCE((SELECT name FROM public.crm_leads WHERE id = v_quote.lead_id), 'Cliente'),
    COALESCE(v_quote.subtotal, 0), COALESCE(v_quote.discount_total, 0),
    COALESCE(v_quote.total, 0), v_quote.notes, v_seller_user
  ) RETURNING id INTO v_order_id;

  -- Copy items, deduct stock, compute commissions
  FOR v_item IN
    SELECT * FROM public.riomed_quote_items WHERE quote_id = _quote_id ORDER BY sort_order
  LOOP
    INSERT INTO public.sales_order_items (
      order_id, company_id, product_id, description, quantity, unit_price, discount, total
    ) VALUES (
      v_order_id, v_quote.company_id, v_item.product_id, v_item.description,
      v_item.qty, v_item.unit_price, COALESCE(v_item.discount, 0), v_item.total
    );

    -- Stock movement (variant-based)
    IF v_item.variant_id IS NOT NULL AND v_warehouse IS NOT NULL THEN
      INSERT INTO public.riomed_stock_movements (
        company_id, variant_id, warehouse_id, kind, qty, reason, ref_table, ref_id
      ) VALUES (
        v_quote.company_id, v_item.variant_id, v_warehouse, 'out',
        v_item.qty::int, 'sale', 'sales_orders', v_order_id
      );
      UPDATE public.riomed_stock_levels
        SET qty_available = GREATEST(qty_available - v_item.qty::int, 0),
            last_movement_at = now()
        WHERE variant_id = v_item.variant_id AND warehouse_id = v_warehouse;
    END IF;

    -- Commission
    SELECT category INTO v_product FROM public.riomed_products WHERE id = v_item.product_id;
    v_rate := public.riomed_get_commission_rate(
      v_quote.company_id, v_seller_user, v_item.product_id,
      COALESCE(v_product.category, '')
    );
    v_commission := ROUND((v_item.total * v_rate / 100.0)::numeric, 2);

    IF v_seller_user IS NOT NULL AND v_commission > 0 THEN
      INSERT INTO public.riomed_commissions (
        company_id, user_id, order_id, base_amount, rate_pct, amount, status, period
      ) VALUES (
        v_quote.company_id, v_seller_user, v_order_id, v_item.total, v_rate, v_commission,
        'pending', to_char(now(), 'YYYY-MM')
      );
    END IF;
  END LOOP;

  -- Link quote → order
  UPDATE public.riomed_quotes
    SET order_id = v_order_id, status = 'converted', won_at = now()
    WHERE id = _quote_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.riomed_convert_quote_to_order(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.riomed_get_commission_rate(uuid, uuid, uuid, text) TO authenticated, service_role;
