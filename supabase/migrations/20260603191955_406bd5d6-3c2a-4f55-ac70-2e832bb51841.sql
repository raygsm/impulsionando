
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, uuid, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, uuid, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, uuid, text, text, text, text, text, text) FROM authenticated;
