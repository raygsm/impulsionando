-- Fix aff_affiliate_products policy
DROP POLICY IF EXISTS aff_ap_select ON public.aff_affiliate_products;
CREATE POLICY aff_ap_select ON public.aff_affiliate_products
FOR SELECT TO authenticated
USING (
  user_belongs_to_company(auth.uid(), company_id)
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_affiliate_products.affiliate_id
      AND a.user_id = auth.uid()
      AND a.company_id = aff_affiliate_products.company_id
      AND user_belongs_to_company(auth.uid(), a.company_id)
  )
);

-- Fix aff_links policy
DROP POLICY IF EXISTS aff_links_select ON public.aff_links;
CREATE POLICY aff_links_select ON public.aff_links
FOR SELECT TO authenticated
USING (
  user_belongs_to_company(auth.uid(), company_id)
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_links.affiliate_id
      AND a.user_id = auth.uid()
      AND a.company_id = aff_links.company_id
      AND user_belongs_to_company(auth.uid(), a.company_id)
  )
);

-- Restrict billing_dunning_policy to staff
DROP POLICY IF EXISTS billing_dunning_policy_select ON public.billing_dunning_policy;
DROP POLICY IF EXISTS "billing_dunning_policy select" ON public.billing_dunning_policy;
CREATE POLICY billing_dunning_policy_select ON public.billing_dunning_policy
FOR SELECT TO authenticated
USING (is_impulsionando_staff(auth.uid()));