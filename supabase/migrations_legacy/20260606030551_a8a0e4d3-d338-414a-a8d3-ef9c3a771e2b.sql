DROP POLICY IF EXISTS aff_ap_select ON public.aff_affiliate_products;
CREATE POLICY aff_ap_select ON public.aff_affiliate_products
FOR SELECT TO authenticated
USING (
  (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.read'))
  OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = aff_affiliate_products.affiliate_id AND a.user_id = auth.uid() AND user_belongs_to_company(auth.uid(), a.company_id))
  OR is_impulsionando_staff(auth.uid())
);

DROP POLICY IF EXISTS aff_links_select ON public.aff_links;
CREATE POLICY aff_links_select ON public.aff_links
FOR SELECT TO authenticated
USING (
  (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.link.read'))
  OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = aff_links.affiliate_id AND a.user_id = auth.uid() AND user_belongs_to_company(auth.uid(), a.company_id))
  OR is_impulsionando_staff(auth.uid())
);