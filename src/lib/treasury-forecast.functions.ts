import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Cash Flow & Treasury Forecast — Fase 34.
 * Projeção 30/60/90 dias do caixa Impulsionando (visão core):
 *
 *  Entradas previstas:
 *   - billing_invoices em aberto (open/pending/overdue) com due_date no horizonte
 *   - Recorrência projetada dos contratos ativos (cycle mensal) para os próximos 1-3 meses
 *
 *  Saídas previstas:
 *   - aff_payouts pendentes (requested/approved não pagos) — vencem cedo
 *   - Custo recorrente de coproducers (% sobre MRR ativo + valor fixo)
 *
 *  Indicadores:
 *   - Net forecast por bucket (30/60/90d)
 *   - Recebido últimos 30d (mpago_payments approved + billing_invoices paid)
 *   - Overdue aging (0-15, 16-30, 31-60, 60+ dias)
 */
export const getTreasuryForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const in60 = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);
    const in90 = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
    const since30Iso = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [openInvRes, contractsRes, paidInvRes, mpagoRes, payoutsRes, coprodRes] = await Promise.all([
      supabaseAdmin
        .from("billing_invoices")
        .select("id, company_id, amount, status, due_date")
        .in("status", ["open", "pending", "overdue"])
        .limit(20000),
      supabaseAdmin
        .from("billing_contracts")
        .select("id, company_id, status, recurring_amount, next_due_date")
        .eq("status", "active")
        .limit(10000),
      supabaseAdmin
        .from("billing_invoices")
        .select("id, amount, paid_at")
        .eq("status", "paid")
        .gte("paid_at", since30Iso)
        .limit(20000),
      supabaseAdmin
        .from("mpago_payments")
        .select("amount_cents, status, approved_at")
        .eq("status", "approved")
        .gte("approved_at", since30Iso)
        .limit(20000),
      supabaseAdmin
        .from("aff_payouts")
        .select("id, amount, status, requested_at, approved_at")
        .in("status", ["solicitado", "aprovado"])
        .limit(5000),
      supabaseAdmin
        .from("aff_coproducers")
        .select("participation_pct, fixed_amount, status")
        .eq("status", "aprovado")
        .limit(500),
    ]);

    const openInvoices = openInvRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const paidInvoices = paidInvRes.data ?? [];
    const mpagoApproved = mpagoRes.data ?? [];
    const payouts = payoutsRes.data ?? [];
    const coproducers = coprodRes.data ?? [];

    // ===== Entradas: invoices abertas por bucket =====
    const buckets = {
      d30: { inflowsScheduled: 0, inflowsRecurring: 0, outflows: 0 },
      d60: { inflowsScheduled: 0, inflowsRecurring: 0, outflows: 0 },
      d90: { inflowsScheduled: 0, inflowsRecurring: 0, outflows: 0 },
    };

    for (const inv of openInvoices) {
      if (!inv.due_date) continue;
      const amount = Number(inv.amount ?? 0);
      if (inv.due_date <= in30) buckets.d30.inflowsScheduled += amount;
      else if (inv.due_date <= in60) buckets.d60.inflowsScheduled += amount;
      else if (inv.due_date <= in90) buckets.d90.inflowsScheduled += amount;
    }

    // Recorrência projetada (ciclo mensal): cada contrato ativo gera 1 invoice/mês nos próximos 3 meses
    // Considera-se que a invoice do mês corrente já está na lista openInvoices ou foi paga.
    // Para evitar dupla contagem, recorrência adiciona meses 2 e 3 (d60 e d90).
    let recurringMonthly = 0;
    for (const c of contracts) recurringMonthly += Number(c.recurring_amount ?? 0);
    buckets.d60.inflowsRecurring += recurringMonthly;
    buckets.d90.inflowsRecurring += recurringMonthly;

    // ===== Saídas: payouts pendentes (assumido pagamento em ≤30d) =====
    const pendingPayoutsTotal = payouts.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    buckets.d30.outflows += pendingPayoutsTotal;

    // Custo coproducers (recorrente sobre MRR ativo)
    const activeMrr = recurringMonthly;
    const coproducerCostMonthly =
      (activeMrr * coproducers.reduce((s, c) => s + Number(c.participation_pct ?? 0), 0)) / 100 +
      coproducers.reduce((s, c) => s + Number(c.fixed_amount ?? 0), 0);
    buckets.d30.outflows += coproducerCostMonthly;
    buckets.d60.outflows += coproducerCostMonthly;
    buckets.d90.outflows += coproducerCostMonthly;

    // ===== Recebido últimos 30d =====
    const receivedFromInvoices = paidInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const receivedFromMpago = mpagoApproved.reduce((s, m) => s + Number(m.amount_cents ?? 0) / 100, 0);
    const received30d = receivedFromInvoices + receivedFromMpago;

    // ===== Aging das vencidas =====
    const aging = { d0_15: 0, d16_30: 0, d31_60: 0, d60plus: 0 };
    const agingCount = { d0_15: 0, d16_30: 0, d31_60: 0, d60plus: 0 };
    for (const inv of openInvoices) {
      if (!inv.due_date || inv.due_date >= today) continue;
      const daysOver = Math.floor(
        (now.getTime() - new Date(inv.due_date).getTime()) / 86400000,
      );
      const amount = Number(inv.amount ?? 0);
      if (daysOver <= 15) { aging.d0_15 += amount; agingCount.d0_15 += 1; }
      else if (daysOver <= 30) { aging.d16_30 += amount; agingCount.d16_30 += 1; }
      else if (daysOver <= 60) { aging.d31_60 += amount; agingCount.d31_60 += 1; }
      else { aging.d60plus += amount; agingCount.d60plus += 1; }
    }

    const totalOverdue = aging.d0_15 + aging.d16_30 + aging.d31_60 + aging.d60plus;

    const forecast = (["d30", "d60", "d90"] as const).map((k) => {
      const b = buckets[k];
      const inflows = b.inflowsScheduled + b.inflowsRecurring;
      return {
        bucket: k,
        label: k === "d30" ? "Próximos 30 dias" : k === "d60" ? "30–60 dias" : "60–90 dias",
        inflowsScheduled: Math.round(b.inflowsScheduled),
        inflowsRecurring: Math.round(b.inflowsRecurring),
        outflows: Math.round(b.outflows),
        net: Math.round(inflows - b.outflows),
      };
    });

    const cumulativeNet = forecast.reduce((s, f) => s + f.net, 0);

    return {
      generatedAt: now.toISOString(),
      kpis: {
        activeContracts: contracts.length,
        activeMrr: Math.round(activeMrr),
        received30d: Math.round(received30d),
        openInvoicesCount: openInvoices.length,
        openInvoicesTotal: Math.round(openInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0)),
        pendingPayouts: payouts.length,
        pendingPayoutsTotal: Math.round(pendingPayoutsTotal),
        coproducerCostMonthly: Math.round(coproducerCostMonthly),
        totalOverdue: Math.round(totalOverdue),
        cumulativeNet90d: cumulativeNet,
      },
      forecast,
      aging: {
        buckets: [
          { label: "0–15 dias", amount: Math.round(aging.d0_15), count: agingCount.d0_15 },
          { label: "16–30 dias", amount: Math.round(aging.d16_30), count: agingCount.d16_30 },
          { label: "31–60 dias", amount: Math.round(aging.d31_60), count: agingCount.d31_60 },
          { label: "60+ dias", amount: Math.round(aging.d60plus), count: agingCount.d60plus },
        ],
      },
    };
  });
