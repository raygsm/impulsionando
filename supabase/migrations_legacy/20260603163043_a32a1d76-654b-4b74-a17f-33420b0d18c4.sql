
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  birthdate date,
  gender text,
  address_line text,
  address_city text,
  address_state text,
  address_zip text,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_unit ON public.customers(unit_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(company_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_document ON public.customers(company_id, document) WHERE document IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(company_id, email) WHERE email IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'customer.read'));
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'customer.write'));
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'customer.write'))
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'customer.write'));
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'customer.delete'));

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.agenda_appointments ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_customer ON public.agenda_appointments(customer_id) WHERE customer_id IS NOT NULL;

INSERT INTO public.permissions (code, description, module) VALUES
  ('customer.read', 'Visualizar clientes', 'customers'),
  ('customer.write', 'Criar e editar clientes', 'customers'),
  ('customer.delete', 'Excluir clientes', 'customers')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE perm.code IN ('customer.read','customer.write','customer.delete')
  AND p.slug IN ('admin-impulsionando','admin-unidade','gestor-empresa')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE perm.code IN ('customer.read','customer.write')
  AND p.slug IN ('recepcao','operador','financeiro','profissional')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE perm.code = 'customer.read'
  AND p.slug IN ('auditor','suporte-impulsionando')
ON CONFLICT DO NOTHING;
