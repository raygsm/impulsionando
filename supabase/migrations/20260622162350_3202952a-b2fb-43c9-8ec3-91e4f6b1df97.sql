CREATE TABLE public.riomed_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  category text,
  audiences text[] NOT NULL DEFAULT ARRAY['paciente']::text[],
  modality text NOT NULL DEFAULT 'venta' CHECK (modality IN ('venta','alquiler','ambos')),
  price_sale numeric(12,2),
  price_rental_daily numeric(12,2),
  price_rental_monthly numeric(12,2),
  currency text NOT NULL DEFAULT 'BOB',
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX riomed_products_company_idx ON public.riomed_products(company_id);
CREATE INDEX riomed_products_audiences_idx ON public.riomed_products USING gin(audiences);
CREATE INDEX riomed_products_active_idx ON public.riomed_products(company_id, is_active);

GRANT SELECT ON public.riomed_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_products TO authenticated;
GRANT ALL ON public.riomed_products TO service_role;

ALTER TABLE public.riomed_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active riomed products"
  ON public.riomed_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage riomed products"
  ON public.riomed_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER riomed_products_set_updated_at
BEFORE UPDATE ON public.riomed_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_riomed_assistant_catalog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_paciente jsonb; v_clinica jsonb; v_hospital jsonb;
BEGIN
  v_company_id := COALESCE(NEW.company_id, OLD.company_id);

  SELECT jsonb_agg(item ORDER BY ord, nm) FROM (
    SELECT jsonb_build_object('sku',sku,'name',name,'category',category,'modality',modality,
      'price_sale',price_sale,'price_rental_daily',price_rental_daily,
      'price_rental_monthly',price_rental_monthly,'currency',currency,
      'image_url',image_url,'stock',stock) AS item, display_order AS ord, name AS nm
    FROM public.riomed_products
    WHERE company_id=v_company_id AND is_active=true AND stock>0 AND 'paciente'=ANY(audiences)
  ) s INTO v_paciente;

  SELECT jsonb_agg(item ORDER BY ord, nm) FROM (
    SELECT jsonb_build_object('sku',sku,'name',name,'category',category,'modality',modality,
      'price_sale',price_sale,'price_rental_daily',price_rental_daily,
      'price_rental_monthly',price_rental_monthly,'currency',currency,
      'image_url',image_url,'stock',stock) AS item, display_order AS ord, name AS nm
    FROM public.riomed_products
    WHERE company_id=v_company_id AND is_active=true AND stock>0 AND 'clinica'=ANY(audiences)
  ) s INTO v_clinica;

  SELECT jsonb_agg(item ORDER BY ord, nm) FROM (
    SELECT jsonb_build_object('sku',sku,'name',name,'category',category,'modality',modality,
      'price_sale',price_sale,'price_rental_daily',price_rental_daily,
      'price_rental_monthly',price_rental_monthly,'currency',currency,
      'image_url',image_url,'stock',stock) AS item, display_order AS ord, name AS nm
    FROM public.riomed_products
    WHERE company_id=v_company_id AND is_active=true AND stock>0 AND 'hospital'=ANY(audiences)
  ) s INTO v_hospital;

  UPDATE public.core_tenant_identity
  SET metadata = jsonb_set(
        jsonb_set(
          jsonb_set(COALESCE(metadata,'{}'::jsonb),
            '{ai_assistant,audiences,paciente,allowed_catalog}', COALESCE(v_paciente,'[]'::jsonb), true),
          '{ai_assistant,audiences,clinica,allowed_catalog}', COALESCE(v_clinica,'[]'::jsonb), true),
        '{ai_assistant,audiences,hospital,allowed_catalog}', COALESCE(v_hospital,'[]'::jsonb), true),
      updated_at = now()
  WHERE company_id = v_company_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER riomed_products_sync_catalog
AFTER INSERT OR UPDATE OR DELETE ON public.riomed_products
FOR EACH ROW EXECUTE FUNCTION public.sync_riomed_assistant_catalog();

INSERT INTO public.core_admin_menu (
  vertente, group_key, group_label, group_order,
  item_key, item_label, item_order,
  route, icon, required_role, enabled
) VALUES (
  'clientes', 'diretorio', 'Diretório', 50,
  'riomed_products', 'RioMed · Produtos', 51,
  '/admin/clientes/riomed/produtos', 'package', 'admin', true
)
ON CONFLICT DO NOTHING;