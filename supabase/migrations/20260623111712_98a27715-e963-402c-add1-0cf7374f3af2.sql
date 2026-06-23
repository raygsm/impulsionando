
CREATE OR REPLACE FUNCTION public.riomed_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_riomed_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_belongs_to_company(_user_id, public.riomed_company_id())
      OR public.has_role(_user_id, 'admin'::app_role);
$$;

DO $do$
DECLARE
  bad_policies text[] := ARRAY[
    'Authenticated read shipments',
    'Authenticated read credit',
    'Authenticated read cashflow',
    'Authenticated read reconciliation',
    'Authenticated read fiscal bo',
    'Authenticated read fiscal log'
  ];
  tables text[] := ARRAY[
    'riomed_shipments',
    'riomed_credit_limits',
    'riomed_cash_flow_forecast',
    'riomed_bank_reconciliation',
    'riomed_fiscal_invoices_bo',
    'riomed_fiscal_log'
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(tables,1) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', bad_policies[i], tables[i]);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_riomed_member(auth.uid()) AND company_id = public.riomed_company_id())',
      bad_policies[i] || ' (scoped)',
      tables[i]
    );
  END LOOP;
END
$do$;

DROP POLICY IF EXISTS "Authenticated read shipment items" ON public.riomed_shipment_items;
CREATE POLICY "Read shipment items (scoped)" ON public.riomed_shipment_items
  FOR SELECT TO authenticated
  USING (
    public.is_riomed_member(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.riomed_shipments s
      WHERE s.id = riomed_shipment_items.shipment_id
        AND s.company_id = public.riomed_company_id()
    )
  );

DROP POLICY IF EXISTS "Authenticated read tracking" ON public.riomed_tracking_events;
CREATE POLICY "Read tracking events (scoped)" ON public.riomed_tracking_events
  FOR SELECT TO authenticated
  USING (
    public.is_riomed_member(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.riomed_shipments s
      WHERE s.id = riomed_tracking_events.shipment_id
        AND s.company_id = public.riomed_company_id()
    )
  );

DROP POLICY IF EXISTS "riomed_audit_insert" ON public.riomed_audit_log;
CREATE POLICY "riomed_audit_insert" ON public.riomed_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.riomed_company_id()
    AND public.is_riomed_member(auth.uid())
  );

DROP POLICY IF EXISTS "riomed_opevents_insert" ON public.riomed_operational_events;
CREATE POLICY "riomed_opevents_insert" ON public.riomed_operational_events
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.riomed_company_id()
    AND public.is_riomed_member(auth.uid())
  );

DROP POLICY IF EXISTS "rt_auth_read" ON public.riomed_team;
CREATE POLICY "rt_member_read_all" ON public.riomed_team
  FOR SELECT TO authenticated
  USING (public.is_riomed_member(auth.uid()));
CREATE POLICY "rt_admin_write" ON public.riomed_team
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "rst_auth_rw" ON public.riomed_support_tickets;
DROP POLICY IF EXISTS "rst_select_public" ON public.riomed_support_tickets;
CREATE POLICY "rst_member_read" ON public.riomed_support_tickets
  FOR SELECT TO authenticated
  USING (public.is_riomed_member(auth.uid()));
CREATE POLICY "rst_member_update" ON public.riomed_support_tickets
  FOR UPDATE TO authenticated
  USING (public.is_riomed_member(auth.uid()))
  WITH CHECK (public.is_riomed_member(auth.uid()));

DROP POLICY IF EXISTS "rsl_auth_rw" ON public.riomed_seller_leads;
DROP POLICY IF EXISTS "rsl_select_public" ON public.riomed_seller_leads;
CREATE POLICY "rsl_member_read" ON public.riomed_seller_leads
  FOR SELECT TO authenticated
  USING (public.is_riomed_member(auth.uid()));
CREATE POLICY "rsl_member_update" ON public.riomed_seller_leads
  FOR UPDATE TO authenticated
  USING (public.is_riomed_member(auth.uid()))
  WITH CHECK (public.is_riomed_member(auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.riomed_rr_pointer FROM anon, authenticated;
GRANT SELECT ON public.riomed_rr_pointer TO authenticated;
DROP POLICY IF EXISTS "rrp_auth_rw" ON public.riomed_rr_pointer;
DROP POLICY IF EXISTS "rrp_all_public" ON public.riomed_rr_pointer;
CREATE POLICY "rrp_member_read" ON public.riomed_rr_pointer
  FOR SELECT TO authenticated
  USING (public.is_riomed_member(auth.uid()));
