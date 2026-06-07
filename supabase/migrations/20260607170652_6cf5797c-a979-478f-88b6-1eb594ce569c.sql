
-- Affiliates: require permission for company-wide read branch
DROP POLICY IF EXISTS aff_ap_select ON public.aff_affiliate_products;
CREATE POLICY aff_ap_select ON public.aff_affiliate_products
FOR SELECT USING (
  (user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.read'))
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_affiliate_products.affiliate_id
      AND a.user_id = auth.uid()
      AND a.company_id = aff_affiliate_products.company_id
      AND user_belongs_to_company(auth.uid(), a.company_id)
  )
);

DROP POLICY IF EXISTS aff_links_select ON public.aff_links;
CREATE POLICY aff_links_select ON public.aff_links
FOR SELECT USING (
  (user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'aff.link.read'))
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_links.affiliate_id
      AND a.user_id = auth.uid()
      AND a.company_id = aff_links.company_id
      AND user_belongs_to_company(auth.uid(), a.company_id)
  )
);

-- Billing dunning policy: drop permissive read
DROP POLICY IF EXISTS "Read dunning policy" ON public.billing_dunning_policy;

-- Inventory: add company membership assertion
DROP POLICY IF EXISTS inv_products_select ON public.inv_products;
CREATE POLICY inv_products_select ON public.inv_products
FOR SELECT USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.product.read')
);
DROP POLICY IF EXISTS inv_products_write ON public.inv_products;
CREATE POLICY inv_products_write ON public.inv_products
FOR ALL USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.product.write')
) WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.product.write')
);

DROP POLICY IF EXISTS inv_suppliers_select ON public.inv_suppliers;
CREATE POLICY inv_suppliers_select ON public.inv_suppliers
FOR SELECT USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.supplier.read')
);
DROP POLICY IF EXISTS inv_suppliers_write ON public.inv_suppliers;
CREATE POLICY inv_suppliers_write ON public.inv_suppliers
FOR ALL USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.supplier.write')
) WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.supplier.write')
);

DROP POLICY IF EXISTS inv_categories_select ON public.inv_categories;
CREATE POLICY inv_categories_select ON public.inv_categories
FOR SELECT USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.category.read')
);
DROP POLICY IF EXISTS inv_categories_write ON public.inv_categories;
CREATE POLICY inv_categories_write ON public.inv_categories
FOR ALL USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.category.write')
) WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.category.write')
);

DROP POLICY IF EXISTS inv_movements_select ON public.inv_movements;
CREATE POLICY inv_movements_select ON public.inv_movements
FOR SELECT USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.movement.read')
);
DROP POLICY IF EXISTS inv_movements_write ON public.inv_movements;
CREATE POLICY inv_movements_write ON public.inv_movements
FOR ALL USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.movement.write')
) WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'inventory.movement.write')
);

-- Sales orders: add company membership assertion
DROP POLICY IF EXISTS sales_orders_select ON public.sales_orders;
CREATE POLICY sales_orders_select ON public.sales_orders
FOR SELECT USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'sales.order.read')
);
DROP POLICY IF EXISTS sales_orders_insert ON public.sales_orders;
CREATE POLICY sales_orders_insert ON public.sales_orders
FOR INSERT WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'sales.order.write')
);
DROP POLICY IF EXISTS sales_orders_update ON public.sales_orders;
CREATE POLICY sales_orders_update ON public.sales_orders
FOR UPDATE USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'sales.order.write')
) WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'sales.order.write')
);
DROP POLICY IF EXISTS sales_orders_delete ON public.sales_orders;
CREATE POLICY sales_orders_delete ON public.sales_orders
FOR DELETE USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'sales.order.cancel')
);
