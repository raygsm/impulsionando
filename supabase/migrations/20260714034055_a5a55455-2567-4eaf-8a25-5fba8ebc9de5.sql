
INSERT INTO public.mpago_credentials(company_id, environment, access_token_secret_name, public_key, user_id_mp, active)
VALUES (
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  'production',
  'pending:mpago:642096b5-a9ff-4521-a82a-c004f6d2e2d2:production:access_token',
  'APP_USR-4a3ebd38-4f90-475a-a443-2f75f15990f8',
  NULL,
  false
)
ON CONFLICT (company_id, environment) DO UPDATE
  SET public_key = EXCLUDED.public_key,
      updated_at = now();
