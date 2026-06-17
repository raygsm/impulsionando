import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

type Props = { companyId: string | null | undefined };

/**
 * Pílula no Topbar mostrando progresso do onboarding.
 * Visível apenas quando a empresa não está 100% configurada.
 */
export function OnboardingStatusPill({ companyId }: Props) {
  const { data } = useQuery({
    queryKey: ["onboarding-pill", companyId],
    enabled: Boolean(companyId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!companyId) return null;
      const [company, modules, members, domain, email] = await Promise.all([
        supabase.from("companies").select("niche_id").eq("id", companyId).maybeSingle(),
        supabase.from("company_modules").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_enabled", true),
        supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("onboarding_domain_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("onboarding_email_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);
      const steps = [
        Boolean(company.data?.niche_id),
        (modules.count ?? 0) > 0,
        (members.count ?? 0) > 1,
        (domain.count ?? 0) > 0,
        (email.count ?? 0) > 0,
      ];
      const done = steps.filter(Boolean).length;
      return { done, total: steps.length };
    },
  });

  if (!companyId || !data) return null;
  if (data.done >= data.total) return null;

  const pct = Math.round((data.done / data.total) * 100);
  const isUrgent = data.done === 0;

  return (
    <Link
      to="/onboarding"
      className={`hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        isUrgent
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
      }`}
      title="Continuar onboarding"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Onboarding {pct}%
    </Link>
  );
}
