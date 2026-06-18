
-- core_settings: staff only
DROP POLICY IF EXISTS core_settings_read_auth ON public.core_settings;
CREATE POLICY core_settings_read_staff
ON public.core_settings FOR SELECT TO authenticated
USING (is_impulsionando_staff(auth.uid()));

-- quotes: enforce safe public INSERT
DROP POLICY IF EXISTS "Anyone can create a quote" ON public.quotes;
CREATE POLICY "quotes_public_insert_safe"
ON public.quotes FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'draft'
  AND accepted_at IS NULL
  AND accepted_ip IS NULL
  AND accepted_user_agent IS NULL
  AND accepted_terms IS NULL
  AND length(coalesce(lead_name,'')) BETWEEN 2 AND 120
  AND length(coalesce(lead_whatsapp,'')) BETWEEN 8 AND 20
  AND (lead_email IS NULL OR lead_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
-- Force public_token + id to use server defaults: revoke INSERT privilege on those columns
REVOKE INSERT ON public.quotes FROM anon, authenticated;
GRANT INSERT (
  quote_number, lead_name, lead_whatsapp, lead_email, lead_role, lead_city, lead_state,
  company_name, company_tax_id, company_legal_name, category, segment, modules,
  subtotal_cents, discount_pct, discount_cents, setup_cents, total_cents,
  utm_source, utm_medium, utm_campaign, utm_content, utm_term, origin, status
) ON public.quotes TO anon, authenticated;
