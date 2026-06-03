import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";

export function useUserPermissions(companyId: string | undefined) {
  const { data: me } = useCurrentUser();

  return useQuery({
    queryKey: ["user-permissions", me?.user?.id, companyId],
    enabled: !!me?.user?.id && !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!me?.user?.id || !companyId) return new Set<string>();

      // Busca permissões via perfis ativos na empresa
      const { data: profilePerms, error: pErr } = await supabase
        .from("user_profiles")
        .select("profile_permissions(permissions(code))")
        .eq("user_id", me.user.id)
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (pErr) throw pErr;

      const codes = new Set<string>();
      for (const row of profilePerms ?? []) {
        const perms = row.profile_permissions as unknown as { permissions: { code: string } | null }[] | null;
        for (const pp of perms ?? []) {
          if (pp?.permissions?.code) codes.add(pp.permissions.code);
        }
      }

      // Busca overrides explícitos
      const { data: overrides, error: oErr } = await supabase
        .from("user_permission_overrides")
        .select("effect, permissions(code)")
        .eq("user_id", me.user.id)
        .eq("company_id", companyId);

      if (oErr) throw oErr;

      for (const ovr of overrides ?? []) {
        const perm = (ovr as unknown as { permissions: { code: string } | null }).permissions;
        if (!perm?.code) continue;
        if (ovr.effect === "grant") codes.add(perm.code);
        if (ovr.effect === "deny") codes.delete(perm.code);
      }

      return codes;
    },
  });
}
