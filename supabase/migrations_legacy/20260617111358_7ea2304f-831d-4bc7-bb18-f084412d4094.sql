
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

  INSERT INTO public.sales_order_items(order_id, company_id, description, quantity, unit_price, discount, total)
  VALUES (v_order_id, v_table.company_id,
          v_item.name || COALESCE(' — ' || NULLIF(_notes,''), ''),
          _quantity, v_unit_price, 0, v_line_total);

  UPDATE public.restaurant_table_sessions
    SET total = COALESCE(total, 0) + v_line_total, updated_at = now()
    WHERE id = v_session.id;

  RETURN jsonb_build_object('ok', true, 'line_total', v_line_total, 'new_total', COALESCE(v_session.total,0) + v_line_total);
END; $$;
