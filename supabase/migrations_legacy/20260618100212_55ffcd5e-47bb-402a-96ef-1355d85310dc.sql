
-- Seed new permissions
INSERT INTO public.permissions (code, module, description) VALUES
  ('quotes.read', 'quotes', 'Ler propostas/cotações com PII'),
  ('billing.charge.read', 'billing', 'Ler cobranças PIX com PII do pagador'),
  ('contracts.read', 'contracts', 'Ler contratos e assinaturas'),
  ('evt.event.read', 'events', 'Ler eventos da empresa'),
  ('restaurant.invoice.read', 'restaurant', 'Ler faturas de mesa'),
  ('company.onboarding.read', 'company', 'Ler checklist de onboarding'),
  ('company.onboarding.write', 'company', 'Atualizar checklist de onboarding')
ON CONFLICT (code) DO NOTHING;

-- quotes
DROP POLICY IF EXISTS "Master staff can view all quotes" ON public.quotes;
CREATE POLICY "quotes_staff_read"
ON public.quotes FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.companies c ON c.id = up.company_id
      WHERE up.user_id = auth.uid() AND up.is_active = true AND c.is_master = true
    )
    AND user_has_permission(auth.uid(), (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1), 'quotes.read')
  )
);

-- billing_pix_charges
DROP POLICY IF EXISTS "owners read own pix charges" ON public.billing_pix_charges;
CREATE POLICY "owners read own pix charges"
ON public.billing_pix_charges FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL
  AND user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'billing.charge.read')
);

-- contract_signatures
DROP POLICY IF EXISTS "contract_signatures_company_read" ON public.contract_signatures;
CREATE POLICY "contract_signatures_company_read"
ON public.contract_signatures FOR SELECT TO authenticated
USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'contracts.read')
);

-- contract_documents
DROP POLICY IF EXISTS "contract_documents_company_read" ON public.contract_documents;
CREATE POLICY "contract_documents_company_read"
ON public.contract_documents FOR SELECT TO authenticated
USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'contracts.read')
);

-- evt_events
DROP POLICY IF EXISTS "evt_events company read" ON public.evt_events;
CREATE POLICY "evt_events company read"
ON public.evt_events FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'evt.event.read')
  )
);

-- restaurant_table_invoices
DROP POLICY IF EXISTS "Equipe da empresa vê as cobranças de mesa" ON public.restaurant_table_invoices;
CREATE POLICY "restaurant_table_invoices_read"
ON public.restaurant_table_invoices FOR SELECT TO authenticated
USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'restaurant.invoice.read')
);

-- onboarding_checklist
DROP POLICY IF EXISTS "company read checklist" ON public.onboarding_checklist;
DROP POLICY IF EXISTS "company update checklist" ON public.onboarding_checklist;
DROP POLICY IF EXISTS "company upsert checklist" ON public.onboarding_checklist;
CREATE POLICY "company read checklist"
ON public.onboarding_checklist FOR SELECT TO authenticated
USING (
  core_user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'company.onboarding.read')
);
CREATE POLICY "company update checklist"
ON public.onboarding_checklist FOR UPDATE TO authenticated
USING (
  core_user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'company.onboarding.write')
);
CREATE POLICY "company upsert checklist"
ON public.onboarding_checklist FOR INSERT TO authenticated
WITH CHECK (
  core_user_belongs_to_company(auth.uid(), company_id)
  AND user_has_permission(auth.uid(), company_id, 'company.onboarding.write')
);
