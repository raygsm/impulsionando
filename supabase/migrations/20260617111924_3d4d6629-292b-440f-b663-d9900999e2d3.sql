
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS kitchen_status text NOT NULL DEFAULT 'pendente'
    CHECK (kitchen_status IN ('pendente','em_preparo','entregue','cancelado')),
  ADD COLUMN IF NOT EXISTS kitchen_updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS sales_order_items_kitchen_status_idx
  ON public.sales_order_items(company_id, kitchen_status);

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
    WHERE id = v_table.current_session_id AND status = 'aberta';
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_open');
  END IF;

  SELECT * INTO v_item FROM public.restaurant_menu_items
    WHERE id = _item_id AND company_id = v_table.company_id AND is_active AND is_available;
  IF v_item IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'item_unavailable'); END IF;

  v_unit_price := v_item.price_cents / 100.0;
  v_line_total := v_unit_price * _quantity;
  v_order_id := v_session.sales_order_id;

  INSERT INTO public.sales_order_items(order_id, company_id, description, quantity, unit_price, discount, total, kitchen_status)
  VALUES (v_order_id, v_table.company_id,
          v_item.name || COALESCE(' — ' || NULLIF(_notes,''), ''),
          _quantity, v_unit_price, 0, v_line_total, 'pendente');

  UPDATE public.restaurant_table_sessions
    SET total = COALESCE(total, 0) + v_line_total, updated_at = now()
    WHERE id = v_session.id;

  RETURN jsonb_build_object('ok', true, 'line_total', v_line_total, 'new_total', COALESCE(v_session.total,0) + v_line_total);
END; $$;

GRANT EXECUTE ON FUNCTION public.add_table_order_item(text, uuid, numeric, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.restaurant_set_item_status(
  _item_id uuid, _status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_user_company uuid;
BEGIN
  IF _status NOT IN ('pendente','em_preparo','entregue','cancelado') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;
  SELECT company_id INTO v_company FROM public.sales_order_items WHERE id = _item_id;
  IF v_company IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  SELECT company_id INTO v_user_company FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_user_company IS NULL OR v_user_company <> v_company THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  UPDATE public.sales_order_items
    SET kitchen_status = _status, kitchen_updated_at = now()
    WHERE id = _item_id;
  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.restaurant_set_item_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.restaurant_kitchen_board()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_result jsonb;
BEGIN
  SELECT company_id INTO v_company FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_company IS NULL THEN RETURN jsonb_build_object('tables', '[]'::jsonb); END IF;

  SELECT jsonb_build_object(
    'tables', COALESCE(jsonb_agg(t ORDER BY t->>'table_number'), '[]'::jsonb)
  ) INTO v_result FROM (
    SELECT jsonb_build_object(
      'session_id', s.id,
      'table_id', rt.id,
      'table_number', rt.number,
      'table_label', rt.label,
      'customer_name', s.customer_name,
      'party_size', s.party_size,
      'opened_at', s.opened_at,
      'total', s.total,
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', soi.id,
          'description', soi.description,
          'quantity', soi.quantity,
          'total', soi.total,
          'status', soi.kitchen_status,
          'updated_at', soi.kitchen_updated_at
        ) ORDER BY soi.created_at)
        FROM public.sales_order_items soi
        WHERE soi.order_id = s.sales_order_id
          AND soi.kitchen_status IN ('pendente','em_preparo')
      ), '[]'::jsonb)
    ) AS t
    FROM public.restaurant_table_sessions s
    JOIN public.restaurant_tables rt ON rt.id = s.table_id
    WHERE s.company_id = v_company AND s.status = 'aberta'
  ) sub
  WHERE (t->'items') <> '[]'::jsonb;

  RETURN COALESCE(v_result, jsonb_build_object('tables', '[]'::jsonb));
END; $$;

GRANT EXECUTE ON FUNCTION public.restaurant_kitchen_board() TO authenticated;
