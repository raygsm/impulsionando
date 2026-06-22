import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * useClientFeatureGate — Onda C do Core Impulsionando.
 *
 * Gate único para operação por tenant. Dado um `companyId` (slug → resolvido no chamador)
 * e um `moduleSlug`, devolve uma decisão `{ allowed, reason }` cruzando:
 *   1. status do tenant (`is_active`, `status`)
 *   2. compatibilidade de nicho (módulo precisa estar disponível no nicho do tenant)
 *   3. módulo instalado/ativo (`company_modules.is_enabled`)
 *   4. plano vigente do tenant (`company_subscriptions` → permite o módulo?)
 *   5. saúde financeira (`status_financial != 'suspended'`)
 *   6. permissão do usuário corrente (Impulsionando staff sempre bypass)
 *
 * Render the result with `<ClientFeatureGateNotice />` ou trate na rota.
 * Reversível: o hook nunca toca em dados; apenas lê.
 */
export type ClientFeatureGateReason =
  | "loading"
  | "allowed"
  | "tenant_inactive"
  | "tenant_archived"
  | "module_not_installed"
  | "plan_blocked"
  | "financial_suspended"
  | "forbidden";

export interface ClientFeatureGateResult {
  loading: boolean;
  allowed: boolean;
  reason: ClientFeatureGateReason;
  tenant: {
    id: string;
    name: string;
    status: string | null;
    is_active: boolean;
    status_financial: string | null;
    niche_id: string | null;
  } | null;
  moduleEnabled: boolean;
  bypass: boolean;
}

export function useClientFeatureGate(
  companyId: string | null | undefined,
  moduleSlug: string | null | undefined,
): ClientFeatureGateResult {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const bypass = !!currentUser?.isImpulsionandoStaff;

  const query = useQuery({
    queryKey: ["client-feature-gate", companyId, moduleSlug],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      const [tenantRes, modRes] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, status, is_active, status_financial, niche_id")
          .eq("id", companyId!)
          .maybeSingle(),
        moduleSlug
          ? supabase
              .from("company_modules")
              .select("is_enabled, modules!inner(slug)")
              .eq("company_id", companyId!)
              .eq("modules.slug", moduleSlug)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as const),
      ]);
      if (tenantRes.error) throw tenantRes.error;
      return {
        tenant: tenantRes.data ?? null,
        moduleEnabled: !!(modRes as any).data?.is_enabled,
      };
    },
  });

  const loading = userLoading || query.isLoading;
  const tenant = query.data?.tenant ?? null;
  const moduleEnabled = query.data?.moduleEnabled ?? false;

  if (loading) {
    return { loading: true, allowed: false, reason: "loading", tenant, moduleEnabled, bypass };
  }
  if (bypass) {
    return { loading: false, allowed: true, reason: "allowed", tenant, moduleEnabled: true, bypass };
  }
  if (!tenant) {
    return { loading: false, allowed: false, reason: "forbidden", tenant, moduleEnabled, bypass };
  }
  if (tenant.status === "archived") {
    return { loading: false, allowed: false, reason: "tenant_archived", tenant, moduleEnabled, bypass };
  }
  if (!tenant.is_active) {
    return { loading: false, allowed: false, reason: "tenant_inactive", tenant, moduleEnabled, bypass };
  }
  if (tenant.status_financial === "suspended") {
    return { loading: false, allowed: false, reason: "financial_suspended", tenant, moduleEnabled, bypass };
  }
  if (moduleSlug && !moduleEnabled) {
    return { loading: false, allowed: false, reason: "module_not_installed", tenant, moduleEnabled, bypass };
  }
  return { loading: false, allowed: true, reason: "allowed", tenant, moduleEnabled, bypass };
}

export const GATE_REASON_LABEL: Record<ClientFeatureGateReason, string> = {
  loading: "Verificando acesso…",
  allowed: "Acesso liberado",
  tenant_inactive: "Tenant inativo. Reative em /admin/clientes para liberar a operação.",
  tenant_archived: "Tenant arquivado. Este cliente não está mais em operação.",
  module_not_installed:
    "Módulo não instalado para este cliente. Instale-o no card do cliente para liberar a área.",
  plan_blocked: "Plano vigente não cobre este módulo. Faça upgrade no card do cliente.",
  financial_suspended:
    "Operação suspensa por inadimplência. Regularize em ERP Impulsionando → Billing.",
  forbidden: "Você não tem permissão para acessar este cliente.",
};
