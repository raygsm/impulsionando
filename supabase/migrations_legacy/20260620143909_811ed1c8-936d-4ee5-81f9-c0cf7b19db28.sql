CREATE OR REPLACE FUNCTION public.get_owner_portal_data(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner public.realestate_owners%ROWTYPE;
  v_props jsonb;
BEGIN
  SELECT * INTO v_owner FROM public.realestate_owners WHERE portal_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  UPDATE public.realestate_owners SET portal_last_login_at = now() WHERE id = v_owner.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'status', p.status,
    'price', p.price,
    'address', p.address,
    'city', p.city,
    'state', p.state,
    'bedrooms', p.bedrooms,
    'bathrooms', p.bathrooms,
    'area', p.area,
    'created_at', p.created_at
  ) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO v_props
  FROM public.realestate_properties p
  WHERE p.owner_id = v_owner.id;

  RETURN jsonb_build_object(
    'owner', jsonb_build_object(
      'full_name', v_owner.full_name,
      'email', v_owner.email,
      'phone', v_owner.phone,
      'document', v_owner.document,
      'status', v_owner.status
    ),
    'properties', v_props
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_portal_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_portal_data(uuid) TO anon, authenticated;