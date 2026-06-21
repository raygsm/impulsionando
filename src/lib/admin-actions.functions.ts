import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

async function logAudit(ctx: any, params: {
  action: string;
  entity: string;
  entity_id?: string | null;
  company_id?: string | null;
  metadata?: any;
}) {
  await ctx.supabase.from("audit_logs" as any).insert({
    user_id: ctx.userId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entity_id ?? null,
    company_id: params.company_id ?? null,
    metadata: { ...(params.metadata ?? {}), source: "admin.actions" },
  });
}

/** 1) Reset demo data for a tenant */
export const resetDemoTenantFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!data.reason || data.reason.trim().length < 5) throw new Error("Motivo obrigatório (mín. 5 caracteres)");

    const { data: comp } = await context.supabase
      .from("companies" as any).select("id,is_demo,name").eq("id", data.companyId).maybeSingle();
    if (!comp) throw new Error("Tenant não encontrado");
    if (!(comp as any).is_demo) throw new Error("Reset só é permitido em tenants demo");

    await logAudit(context, {
      action: "tenant.demo.reset_requested",
      entity: "companies",
      entity_id: data.companyId,
      company_id: data.companyId,
      metadata: { reason: data.reason, tenant_name: (comp as any).name },
    });
    return { ok: true, message: "Reset solicitado e registrado no audit trail." };
  });

/** 2) Suspend billing for a tenant */
export const suspendTenantBillingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!data.reason || data.reason.trim().length < 5) throw new Error("Motivo obrigatório");

    const { error } = await context.supabase
      .from("billing_suspensions" as any)
      .insert({ company_id: data.companyId, reason: data.reason, suspended_by: context.userId });
    if (error) throw new Error(error.message);

    await context.supabase
      .from("companies" as any)
      .update({ status_financial: "suspended", updated_at: new Date().toISOString() })
      .eq("id", data.companyId);

    await logAudit(context, {
      action: "tenant.billing.suspended",
      entity: "companies",
      entity_id: data.companyId,
      company_id: data.companyId,
      metadata: { reason: data.reason },
    });
    return { ok: true };
  });

/** 3) Force payout marked as paid (manual reconciliation) */
export const markPayoutPaidFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { payoutId: string; reason: string; receiptUrl?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!data.reason || data.reason.trim().length < 5) throw new Error("Motivo obrigatório");

    const { data: payout } = await context.supabase
      .from("core_payout_ledger" as any).select("*").eq("id", data.payoutId).maybeSingle();
    if (!payout) throw new Error("Payout não encontrado");

    const { error } = await context.supabase
      .from("core_payout_ledger" as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        marked_paid_at: new Date().toISOString(),
        paid_by: context.userId,
        receipt_url: data.receiptUrl ?? (payout as any).receipt_url,
      })
      .eq("id", data.payoutId);
    if (error) throw new Error(error.message);

    await logAudit(context, {
      action: "payout.marked_paid_manual",
      entity: "core_payout_ledger",
      entity_id: data.payoutId,
      company_id: (payout as any).company_id,
      metadata: { reason: data.reason, net_cents: (payout as any).net_cents },
    });
    return { ok: true };
  });

/** 4) Force re-test of an integration */
export const reTestIntegrationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { integrationId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: row, error } = await context.supabase
      .from("core_integrations" as any)
      .update({ last_check_at: new Date().toISOString() })
      .eq("id", data.integrationId)
      .select("company_id,provider")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await logAudit(context, {
      action: "integration.retest_requested",
      entity: "core_integrations",
      entity_id: data.integrationId,
      company_id: (row as any)?.company_id ?? null,
      metadata: { provider: (row as any)?.provider, reason: data.reason ?? null },
    });
    return { ok: true };
  });

/** 5) Force expire a trial */
export const expireTrialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trialId: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!data.reason || data.reason.trim().length < 5) throw new Error("Motivo obrigatório");

    const { data: row, error } = await context.supabase
      .from("trial_subscriptions" as any)
      .update({ status: "expired", ended_at: new Date().toISOString() })
      .eq("id", data.trialId)
      .select("company_id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await logAudit(context, {
      action: "trial.force_expired",
      entity: "trial_subscriptions",
      entity_id: data.trialId,
      company_id: (row as any)?.company_id ?? null,
      metadata: { reason: data.reason },
    });
    return { ok: true };
  });

/** Action catalog metadata for UI */
export const fetchAdminActionsCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    return {
      actions: [
        {
          key: "reset_demo",
          title: "Resetar dados demo do tenant",
          description: "Solicita limpeza de dados de demonstração. Auditado, sem efeito em tenants reais.",
          category: "Tenant",
          severity: "warn" as const,
          requiresReason: true,
          inputs: [{ key: "companyId", label: "Company ID", type: "uuid" }],
        },
        {
          key: "suspend_billing",
          title: "Suspender billing do tenant",
          description: "Cria registro em billing_suspensions e marca status_financial=suspended.",
          category: "Billing",
          severity: "danger" as const,
          requiresReason: true,
          inputs: [{ key: "companyId", label: "Company ID", type: "uuid" }],
        },
        {
          key: "mark_payout_paid",
          title: "Marcar repasse como pago (manual)",
          description: "Reconciliação manual quando o provedor confirma fora do fluxo automático.",
          category: "Financeiro",
          severity: "warn" as const,
          requiresReason: true,
          inputs: [
            { key: "payoutId", label: "Payout ID", type: "uuid" },
            { key: "receiptUrl", label: "URL do comprovante (opcional)", type: "text", optional: true },
          ],
        },
        {
          key: "retest_integration",
          title: "Re-testar integração",
          description: "Marca a integração para re-verificação (last_check_at).",
          category: "Integrações",
          severity: "info" as const,
          requiresReason: false,
          inputs: [{ key: "integrationId", label: "Integration ID", type: "uuid" }],
        },
        {
          key: "expire_trial",
          title: "Forçar expiração de trial",
          description: "Marca trial como expirado imediatamente. Auditado.",
          category: "Trial",
          severity: "warn" as const,
          requiresReason: true,
          inputs: [{ key: "trialId", label: "Trial ID", type: "uuid" }],
        },
      ],
    };
  });
