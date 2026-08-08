
-- riomed_seller_leads
DROP POLICY IF EXISTS "rsl_insert_public" ON public.riomed_seller_leads;
DROP POLICY IF EXISTS "rsl_select_public" ON public.riomed_seller_leads;
CREATE POLICY "rsl_auth_rw" ON public.riomed_seller_leads FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- riomed_support_tickets
DROP POLICY IF EXISTS "rst_insert_public" ON public.riomed_support_tickets;
DROP POLICY IF EXISTS "rst_select_public" ON public.riomed_support_tickets;
CREATE POLICY "rst_auth_rw" ON public.riomed_support_tickets FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- riomed_team
DROP POLICY IF EXISTS "rt_public_read" ON public.riomed_team;
CREATE POLICY "rt_auth_read" ON public.riomed_team FOR SELECT TO authenticated
  USING (true);

-- riomed_rr_pointer
DROP POLICY IF EXISTS "rrp_all_public" ON public.riomed_rr_pointer;
CREATE POLICY "rrp_auth_rw" ON public.riomed_rr_pointer FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Revoga acesso direto do anon a essas tabelas (server functions usam service role).
REVOKE ALL ON public.riomed_seller_leads FROM anon;
REVOKE ALL ON public.riomed_support_tickets FROM anon;
REVOKE ALL ON public.riomed_team FROM anon;
REVOKE ALL ON public.riomed_rr_pointer FROM anon;
