import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AccessProfile {
  id: string;
  slug: string;
  name: string;
  is_master_profile: boolean;
}

export interface MyMembership {
  id: string;
  company_id: string;
  unit_id: string | null;
  profile_id: string;
  display_name: string | null;
  email: string | null;
  is_active: boolean;
  companies: { id: string; name: string; is_master: boolean } | null;
  profiles: AccessProfile | null;
}

export interface CurrentUser {
  user: User;
  memberships: MyMembership[];
  isSuperAdmin: boolean;
  isImpulsionandoStaff: boolean;
}

// [Etapa 3] useAuthSession removido — nunca era importado e criava um
// segundo listener onAuthStateChange além do AuthSync em __root.tsx.
// Para observar sessão em componentes, use useCurrentUser (react-query)
// que é invalidado pelo AuthSync.



export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: memberships, error } = await supabase
    .from("user_profiles")
    .select(
      "id, company_id, unit_id, profile_id, display_name, email, is_active, companies:company_id(id, name, is_master), profiles:profile_id(id, slug, name, is_master_profile)"
    )
    .eq("user_id", userData.user.id)
    .eq("is_active", true);

  if (error) throw error;

  const list = (memberships ?? []) as unknown as MyMembership[];
  const isSuperAdmin = list.some((m) => m.profiles?.slug === "super-admin-impulsionando");
  const isImpulsionandoStaff = list.some((m) => m.profiles?.is_master_profile);

  return { user: userData.user, memberships: list, isSuperAdmin, isImpulsionandoStaff };
}
