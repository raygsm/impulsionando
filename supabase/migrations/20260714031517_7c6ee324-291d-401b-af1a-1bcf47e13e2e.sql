
CREATE TABLE IF NOT EXISTS public.core_secret_values (
  name text PRIMARY KEY,
  value_ciphertext bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.core_secret_values TO service_role;
ALTER TABLE public.core_secret_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role only" ON public.core_secret_values;
CREATE POLICY "service role only" ON public.core_secret_values FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.core_secret_values(name, value_ciphertext)
SELECT 'internal:enc_pepper', extensions.pgp_sym_encrypt(encode(extensions.gen_random_bytes(32), 'hex'), 'bootstrap-pepper')
WHERE NOT EXISTS (SELECT 1 FROM public.core_secret_values WHERE name='internal:enc_pepper');

CREATE OR REPLACE FUNCTION public._enc_pepper() RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT extensions.pgp_sym_decrypt(value_ciphertext, 'bootstrap-pepper')::text
  FROM public.core_secret_values WHERE name='internal:enc_pepper';
$$;
REVOKE ALL ON FUNCTION public._enc_pepper() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_mpago_credentials(
  p_company_id uuid, p_environment text, p_access_token text,
  p_public_key text, p_webhook_secret text, p_user_id_mp text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token_name text := format('mpago:%s:%s:access_token', p_company_id, p_environment);
  v_wh_name text := format('mpago:%s:%s:webhook_secret', p_company_id, p_environment);
  v_pepper text := public._enc_pepper();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (public.user_belongs_to_company(v_uid, p_company_id) AND public.has_role(v_uid, 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_environment NOT IN ('sandbox','production') THEN RAISE EXCEPTION 'invalid environment'; END IF;

  INSERT INTO public.core_secret_values(name, value_ciphertext, updated_at)
  VALUES (v_token_name, extensions.pgp_sym_encrypt(p_access_token, v_pepper), now())
  ON CONFLICT (name) DO UPDATE SET value_ciphertext=EXCLUDED.value_ciphertext, updated_at=now();

  IF p_webhook_secret IS NOT NULL AND length(p_webhook_secret)>0 THEN
    INSERT INTO public.core_secret_values(name, value_ciphertext, updated_at)
    VALUES (v_wh_name, extensions.pgp_sym_encrypt(p_webhook_secret, v_pepper), now())
    ON CONFLICT (name) DO UPDATE SET value_ciphertext=EXCLUDED.value_ciphertext, updated_at=now();
  END IF;

  INSERT INTO public.mpago_credentials(company_id, environment, access_token_secret_name, public_key, webhook_secret_name, user_id_mp, active)
  VALUES (p_company_id, p_environment, v_token_name, p_public_key,
          CASE WHEN p_webhook_secret IS NOT NULL AND length(p_webhook_secret)>0 THEN v_wh_name ELSE NULL END,
          p_user_id_mp, true)
  ON CONFLICT (company_id, environment) DO UPDATE SET
    access_token_secret_name = EXCLUDED.access_token_secret_name,
    public_key = EXCLUDED.public_key,
    webhook_secret_name = COALESCE(EXCLUDED.webhook_secret_name, mpago_credentials.webhook_secret_name),
    user_id_mp = EXCLUDED.user_id_mp,
    active = true, updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_mpago_credentials(uuid,text,text,text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_mpago_credentials(uuid,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_mpago_credentials_masked(p_company_id uuid)
RETURNS TABLE(environment text, public_key_masked text, access_token_configured boolean, webhook_configured boolean, user_id_mp text, active boolean, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT public.user_belongs_to_company(v_uid, p_company_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT c.environment,
         CASE WHEN c.public_key IS NULL THEN NULL ELSE left(c.public_key,10)||'…'||right(c.public_key,4) END,
         EXISTS(SELECT 1 FROM public.core_secret_values sv WHERE sv.name=c.access_token_secret_name),
         c.webhook_secret_name IS NOT NULL AND EXISTS(SELECT 1 FROM public.core_secret_values sv WHERE sv.name=c.webhook_secret_name),
         c.user_id_mp, c.active, c.updated_at
  FROM public.mpago_credentials c WHERE c.company_id=p_company_id ORDER BY c.environment DESC;
END; $$;
REVOKE ALL ON FUNCTION public.get_mpago_credentials_masked(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_mpago_credentials_masked(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reveal_secret_value(p_name text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_val text;
BEGIN
  SELECT extensions.pgp_sym_decrypt(value_ciphertext, public._enc_pepper())::text INTO v_val
  FROM public.core_secret_values WHERE name=p_name;
  RETURN v_val;
END; $$;
REVOKE ALL ON FUNCTION public.reveal_secret_value(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_secret_value(text) TO service_role;
