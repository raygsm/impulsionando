-- Replay compatibility guard for the Pega-Agenda claim function.
-- Historical clean schemas may still contain the earlier Core signature with
-- the same argument types but a non-jsonb return type. PostgreSQL does not
-- allow CREATE OR REPLACE to change a function return type.
--
-- Resolve the exact overload by regprocedure so parameter names/defaults do
-- not affect matching. Production already exposes jsonb for this signature,
-- so this is a no-op there. On a clean historical replay, only the obsolete
-- incompatible overload is removed before the canonical CHRISMED migration.
DO $guard$
DECLARE
  v_proc regprocedure;
  v_result text;
BEGIN
  v_proc := to_regprocedure('public.agenda_claim_open_slot(uuid,uuid,text,text)');

  IF v_proc IS NOT NULL THEN
    SELECT pg_get_function_result(v_proc::oid) INTO v_result;

    IF lower(coalesce(v_result, '')) <> 'jsonb' THEN
      DROP FUNCTION public.agenda_claim_open_slot(uuid, uuid, text, text);
    END IF;
  END IF;
END
$guard$;
