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

type AppRole = "admin" | "gestor" | "profissional" | "paciente" | "empresa";
type CurrentRoleRow = {
  id: string;
  company_id: string;
  role: AppRole;
  companies: { id: string; name: string; is_master: boolean } | null;
};

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  profissional: "Profissional da saúde",
  paciente: "Paciente",
  empresa: "Empresa",
};

// A sessão é observada pelo AuthSync em __root.tsx; useCurrentUser é invalidado
// por ele. Não crie listeners paralelos de onAuthStateChange aqui.
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  // app_metadata é emitido pelo Auth e não pode ser alterado pelo usuário no browser.
  // Mantém a conta master operacional mesmo durante recuperação de estruturas de acesso.
  const metadata = userData.user.app_metadata ?? {};
  const metadataSuperAdmin =
    metadata.is_super_admin === true || metadata.platform_role === "super_admin";
  const metadataStaff = metadataSuperAdmin || metadata.is_impulsionando_staff === true;

  // O Core atual usa user_roles. user_profiles pertence ao modelo legado e não existe
  // no banco de produção. A consulta abaixo preserva o formato MyMembership consumido
  // pelo front, sem reintroduzir dependência da estrutura antiga.
  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("id, company_id, role, companies:company_id(id, name, is_master)")
    .eq("user_id", userData.user.id);

  if (rolesError && !metadataStaff) throw rolesError;

  const displayName =
    (userData.user.user_metadata?.full_name as string | undefined) ??
    (userData.user.user_metadata?.name as string | undefined) ??
    null;

  const list: MyMembership[] = ((roleRows ?? []) as unknown as CurrentRoleRow[]).map((row) => {
    const isMasterCompany = row.companies?.is_master === true;
    return {
      id: row.id,
      company_id: row.company_id,
      unit_id: null,
      profile_id: row.role,
      display_name: displayName,
      email: userData.user.email ?? null,
      is_active: true,
      companies: row.companies,
      profiles: {
        id: row.role,
        slug: row.role,
        name: roleLabels[row.role],
        is_master_profile: isMasterCompany && (row.role === "admin" || row.role === "gestor"),
      },
    };
  });

  const isSuperAdmin = metadataSuperAdmin;
  const isImpulsionandoStaff =
    metadataStaff || list.some((membership) => membership.profiles?.is_master_profile === true);

  return { user: userData.user, memberships: list, isSuperAdmin, isImpulsionandoStaff };
}
