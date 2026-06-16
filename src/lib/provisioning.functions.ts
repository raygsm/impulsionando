import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Reprocessa o provisionamento de um pagamento (idempotente; staff only). */
export const reprovisionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderNsu: string }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { autoProvisionFromPayment } = await import("./auto-provisioning.server");
    const result = await autoProvisionFromPayment(data.orderNsu);
    return result;
  });

/** Lista pagamentos pagos e seu status de provisionamento (staff only). */
export const listProvisioningQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data } = await supabaseAdmin
      .from("infinitepay_payments")
      .select(
        "order_nsu, customer_name, customer_email, amount, status, paid_at, provisioning_status, provisioned_at, empresa_id, module_slugs, modulo_id",
      )
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(100);
    return { payments: data ?? [] };
  });

/** Indicadores agregados para o dashboard executivo do Core Manager. */
export const coreExecutiveDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endPrevMonth = startMonth;
    const in30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    const [
      { data: companies },
      { data: contracts },
      { data: checklist },
      { data: domain },
      { data: provisioning },
      { data: deploys },
      { data: niches },
      { data: companyModules },
      { data: modulesCatalog },
      { data: plans },
      { data: overdueInvoices },
      { data: paidThisMonth },
      { data: upcomingInvoices },
      { data: companiesCurMonth },
      { data: companiesPrevMonth },
      { data: trialAll },
    ] = await Promise.all([
      supabaseAdmin.from("companies").select("id, is_active, niche_id, created_at").eq("is_master", false),
      supabaseAdmin.from("billing_contracts").select("status, recurring_amount, plan_id"),
      supabaseAdmin.from("onboarding_checklist").select("company_id, item_key, status"),
      supabaseAdmin.from("onboarding_domain_requests").select("company_id, status"),
      supabaseAdmin.from("infinitepay_payments").select("provisioning_status, status").eq("status", "paid"),
      supabaseAdmin.from("infinitepay_payments").select("provisioning_status").eq("status", "paid"),
      supabaseAdmin.from("niches").select("id, name"),
      supabaseAdmin.from("company_modules").select("module_id, is_enabled").eq("is_enabled", true),
      supabaseAdmin.from("modules").select("id, name"),
      supabaseAdmin.from("billing_plans").select("id, name"),
      supabaseAdmin.from("billing_invoices").select("id, amount, status, due_date").in("status", ["open", "overdue", "pending"]),
      supabaseAdmin.from("billing_invoices").select("amount, paid_at").eq("status", "paid").gte("paid_at", startMonth),
      supabaseAdmin.from("billing_invoices").select("amount, due_date").in("status", ["open", "pending"]).gte("due_date", today).lte("due_date", in30),
      supabaseAdmin.from("companies").select("id").eq("is_master", false).gte("created_at", startMonth),
      supabaseAdmin.from("companies").select("id").eq("is_master", false).gte("created_at", startPrevMonth).lt("created_at", endPrevMonth),
      supabaseAdmin.from("trial_subscriptions").select("status"),
    ]);


    const total = companies?.length ?? 0;
    const active = companies?.filter((c: any) => c.is_active).length ?? 0;
    const blocked = (contracts ?? []).filter((c: any) => c.status === "suspended").length;
    const mrr = (contracts ?? []).filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);

    const releasedCompanies = new Set(
      (checklist ?? []).filter((r: any) => r.item_key === "client_released" && r.status === "done").map((r: any) => r.company_id),
    );
    const onboardingCompanies = new Set(
      (checklist ?? []).filter((r: any) => r.item_key === "onboarding_done" && r.status !== "done").map((r: any) => r.company_id),
    );
    const awaitingDomain = new Set(
      (domain ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.company_id),
    );
    const awaitingDeploy = (companies ?? []).filter((c: any) => !releasedCompanies.has(c.id)).length;
    const provisioningPending = (provisioning ?? []).filter((p: any) => p.provisioning_status !== "done").length;
    const provisioningDone = (deploys ?? []).filter((p: any) => p.provisioning_status === "done").length;

    // Clientes por nicho
    const nicheMap = new Map((niches ?? []).map((n: any) => [n.id, n.name]));
    const byNicheCount = new Map<string, number>();
    for (const c of companies ?? []) {
      const key = (nicheMap.get((c as any).niche_id) as string | undefined) ?? "Sem nicho";
      byNicheCount.set(key, (byNicheCount.get(key) ?? 0) + 1);
    }
    const byNiche = Array.from(byNicheCount, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Top módulos
    const moduleMap = new Map((modulesCatalog ?? []).map((m: any) => [m.id, m.name]));
    const moduleCount = new Map<string, number>();
    for (const cm of companyModules ?? []) {
      const key = (moduleMap.get((cm as any).module_id) as string | undefined) ?? "—";
      moduleCount.set(key, (moduleCount.get(key) ?? 0) + 1);
    }
    const topModules = Array.from(moduleCount, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // Top planos (contratos ativos)
    const planMap = new Map((plans ?? []).map((p: any) => [p.id, p.name]));
    const planCount = new Map<string, number>();
    for (const ct of contracts ?? []) {
      if ((ct as any).status !== "active") continue;
      const key = (planMap.get((ct as any).plan_id) as string | undefined) ?? "—";
      planCount.set(key, (planCount.get(key) ?? 0) + 1);
    }
    const topPlans = Array.from(planCount, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // Inadimplência
    const today = new Date().toISOString().slice(0, 10);
    const overdueList = (overdueInvoices ?? []).filter((i: any) => i.due_date && i.due_date < today);
    const overdueAmount = overdueList.reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0);
    const overdueCount = overdueList.length;

    return {
      total,
      active,
      blocked,
      mrr,
      onboarding: onboardingCompanies.size,
      awaitingDomain: awaitingDomain.size,
      awaitingDeploy,
      provisioningPending,
      provisioningDone,
      byNiche,
      topModules,
      topPlans,
      overdueCount,
      overdueAmount,
    };
  });
