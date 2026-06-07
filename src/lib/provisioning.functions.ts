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

    const [
      { data: companies },
      { data: contracts },
      { data: checklist },
      { data: domain },
      { data: provisioning },
      { data: deploys },
    ] = await Promise.all([
      supabaseAdmin.from("companies").select("id, is_active").eq("is_master", false),
      supabaseAdmin.from("billing_contracts").select("status, recurring_amount"),
      supabaseAdmin.from("onboarding_checklist").select("company_id, item_key, status"),
      supabaseAdmin.from("onboarding_domain_requests").select("company_id, status"),
      supabaseAdmin
        .from("infinitepay_payments")
        .select("provisioning_status, status")
        .eq("status", "paid"),
      supabaseAdmin
        .from("infinitepay_payments")
        .select("provisioning_status")
        .eq("status", "paid"),
    ]);

    const total = companies?.length ?? 0;
    const active = companies?.filter((c: any) => c.is_active).length ?? 0;
    const blocked = (contracts ?? []).filter((c: any) => c.status === "suspended").length;
    const mrr = (contracts ?? []).filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);

    const releasedCompanies = new Set(
      (checklist ?? [])
        .filter((r: any) => r.item_key === "client_released" && r.status === "done")
        .map((r: any) => r.company_id),
    );
    const onboardingCompanies = new Set(
      (checklist ?? [])
        .filter((r: any) => r.item_key === "onboarding_done" && r.status !== "done")
        .map((r: any) => r.company_id),
    );
    const awaitingDomain = new Set(
      (domain ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.company_id),
    );
    const awaitingDeploy = (companies ?? []).filter((c: any) => !releasedCompanies.has(c.id)).length;

    const provisioningPending = (provisioning ?? []).filter((p: any) => p.provisioning_status !== "done").length;
    const provisioningDone = (deploys ?? []).filter((p: any) => p.provisioning_status === "done").length;

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
    };
  });
