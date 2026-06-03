ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz,
  ADD COLUMN IF NOT EXISTS anonymized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS anonymization_reason text;

CREATE INDEX IF NOT EXISTS idx_customers_anonymized
  ON public.customers(company_id) WHERE anonymized_at IS NOT NULL;

INSERT INTO public.permissions (code, module, description)
VALUES ('customer.anonymize', 'customers',
        'Permite executar o direito ao esquecimento removendo dados pessoais do cliente, preservando histórico transacional')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profiles p
CROSS JOIN public.permissions perm
WHERE perm.code = 'customer.anonymize'
  AND (p.slug IN ('admin', 'gestor') OR p.is_master_profile = true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.customer_anonymize(_customer_id uuid, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c RECORD;
BEGIN
  SELECT * INTO c FROM public.customers WHERE id = _customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;

  IF NOT (public.is_super_admin(auth.uid())
          OR public.user_has_permission(auth.uid(), c.company_id, 'customer.anonymize')) THEN
    RAISE EXCEPTION 'Sem permissão para anonimizar clientes';
  END IF;

  IF c.anonymized_at IS NOT NULL THEN RETURN c.id; END IF;

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
$$;

REVOKE ALL ON FUNCTION public.customer_anonymize(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.customer_anonymize(uuid, text) TO authenticated;