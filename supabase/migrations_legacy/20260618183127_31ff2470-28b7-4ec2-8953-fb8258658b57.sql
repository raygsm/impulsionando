
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.audit_consumer_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, after, metadata)
  VALUES (
    NEW.user_id,
    'consumidor.signup',
    'consumidor',
    NEW.id::text,
    to_jsonb(NEW),
    jsonb_build_object('source', 'trigger', 'cep', NEW.cep, 'city', NEW.city)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_consumer_profile_insert ON public.consumer_profiles;
CREATE TRIGGER trg_audit_consumer_profile_insert
AFTER INSERT ON public.consumer_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_consumer_profile_insert();

CREATE INDEX IF NOT EXISTS idx_consumer_profiles_created_at ON public.consumer_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumer_profiles_cep ON public.consumer_profiles (cep);
CREATE INDEX IF NOT EXISTS idx_consumer_profiles_name_trgm
  ON public.consumer_profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_consumer_profiles_phone ON public.consumer_profiles (phone);
