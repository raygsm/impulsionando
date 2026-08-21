DO $verify$
BEGIN
  IF to_regclass('public.companies') IS NULL THEN RAISE EXCEPTION 'companies missing after restore'; END IF;
  IF to_regclass('public.user_roles') IS NULL THEN RAISE EXCEPTION 'user_roles missing after restore'; END IF;
  IF to_regclass('public.core_go_live_checks') IS NULL THEN RAISE EXCEPTION 'core_go_live_checks missing after restore'; END IF;
  IF to_regclass('public.core_service_access_state') IS NULL THEN RAISE EXCEPTION 'core_service_access_state missing after restore'; END IF;
  IF to_regclass('public.message_outbox') IS NULL THEN RAISE EXCEPTION 'message_outbox missing after restore'; END IF;
  IF to_regclass('public.core_backup_evidence') IS NULL THEN RAISE EXCEPTION 'core_backup_evidence missing after restore'; END IF;
END
$verify$;
