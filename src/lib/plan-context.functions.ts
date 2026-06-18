import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Contexto de plano do usuário autenticado.
 * Retorna o plano vigente da empresa do usuário (a partir do contrato
 * de billing mais recente) e se o usuário é staff Impulsionando.
 *
 * Usado para gates de módulo (ex.: Afiliados requer Profissional/Completo).
 */
export const fetchUserPlanContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: staffData } = await supabase.rpc("is_impulsionando_staff");
    const isStaff = Boolean(staffData);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    const companyId = profile?.company_id ?? null;
    if (!companyId) {
      return { isStaff, companyId: null, planCode: null, planName: null, includedModules: [] as string[] };
    }

    const { data: contract } = await supabase
      .from("billing_contracts")
      .select("plan_id, status, created_at")
      .eq("company_id", companyId)
      .in("status", ["active", "trialing", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!contract?.plan_id) {
      return { isStaff, companyId, planCode: null, planName: null, includedModules: [] as string[] };
    }

    const { data: plan } = await supabase
      .from("billing_plans")
      .select("code, name, included_modules")
      .eq("id", contract.plan_id)
      .maybeSingle();

    return {
      isStaff,
      companyId,
      planCode: plan?.code ?? null,
      planName: plan?.name ?? null,
      includedModules: (plan?.included_modules ?? []) as string[],
    };
  });
