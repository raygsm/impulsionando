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

  return {
    ...query,
    bypass,
    enabledSlugs: bypass ? null : query.data ?? new Set<string>(),
    hasModule: (slug: string) => bypass || query.data?.has(slug) === true,
  };
}

/**
 * URL prefix → required module slug. Used by AppShell to gate navigation.
 * Keep in sync with PLAN_MODULES in the payments webhook.
 */
export const MODULE_URL_PREFIXES: { prefix: string; slug: string }[] = [
  { prefix: "/crm", slug: "crm" },
  { prefix: "/customers", slug: "crm" },
  { prefix: "/agenda", slug: "agenda" },
  { prefix: "/ehr", slug: "agenda" }, // prontuário pertence ao módulo de atendimento
  { prefix: "/finance", slug: "financeiro" },
  { prefix: "/sales", slug: "financeiro" },
  { prefix: "/inventory", slug: "financeiro" },
  { prefix: "/bi", slug: "bi" },
  { prefix: "/reports", slug: "bi" },
];

export function requiredModuleFor(pathname: string): string | null {
  for (const { prefix, slug } of MODULE_URL_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return slug;
  }
  return null;
}
