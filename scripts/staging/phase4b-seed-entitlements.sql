-- Phase 4B staging seed — Chrismed modules + feature flag override (apply after gate approval)
-- Requires Chrismed company_id from phase4-seed-chrismed-tenant (642096b5-a9ff-4521-a82a-c004f6d2e2d2 on staging)

-- Enable support module for smoke entitlements (idempotent)
INSERT INTO public.company_modules (company_id, module_id, is_enabled)
SELECT
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid,
  m.id,
  true
FROM public.modules m
WHERE m.slug = 'support'
ON CONFLICT (company_id, module_id) DO UPDATE SET is_enabled = true, updated_at = now();

-- Optional flag override proof (catalog row must exist)
-- INSERT INTO public.core_company_feature_values (company_id, flag_key, module_slug, value)
-- SELECT '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, f.key, f.module_slug, true
-- FROM public.core_feature_flags f
-- WHERE f.module_slug = 'support' AND f.key = 'tickets_enabled'
-- ON CONFLICT (company_id, module_slug, flag_key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
