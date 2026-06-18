import { useMemo } from "react";
import { useCurrentUser } from "./use-current-user";
import { useImpersonation } from "./use-impersonation";

export type AudienceVariant = "core" | "white-label" | "empresa" | "consumidor";

export interface AudienceState {
  audience: AudienceVariant;
  label: string;
  /** Quando true, o usuário está em uma audiência diferente da sua audiência "nativa"
   *  (ex.: super admin atuando em modo cliente via impersonação). */
  isViewingAs: boolean;
}

const LABELS: Record<AudienceVariant, string> = {
  core: "Core Impulsionando",
  "white-label": "Parceiro White Label",
  empresa: "Empresa cliente",
  consumidor: "Consumidor final",
};

/**
 * Deriva a audiência atual a partir do usuário e do estado de impersonação.
 *
 * Regras (Fase 1 — base):
 *  - super admin sem impersonar → "core"
 *  - super admin impersonando    → "empresa" (com isViewingAs=true)
 *  - todos os demais             → "empresa"
 *
 * WL e Consumidor ficam preparados para Fases seguintes (flags ainda não existem
 * no perfil; serão derivados de `companies.is_white_label` e de membership de clube).
 */
export function useAudience(): AudienceState {
  const { data: user } = useCurrentUser();
  const { isImpersonating } = useImpersonation();

  return useMemo<AudienceState>(() => {
    if (!user) return { audience: "consumidor", label: LABELS.consumidor, isViewingAs: false };

    if (user.isSuperAdmin && !isImpersonating) {
      return { audience: "core", label: LABELS.core, isViewingAs: false };
    }
    if (user.isSuperAdmin && isImpersonating) {
      return { audience: "empresa", label: LABELS.empresa, isViewingAs: true };
    }

    // Sem memberships ativas → consumidor (acesso apenas à área Clube/usuário)
    if (!user.memberships?.length) {
      return { audience: "consumidor", label: LABELS.consumidor, isViewingAs: false };
    }

    // Heurística inicial White Label (Fase 3 substitui por flag `companies.is_white_label`)
    const hasMasterCompany = user.memberships.some((m) => m.companies?.is_master);
    if (hasMasterCompany && user.isImpulsionandoStaff) {
      return { audience: "white-label", label: LABELS["white-label"], isViewingAs: false };
    }

    return { audience: "empresa", label: LABELS.empresa, isViewingAs: false };
  }, [user, isImpersonating]);
}
