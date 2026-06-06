
INSERT INTO public.permissions (code, module, description) VALUES
  ('aff.product.read', 'afiliados', 'Leitura de produtos'),
  ('aff.offer.read', 'afiliados', 'Leitura de ofertas'),
  ('aff.sale.read', 'afiliados', 'Leitura de vendas'),
  ('aff.commission.read', 'afiliados', 'Leitura de comissões'),
  ('aff.payout.read', 'afiliados', 'Leitura de saques'),
  ('aff.manager.read', 'afiliados', 'Leitura de gerentes'),
  ('aff.affiliate.read', 'afiliados', 'Leitura de afiliados'),
  ('aff.coproducer.read', 'afiliados', 'Leitura de coprodutores'),
  ('aff.link.read', 'afiliados', 'Leitura de links')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT DISTINCT pp.profile_id, pr.id
FROM public.profile_permissions pp
JOIN public.permissions pw ON pw.id = pp.permission_id
JOIN public.permissions pr ON pr.code = replace(pw.code, '.write', '.read')
WHERE pw.code IN (
  'aff.product.write','aff.sale.write','aff.commission.write','aff.payout.write',
  'aff.manager.write','aff.affiliate.write','aff.coproducer.write','aff.link.write'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT DISTINCT pp.profile_id, (SELECT id FROM public.permissions WHERE code='aff.offer.read')
FROM public.profile_permissions pp
JOIN public.permissions pw ON pw.id = pp.permission_id
WHERE pw.code = 'aff.product.write'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT DISTINCT pp.profile_id, pr.id
FROM public.profile_permissions pp
JOIN public.permissions pm ON pm.id = pp.permission_id AND pm.code = 'aff.module.read'
JOIN public.permissions pr ON pr.code IN (
  'aff.product.read','aff.offer.read','aff.sale.read','aff.commission.read',
  'aff.payout.read','aff.manager.read','aff.affiliate.read','aff.coproducer.read','aff.link.read'
)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS aff_products_select ON public.aff_products;
CREATE POLICY aff_products_select ON public.aff_products
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.product.read'))
);

DROP POLICY IF EXISTS aff_offers_select ON public.aff_offers;
CREATE POLICY aff_offers_select ON public.aff_offers
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.offer.read'))
);

DROP POLICY IF EXISTS aff_sales_select ON public.aff_sales;
CREATE POLICY aff_sales_select ON public.aff_sales
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = aff_sales.affiliate_id AND a.user_id = auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.sale.read'))
);

DROP POLICY IF EXISTS aff_commissions_select ON public.aff_commissions;
CREATE POLICY aff_commissions_select ON public.aff_commissions
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR recipient_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = aff_commissions.affiliate_id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.aff_managers m WHERE m.id = aff_commissions.manager_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.aff_coproducers c WHERE c.id = aff_commissions.coproducer_id AND c.user_id = auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.commission.read'))
);

DROP POLICY IF EXISTS aff_managers_select ON public.aff_managers;
CREATE POLICY aff_managers_select ON public.aff_managers
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR user_id = auth.uid()
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.manager.read'))
);

DROP POLICY IF EXISTS aff_payouts_select ON public.aff_payouts;
CREATE POLICY aff_payouts_select ON public.aff_payouts
FOR SELECT TO authenticated USING (
  is_impulsionando_staff(auth.uid())
  OR recipient_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = aff_payouts.affiliate_id AND a.user_id = auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.payout.read'))
);

DROP POLICY IF EXISTS fin_accounts_select ON public.fin_accounts;
CREATE POLICY fin_accounts_select ON public.fin_accounts
FOR SELECT TO authenticated USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.account.read'))
);

DROP POLICY IF EXISTS fin_accounts_insert ON public.fin_accounts;
CREATE POLICY fin_accounts_insert ON public.fin_accounts
FOR INSERT TO authenticated WITH CHECK (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.account.write'))
);

DROP POLICY IF EXISTS fin_accounts_update ON public.fin_accounts;
CREATE POLICY fin_accounts_update ON public.fin_accounts
FOR UPDATE TO authenticated USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.account.write'))
);

DROP POLICY IF EXISTS fin_accounts_delete ON public.fin_accounts;
CREATE POLICY fin_accounts_delete ON public.fin_accounts
FOR DELETE TO authenticated USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.account.write'))
);
