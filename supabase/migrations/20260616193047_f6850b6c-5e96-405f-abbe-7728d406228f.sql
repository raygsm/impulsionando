GRANT SELECT ON public.billing_plans TO anon;
CREATE POLICY "Public reads visible plans" ON public.billing_plans FOR SELECT TO anon USING (is_active = true AND show_on_site = true);