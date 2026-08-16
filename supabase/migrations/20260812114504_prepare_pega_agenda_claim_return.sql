-- Replay compatibility guard for the Pega-Agenda claim function.
-- Historical clean schemas may still contain the earlier Core signature with
-- the same arguments but a non-jsonb return type. PostgreSQL does not allow
-- CREATE OR REPLACE to change a function return type.
--
-- Production already exposes jsonb for this signature, so this is a no-op
-- there. On a clean historical replay, only the obsolete incompatible
-- signature is removed so the immediately following CHRISMED migration can
-- create the canonical jsonb implementation.
DO $guard$
DECLARE
  v_result text;
BEGIN
  SELECT pg_get_function_result(p.oid)
    INTO v_result
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'agenda_claim_open_slot'
    AND pg_get_function_identity_arguments(p.oid) = 'uuid, uuid, text, text'
  LIMIT 1;

  IF v_result IS NOT NULL AND lower(v_result) <> 'jsonb' THEN
    DROP FUNCTION public.agenda_claim_open_slot(uuid, uuid, text, text);
  END IF;
END
$guard$;
