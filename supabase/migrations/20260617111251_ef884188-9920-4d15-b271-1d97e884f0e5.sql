
-- Cardápio digital para mesas com QR Code
CREATE TABLE public.restaurant_menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_menu_categories TO authenticated;
GRANT ALL ON public.restaurant_menu_categories TO service_role;
ALTER TABLE public.restaurant_menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rmc_company" ON public.restaurant_menu_categories FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()))
  WITH CHECK (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()));

CREATE TABLE public.restaurant_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.restaurant_menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_menu_items TO authenticated;
GRANT ALL ON public.restaurant_menu_items TO service_role;
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rmi_company" ON public.restaurant_menu_items FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()))
  WITH CHECK (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()));

CREATE TRIGGER rmc_touch BEFORE UPDATE ON public.restaurant_menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER rmi_touch BEFORE UPDATE ON public.restaurant_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RPC público: cardápio da mesa (apenas itens ativos/disponíveis)
CREATE OR REPLACE FUNCTION public.get_table_menu(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_result jsonb;
BEGIN
  SELECT company_id INTO v_company_id FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_company_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;

  SELECT jsonb_build_object(
    'ok', true,
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'sort_order', c.sort_order,
        'items', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', i.id, 'name', i.name, 'description', i.description,
            'price_cents', i.price_cents, 'image_url', i.image_url
          ) ORDER BY i.sort_order, i.name)
          FROM public.restaurant_menu_items i
          WHERE i.category_id = c.id AND i.is_active AND i.is_available
        ), '[]'::jsonb)
      ) ORDER BY c.sort_order, c.name)
      FROM public.restaurant_menu_categories c
      WHERE c.company_id = v_company_id AND c.is_active
    ), '[]'::jsonb),
    'uncategorized', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.name, 'description', i.description,
        'price_cents', i.price_cents, 'image_url', i.image_url
      ) ORDER BY i.sort_order, i.name)
      FROM public.restaurant_menu_items i
      WHERE i.company_id = v_company_id AND i.category_id IS NULL AND i.is_active AND i.is_available
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_table_menu(text) TO anon, authenticated;

-- RPC público: adicionar item à comanda (sessão precisa estar aberta)
CREATE OR REPLACE FUNCTION public.add_table_order_item(
  _token text, _item_id uuid, _quantity numeric DEFAULT 1, _notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
  v_item public.restaurant_menu_items;
  v_order_id uuid;
  v_unit_price numeric;
  v_line_total numeric;
BEGIN
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 50 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_quantity');
  END IF;

  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;

  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id AND status = 'open';
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_open');
  END IF;

  SELECT * INTO v_item FROM public.restaurant_menu_items
    WHERE id = _item_id AND company_id = v_table.company_id AND is_active AND is_available;
  IF v_item IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'item_unavailable'); END IF;

  v_unit_price := v_item.price_cents / 100.0;
  v_line_total := v_unit_price * _quantity;
  v_order_id := v_session.sales_order_id;

  INSERT INTO public.sales_order_items(order_id, company_id, description, quantity, unit_price, discount, total)
  VALUES (v_order_id, v_table.company_id,
          v_item.name || COALESCE(' — ' || NULLIF(_notes,''), ''),
          _quantity, v_unit_price, 0, v_line_total);

  UPDATE public.restaurant_table_sessions
    SET total = COALESCE(total, 0) + v_line_total, updated_at = now()
    WHERE id = v_session.id;

  RETURN jsonb_build_object('ok', true, 'line_total', v_line_total, 'new_total', COALESCE(v_session.total,0) + v_line_total);
END; $$;
GRANT EXECUTE ON FUNCTION public.add_table_order_item(text, uuid, numeric, text) TO anon, authenticated;
