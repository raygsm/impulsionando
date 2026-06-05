import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Returns the set of module slugs enabled for the current user's primary company.
 * Super admins / impulsionando staff always get full access (returns null = bypass).
 */
export function useCompanyModules() {
  const { data: currentUser } = useCurrentUser();
  const companyId = currentUser?.memberships?.[0]?.company_id ?? null;
  const bypass = !!currentUser?.isImpulsionandoStaff;

  const query = useQuery({
    queryKey: ["company-modules", companyId],
    enabled: !!companyId && !bypass,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_modules")
        .select("is_enabled, modules!inner(slug)")
        .eq("company_id", companyId!)
        .eq("is_enabled", true);
      if (error) throw error;
      const slugs = new Set<string>(
        (data ?? []).map((r: any) => r.modules?.slug).filter(Boolean)
      );
      return slugs;
    },
  });

  // Alias de retrocompatibilidade: "financeiro" foi unificado em "erp".
  const SLUG_EQUIV: Record<string, string[]> = {
    erp: ["erp", "financeiro"],
    financeiro: ["erp", "financeiro"],
  };

  return {
    ...query,
    bypass,
    enabledSlugs: bypass ? null : query.data ?? new Set<string>(),
    hasModule: (slug: string) => {
      if (bypass) return true;
      const candidates = SLUG_EQUIV[slug] ?? [slug];
      return candidates.some((s) => query.data?.has(s) === true);
    },
  };
}

/**
 * URL prefix → required módulo-mãe slug. Used by AppShell to gate navigation.
 * Keep in sync with PLAN_MODULES no webhook do Paddle e com src/data/motherModules.ts.
 *
 * Para retrocompat, "financeiro" também é aceito como alias de "erp" via hasModule().
 */
export const MODULE_URL_PREFIXES: { prefix: string; slug: string }[] = [
  // CRM
  { prefix: "/crm", slug: "crm" },
  { prefix: "/customers", slug: "crm" },
  // Agenda & Reservas
  { prefix: "/agenda", slug: "agenda" },
  // Saúde & Prontuário
  { prefix: "/ehr", slug: "saude" },
  // ERP (financeiro, usuários, fiscal, contratos)
  { prefix: "/finance", slug: "erp" },
  { prefix: "/users", slug: "erp" },
  // Commerce & Pagamentos
  { prefix: "/sales", slug: "commerce" },
  { prefix: "/checkout", slug: "commerce" },
  // PDV & Operação Presencial
  { prefix: "/pdv", slug: "pdv" },
  // Estoque & Fornecedores
  { prefix: "/inventory", slug: "estoque" },
  // BI & Dashboards
  { prefix: "/bi", slug: "bi" },
  { prefix: "/reports", slug: "bi" },
  // Eventos & Ingressos
  { prefix: "/eventos", slug: "eventos" },
  // Delivery & Logística
  { prefix: "/delivery", slug: "delivery" },
  // Automação & Comunicação
  { prefix: "/automacao", slug: "automacao" },
  // Fidelização & Afiliados
  { prefix: "/fidelizacao", slug: "fidelizacao" },
  // Área do Cliente
  { prefix: "/portal-cliente", slug: "area_cliente" },
];

export function requiredModuleFor(pathname: string): string | null {
  for (const { prefix, slug } of MODULE_URL_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return slug;
  }
  return null;
}
