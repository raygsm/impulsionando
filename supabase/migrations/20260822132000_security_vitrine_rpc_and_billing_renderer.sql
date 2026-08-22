-- Close anonymous bypasses discovered by Supabase security advisors.
-- Keep intentionally public token/demo flows unchanged.

-- Full Vitrine rows must require an authenticated Club session.
revoke execute on function public.get_companies_vitrine_public_rows() from public, anon;
grant execute on function public.get_companies_vitrine_public_rows() to authenticated, service_role;

-- Billing template renderer is an internal delivery primitive, not a public RPC.
revoke execute on function public.billing_render_template(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.billing_render_template(text,text,text,text,text) to service_role;
