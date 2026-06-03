CREATE OR REPLACE FUNCTION public.customer_anonymize(_customer_id uuid, _reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE c RECORD;
BEGIN
  SELECT * INTO c FROM public.customers WHERE id = _customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;

  IF NOT (public.is_super_admin(auth.uid())
          OR public.user_has_permission(auth.uid(), c.company_id, 'customer.anonymize')) THEN
    RAISE EXCEPTION 'Sem permissão para anonimizar clientes';
  END IF;

  IF c.anonymized_at IS NOT NULL THEN RETURN c.id; END IF;

  IF _reason IS NULL OR trim(_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da anonimização é obrigatório';
  END IF;

  UPDATE public.customers SET
    name = 'Cliente Anonimizado #' || substr(replace(id::text,'-',''),1,8),
    email = NULL, phone = NULL, document = NULL,
    birthdate = NULL, gender = NULL,
    address_line = NULL, address_city = NULL, address_state = NULL, address_zip = NULL,
    tags = '{}', notes = NULL, lead_id = NULL, is_active = false,
    anonymized_at = now(), anonymized_by = auth.uid(), anonymization_reason = _reason
  WHERE id = _customer_id;

  UPDATE public.sales_orders
     SET customer_name = 'Cliente Anonimizado', customer_doc = NULL
   WHERE customer_id = _customer_id;

  RETURN _customer_id;
END;
$function$;
