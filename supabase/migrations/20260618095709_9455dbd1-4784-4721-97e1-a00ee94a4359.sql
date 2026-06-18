
-- 1) Restrict anonymous access to companies vitrine to a safe-column view
DROP POLICY IF EXISTS companies_public_vitrine_read ON public.companies;
REVOKE SELECT ON public.companies FROM anon;

CREATE OR REPLACE VIEW public.public_companies_vitrine
WITH (security_invoker = true) AS
SELECT
  id, name, trade_name, logo_url, public_slug,
  segment, company_type, primary_color, secondary_color,
  address_city, address_state, website, instagram, facebook
FROM public.companies
WHERE vitrine_enabled = true AND public_slug IS NOT NULL;

-- Re-allow anon to read only the vitrine via a dedicated policy on the safe columns set
-- (security_invoker views inherit base table RLS, so we add a narrow SELECT policy)
CREATE POLICY companies_public_vitrine_safe_read
ON public.companies
FOR SELECT
TO anon
USING (vitrine_enabled = true AND public_slug IS NOT NULL);
-- Note: column-level grants below ensure anon can only read whitelisted columns

REVOKE ALL ON public.companies FROM anon;
GRANT SELECT (
  id, name, trade_name, logo_url, public_slug,
  segment, company_type, primary_color, secondary_color,
  address_city, address_state, website, instagram, facebook,
  vitrine_enabled
) ON public.companies TO anon;
GRANT SELECT ON public.public_companies_vitrine TO anon, authenticated;

-- 2) Require comm.member.read permission for non-self reads on comm_members
DROP POLICY IF EXISTS "comm_m read" ON public.comm_members;
CREATE POLICY "comm_m read"
ON public.comm_members
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR member_user_id = auth.uid()
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'comm.member.read')
  )
);
