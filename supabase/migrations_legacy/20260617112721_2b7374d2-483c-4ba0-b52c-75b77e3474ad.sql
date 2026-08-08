
ALTER TABLE public.restaurant_table_sessions
  ADD COLUMN IF NOT EXISTS customer_email text;

CREATE OR REPLACE FUNCTION public.restaurant_table_checkin(
  _token text, _name text, _phone text DEFAULT NULL, _party_size int DEFAULT 1, _email text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_table public.restaurant_tables;
  v_session public.restaurant_table_sessions;
BEGIN
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;
  SELECT * INTO v_table FROM public.restaurant_tables WHERE qr_token = _token AND is_active = true;
  IF v_table IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'table_not_found'); END IF;
  SELECT * INTO v_session FROM public.restaurant_table_sessions
    WHERE id = v_table.current_session_id AND status = 'aberta';
  IF v_session IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_open'); END IF;

  UPDATE public.restaurant_table_sessions
    SET customer_name  = COALESCE(NULLIF(trim(_name),  ''), customer_name),
        customer_phone = COALESCE(NULLIF(trim(_phone), ''), customer_phone),
        customer_email = COALESCE(NULLIF(lower(trim(_email)), ''), customer_email),
        party_size     = COALESCE(_party_size, party_size),
        updated_at     = now()
    WHERE id = v_session.id;

  RETURN jsonb_build_object('ok', true, 'session_id', v_session.id);
END; $$;

GRANT EXECUTE ON FUNCTION public.restaurant_table_checkin(text, text, text, int, text) TO anon, authenticated;
