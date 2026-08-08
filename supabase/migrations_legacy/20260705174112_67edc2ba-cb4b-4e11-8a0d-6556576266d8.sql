GRANT EXECUTE ON FUNCTION public.user_belongs_to_company(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.core_user_belongs_to_company(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_impulsionando_staff(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mp_user_in_company(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, uuid, text) TO anon, authenticated;