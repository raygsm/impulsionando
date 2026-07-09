-- Escopar policies públicas anon das tabelas riomed_* ao company_id do tenant RioMed.
-- Corrige exposição cross-tenant reportada pelo scanner.

DROP POLICY IF EXISTS "Public can read active riomed products" ON public.riomed_products;
CREATE POLICY "Public can read active riomed products"
  ON public.riomed_products FOR SELECT
  USING (is_active = true AND company_id = public.riomed_company_id());

DROP POLICY IF EXISTS rpv_public_read ON public.riomed_product_variants;
CREATE POLICY rpv_public_read
  ON public.riomed_product_variants FOR SELECT
  USING (
    is_active
    AND EXISTS (
      SELECT 1 FROM public.riomed_products p
      WHERE p.id = riomed_product_variants.product_id
        AND p.company_id = public.riomed_company_id()
    )
  );

DROP POLICY IF EXISTS rpl_public_read ON public.riomed_price_lists;
CREATE POLICY rpl_public_read
  ON public.riomed_price_lists FOR SELECT
  USING (is_active AND audience = 'public' AND company_id = public.riomed_company_id());

DROP POLICY IF EXISTS rp_public_read ON public.riomed_prices;
CREATE POLICY rp_public_read
  ON public.riomed_prices FOR SELECT
  USING (
    is_active
    AND EXISTS (
      SELECT 1 FROM public.riomed_price_lists pl
      WHERE pl.id = riomed_prices.price_list_id
        AND pl.is_active
        AND pl.audience = 'public'
        AND pl.company_id = public.riomed_company_id()
    )
  );

DROP POLICY IF EXISTS rs_public_read ON public.riomed_showcase;
CREATE POLICY rs_public_read
  ON public.riomed_showcase FOR SELECT
  USING (is_published = true AND company_id = public.riomed_company_id());

DROP POLICY IF EXISTS rsi_public_read ON public.riomed_showcase_items;
CREATE POLICY rsi_public_read
  ON public.riomed_showcase_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.riomed_showcase s
      WHERE s.id = riomed_showcase_items.showcase_id
        AND s.is_published = true
        AND s.company_id = public.riomed_company_id()
    )
  );
