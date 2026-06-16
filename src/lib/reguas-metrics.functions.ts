import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Métricas agregadas das réguas N8N + funil do Impulsionando.
 *
 * Retorna, para a janela de N dias, contagens por régua, por workflow e por
 * status (captação → conversão → relacionamento → retenção), cruzando com
 * marketing_leads, trial_subscriptions, subscriptions e billing_invoices.
 *
 * Acesso restrito ao staff Impulsionando (validado via RLS + check explícito).
 */

type Window = { days: number };

export const fetchReguasMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Window) => ({
    days: Math.min(Math.max(Number(d?.days ?? 30), 1), 365),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, {
      _user: userId,
    } as never);
    if (!isStaff) {
      throw new Error("Acesso restrito à equipe Impulsionando");
    }

    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Captação — leads do site
    const { count: leads } = await supabaseAdmin
      .from("marketing_leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    // 2) Conversão — trials iniciados, convertidos, expirados
    const trialsBase = supabaseAdmin
      .from("trial_subscriptions")
      .select("status", { count: "exact" })
      .gte("created_at", since);
    const [{ data: trialsRows }, trialConv, trialExp] = await Promise.all([
      trialsBase,
      supabaseAdmin
        .from("trial_subscriptions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "convertido"),
      supabaseAdmin
        .from("trial_subscriptions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .in("status", ["cancelado", "suspenso"]),
    ]);
    const trialsStarted = trialsRows?.length ?? 0;

    // 3) Conversão de pagamento — invoices paid
    const [paidQ, openQ, overdueQ] = await Promise.all([
      supabaseAdmin
        .from("billing_invoices")
        .select("amount", { count: "exact" })
        .gte("created_at", since)
        .eq("status", "paid"),
      supabaseAdmin
        .from("billing_invoices")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "open"),
      supabaseAdmin
        .from("billing_invoices")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "overdue"),
    ]);
    const paidRevenueCents = (paidQ.data ?? []).reduce(
      (sum, r) => sum + Math.round(Number((r as { amount: number }).amount ?? 0) * 100),
      0,
    );

    // 4) Retenção — assinaturas ativas / canceladas no período
    const [activeSubs, cancelledSubs] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "trialing", "past_due"]),
      supabaseAdmin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", since)
        .eq("status", "canceled"),
    ]);

    // 5) Réguas N8N — agregado por régua/status/workflow
    const { data: n8nRows } = await supabaseAdmin
      .from("n8n_workflow_runs")
      .select("regua,status,workflow_name,channel")
      .gte("created_at", since);

    const byRegua: Record<string, { total: number; ok: number; failed: number; retry: number }> =
      {};
    const byWorkflow: Record<
      string,
      { regua: string; total: number; ok: number; failed: number }
    > = {};
    const byChannel: Record<string, number> = {};
    for (const r of (n8nRows ?? []) as Array<{
      regua: string;
      status: string;
      workflow_name: string;
      channel: string | null;
    }>) {
      byRegua[r.regua] ??= { total: 0, ok: 0, failed: 0, retry: 0 };
      byRegua[r.regua].total++;
      if (r.status === "ok") byRegua[r.regua].ok++;
      if (r.status === "failed") byRegua[r.regua].failed++;
      if (r.status === "retry") byRegua[r.regua].retry++;

      byWorkflow[r.workflow_name] ??= { regua: r.regua, total: 0, ok: 0, failed: 0 };
      byWorkflow[r.workflow_name].total++;
      if (r.status === "ok") byWorkflow[r.workflow_name].ok++;
      if (r.status === "failed") byWorkflow[r.workflow_name].failed++;

      if (r.channel) byChannel[r.channel] = (byChannel[r.channel] ?? 0) + 1;
    }

    return {
      windowDays: data.days,
      capacao: {
        leads: leads ?? 0,
      },
      conversao: {
        trialsStarted,
        trialsConverted: trialConv.count ?? 0,
        trialsLost: trialExp.count ?? 0,
        trialConvRate:
          trialsStarted > 0 ? Math.round(((trialConv.count ?? 0) / trialsStarted) * 1000) / 10 : 0,
        invoicesPaid: paidQ.count ?? 0,
        invoicesOpen: openQ.count ?? 0,
        invoicesOverdue: overdueQ.count ?? 0,
        paidRevenueCents,
      },
      retencao: {
        activeSubs: activeSubs.count ?? 0,
        cancelledSubs: cancelledSubs.count ?? 0,
        churnRate:
          (activeSubs.count ?? 0) + (cancelledSubs.count ?? 0) > 0
            ? Math.round(
                ((cancelledSubs.count ?? 0) /
                  ((activeSubs.count ?? 0) + (cancelledSubs.count ?? 0))) *
                  1000,
              ) / 10
            : 0,
      },
      n8n: {
        byRegua,
        byWorkflow,
        byChannel,
        totalEvents: n8nRows?.length ?? 0,
      },
    };
  });

export const fetchReguasFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number }) => ({ limit: Math.min(d?.limit ?? 50, 200) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, {
      _user: userId,
    } as never);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("n8n_workflow_runs")
      .select(
        "id,workflow_name,regua,step,status,channel,contact_email,error,created_at",
      )
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return { items: rows ?? [] };
  });
