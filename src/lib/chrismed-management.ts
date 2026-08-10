import { redirect } from "@tanstack/react-router";
import { fetchCurrentUser } from "@/lib/auth";
import { CHRISMED_COMPANY_ID } from "@/lib/chrismed";

const CHRISMED_MANAGEMENT_PROFILES = new Set([
  "gestor-empresa",
  "admin-unidade",
  "gestor",
  "admin",
]);

/**
 * Gate único para as telas operacionais CHRISMED.
 * Autoriza o MASTER/STAFF Impulsionando e usuários com vínculo ativo no tenant.
 * A decisão usa app_metadata e vínculos protegidos, nunca campos editáveis do perfil.
 */
export async function requireChrismedManagement() {
  const current = await fetchCurrentUser();
  if (!current) throw redirect({ to: "/auth" });

  const hasChrismedMembership = current.memberships.some(
    (membership) =>
      membership.company_id === CHRISMED_COMPANY_ID &&
      membership.is_active &&
      !!membership.profiles?.slug &&
      CHRISMED_MANAGEMENT_PROFILES.has(membership.profiles.slug),
  );

  if (!current.isSuperAdmin && !current.isImpulsionandoStaff && !hasChrismedMembership) {
    throw redirect({ to: "/dashboard" });
  }

  return current;
}
