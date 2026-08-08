
INSERT INTO public.mpago_credentials (company_id, environment, access_token_secret_name, public_key, webhook_secret_name, active)
VALUES (
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid,
  'sandbox',
  'MPAGO_CHRISMED_ACCESS_TOKEN',
  'TEST-PUBLIC-KEY-PENDENTE',
  'MPAGO_CHRISMED_WEBHOOK_SECRET',
  true
)
ON CONFLICT (company_id, environment) DO UPDATE
  SET access_token_secret_name = EXCLUDED.access_token_secret_name,
      webhook_secret_name = EXCLUDED.webhook_secret_name,
      active = true,
      updated_at = now();
