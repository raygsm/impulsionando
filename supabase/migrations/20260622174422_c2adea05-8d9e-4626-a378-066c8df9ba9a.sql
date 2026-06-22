
-- =====================================================================
-- ONDA 2 — Catálogo profissional Rio Med
-- =====================================================================

-- 1) Almoxarifados ------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'main',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code),
  CONSTRAINT rwh_kind_chk CHECK (kind IN ('main','branch','rental','transit','consignment','virtual'))
);

CREATE INDEX IF NOT EXISTS rwh_company_idx ON public.riomed_warehouses (company_id) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_warehouses TO authenticated;
GRANT ALL ON public.riomed_warehouses TO service_role;

ALTER TABLE public.riomed_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY rwh_company_rw ON public.riomed_warehouses
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_warehouses.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_warehouses.company_id)
  );


-- 2) Variantes ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku text NOT NULL,
  barcode text,
  name text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight_kg numeric(10,3),
  length_cm numeric(10,2),
  width_cm numeric(10,2),
  height_cm numeric(10,2),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);

CREATE INDEX IF NOT EXISTS rpv_product_idx ON public.riomed_product_variants (product_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS rpv_barcode_idx ON public.riomed_product_variants (company_id, barcode) WHERE barcode IS NOT NULL;

-- Garante apenas 1 variante default por produto
CREATE UNIQUE INDEX IF NOT EXISTS rpv_one_default_idx
  ON public.riomed_product_variants (product_id) WHERE is_default;

GRANT SELECT ON public.riomed_product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_product_variants TO authenticated;
GRANT ALL ON public.riomed_product_variants TO service_role;

ALTER TABLE public.riomed_product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY rpv_public_read ON public.riomed_product_variants
  FOR SELECT TO anon
  USING (is_active);

CREATE POLICY rpv_company_rw ON public.riomed_product_variants
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_product_variants.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_product_variants.company_id)
  );


-- 3) Estoque por variante × almoxarifado --------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.riomed_product_variants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.riomed_warehouses(id) ON DELETE CASCADE,
  qty_available int NOT NULL DEFAULT 0,
  qty_reserved int NOT NULL DEFAULT 0,
  qty_rented int NOT NULL DEFAULT 0,
  qty_min int NOT NULL DEFAULT 0,
  location text,
  last_movement_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS rsl_company_idx ON public.riomed_stock_levels (company_id, variant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_stock_levels TO authenticated;
GRANT ALL ON public.riomed_stock_levels TO service_role;

ALTER TABLE public.riomed_stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY rsl_company_rw ON public.riomed_stock_levels
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stock_levels.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stock_levels.company_id)
  );


-- 4) Movimentações de estoque ------------------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.riomed_product_variants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.riomed_warehouses(id) ON DELETE CASCADE,
  kind text NOT NULL,
  qty int NOT NULL,
  reason text,
  ref_table text,
  ref_id uuid,
  performed_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsm_kind_chk CHECK (kind IN ('in','out','transfer_in','transfer_out','adjust','rent_out','rent_back','reserve','release','import'))
);

CREATE INDEX IF NOT EXISTS rsm_company_idx ON public.riomed_stock_movements (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rsm_variant_idx ON public.riomed_stock_movements (variant_id, created_at DESC);

GRANT SELECT, INSERT ON public.riomed_stock_movements TO authenticated;
GRANT ALL ON public.riomed_stock_movements TO service_role;

ALTER TABLE public.riomed_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY rsm_company_read ON public.riomed_stock_movements
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stock_movements.company_id)
  );

CREATE POLICY rsm_company_insert ON public.riomed_stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stock_movements.company_id)
  );


-- 5) Listas de preço ---------------------------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  audience text NOT NULL DEFAULT 'public',
  currency text NOT NULL DEFAULT 'BOB',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code),
  CONSTRAINT rpl_audience_chk CHECK (audience IN ('public','b2b','hospital','clinic','patient','rental','campaign'))
);

GRANT SELECT ON public.riomed_price_lists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_price_lists TO authenticated;
GRANT ALL ON public.riomed_price_lists TO service_role;

ALTER TABLE public.riomed_price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY rpl_public_read ON public.riomed_price_lists
  FOR SELECT TO anon
  USING (is_active AND audience = 'public');

CREATE POLICY rpl_company_rw ON public.riomed_price_lists
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_price_lists.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_price_lists.company_id)
  );


CREATE TABLE IF NOT EXISTS public.riomed_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  price_list_id uuid NOT NULL REFERENCES public.riomed_price_lists(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.riomed_product_variants(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL,
  price_compare numeric(14,2),
  max_discount_pct numeric(5,2) DEFAULT 0,
  min_qty int DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (price_list_id, variant_id)
);

CREATE INDEX IF NOT EXISTS rp_variant_idx ON public.riomed_prices (variant_id) WHERE is_active;

GRANT SELECT ON public.riomed_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_prices TO authenticated;
GRANT ALL ON public.riomed_prices TO service_role;

ALTER TABLE public.riomed_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY rp_public_read ON public.riomed_prices
  FOR SELECT TO anon
  USING (
    is_active AND EXISTS (
      SELECT 1 FROM public.riomed_price_lists pl
      WHERE pl.id = riomed_prices.price_list_id AND pl.is_active AND pl.audience = 'public'
    )
  );

CREATE POLICY rp_company_rw ON public.riomed_prices
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_prices.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_prices.company_id)
  );


-- 6) Importações inteligentes ------------------------------------------

CREATE TABLE IF NOT EXISTS public.riomed_import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text,
  entity text NOT NULL DEFAULT 'product',
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_import_mappings TO authenticated;
GRANT ALL ON public.riomed_import_mappings TO service_role;

ALTER TABLE public.riomed_import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY rim_company_rw ON public.riomed_import_mappings
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_import_mappings.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_import_mappings.company_id)
  );


CREATE TABLE IF NOT EXISTS public.riomed_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity text NOT NULL DEFAULT 'product',
  source_file text,
  source_label text,
  mapping_id uuid REFERENCES public.riomed_import_mappings(id) ON DELETE SET NULL,
  mapping_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  total_rows int NOT NULL DEFAULT 0,
  rows_created int NOT NULL DEFAULT 0,
  rows_updated int NOT NULL DEFAULT 0,
  rows_skipped int NOT NULL DEFAULT 0,
  rows_failed int NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rij_status_chk CHECK (status IN ('draft','ready','running','done','failed','canceled'))
);

CREATE INDEX IF NOT EXISTS rij_company_idx ON public.riomed_import_jobs (company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_import_jobs TO authenticated;
GRANT ALL ON public.riomed_import_jobs TO service_role;

ALTER TABLE public.riomed_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rij_company_rw ON public.riomed_import_jobs
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_import_jobs.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_import_jobs.company_id)
  );


-- 7) Triggers updated_at -----------------------------------------------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'riomed_warehouses','riomed_product_variants','riomed_stock_levels',
    'riomed_price_lists','riomed_prices','riomed_import_mappings','riomed_import_jobs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_touch_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at()', t);
  END LOOP;
END $$;


-- 8) Seeds para a Rio Med ----------------------------------------------

-- 8.1 Almoxarifado padrão
INSERT INTO public.riomed_warehouses (company_id, code, name, kind, is_default)
SELECT c.id, 'MAIN', 'Matriz Santa Cruz', 'main', true
FROM public.companies c
JOIN public.core_tenant_identity ti ON ti.company_id = c.id
WHERE ti.subdomain = 'riomed'
ON CONFLICT (company_id, code) DO NOTHING;

-- 8.2 Lista de preço pública padrão
INSERT INTO public.riomed_price_lists (company_id, code, name, audience, currency, is_default)
SELECT c.id, 'PUBLIC', 'Tabela Pública', 'public', 'BOB', true
FROM public.companies c
JOIN public.core_tenant_identity ti ON ti.company_id = c.id
WHERE ti.subdomain = 'riomed'
ON CONFLICT (company_id, code) DO NOTHING;

-- 8.3 Cria variante padrão para todo produto existente que ainda não tem
INSERT INTO public.riomed_product_variants (product_id, company_id, sku, name, is_default, is_active)
SELECT p.id, p.company_id,
       COALESCE(NULLIF(p.sku, ''), 'SKU-' || substr(p.id::text, 1, 8)),
       p.name, true, p.is_active
FROM public.riomed_products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.riomed_product_variants v WHERE v.product_id = p.id
)
ON CONFLICT (company_id, sku) DO NOTHING;

-- 8.4 Cria nível de estoque inicial: total do produto vai pro almoxarifado padrão
INSERT INTO public.riomed_stock_levels (company_id, variant_id, warehouse_id, qty_available)
SELECT v.company_id, v.id, w.id, COALESCE(p.stock, 0)
FROM public.riomed_product_variants v
JOIN public.riomed_products p ON p.id = v.product_id
JOIN public.riomed_warehouses w ON w.company_id = v.company_id AND w.is_default
WHERE v.is_default
ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

-- 8.5 Cria preço público para todo variante padrão que tenha price_sale
INSERT INTO public.riomed_prices (company_id, price_list_id, variant_id, price)
SELECT v.company_id, pl.id, v.id, p.price_sale
FROM public.riomed_product_variants v
JOIN public.riomed_products p ON p.id = v.product_id
JOIN public.riomed_price_lists pl ON pl.company_id = v.company_id AND pl.code = 'PUBLIC'
WHERE v.is_default AND p.price_sale IS NOT NULL AND p.price_sale > 0
ON CONFLICT (price_list_id, variant_id) DO NOTHING;

-- 8.6 Marca pendência da Onda 2 como concluída no painel
UPDATE public.core_implantation_tasks t
SET status = 'done', resolved_at = now(),
    notes = COALESCE(notes, '') || E'\n[Onda 2] Estrutura de variantes, almoxarifados, listas e preços criada automaticamente.'
FROM public.companies c
JOIN public.core_tenant_identity ti ON ti.company_id = c.id
WHERE ti.subdomain = 'riomed'
  AND t.company_id = c.id
  AND t.code = 'importar_inventario'
  AND t.status <> 'done';
