/**
 * ERP Financeiro Consolidado — M8.2
 * Server function única que cruza fin_transactions, fin_accounts, fin_categories,
 * billing_invoices, mpago_payments e devolve DRE mensal + fluxo de caixa diário
 * + saldo conciliado por conta. Escopo: empresa do usuário (RLS) ou seleção
 * staff via `company_id` opcional.
 *
 * Convenções:
 *  - fin_transactions.kind ∈ { 'income', 'expense' }
 *  - fin_transactions.status ∈ { 'paid', 'pending', 'overdue', 'canceled' }
 *  - Receita "realizada" = status='paid' AND paid_at no período
 *  - Receita "provisionada" = status IN ('pending','overdue') AND due_date no período
 *  - Saldo conciliado = opening_balance + sum(amount realizadas até hoje)
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({
  company_id: z.string().uuid().optional(),
  months: z.number().int().min(1).max(24).default(6),
});

type Row = {
  account_id: string | null;
  category_id: string | null;
  amount: number;
  net_amount: number | null;
  fee: number | null;
  kind: string;
  status: string;
  due_date: string;
  paid_at: string | null;
};

function ymKey(d: string) {
  return d.slice(0, 7); // YYYY-MM
}
function ymdKey(d: string) {
  return d.slice(0, 10);
}

export const getFinancialErp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sb = context.supabase; // RLS aplicada como o usuário
    const months = data.months;
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months + 1);
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);
    const fromIso = fromDate.toISOString();
    const todayIso = new Date().toISOString();

    // Filtro opcional por empresa (staff)
    let txQuery = sb
      .from("fin_transactions")
      .select(
        "account_id, category_id, amount, net_amount, fee, kind, status, due_date, paid_at",
      )
      .gte("due_date", fromIso.slice(0, 10))
      .limit(50000);
    let acctQuery = sb.from("fin_accounts").select("id, name, type, opening_balance, current_balance, is_active");
    let catQuery = sb.from("fin_categories").select("id, name, kind, color");
    let invQuery = sb
      .from("billing_invoices")
      .select("id, status, total, paid_at, due_at, created_at")
      .gte("created_at", fromIso)
      .limit(20000);
    let mpQuery = sb
      .from("mpago_payments")
      .select("id, status, transaction_amount, date_approved, created_at")
      .gte("created_at", fromIso)
      .limit(20000);

    if (data.company_id) {
      txQuery = txQuery.eq("company_id", data.company_id);
      acctQuery = acctQuery.eq("company_id", data.company_id);
      catQuery = catQuery.eq("company_id", data.company_id);
    }

    const [txRes, acctRes, catRes, invRes, mpRes] = await Promise.all([
      txQuery,
      acctQuery,
      catQuery,
      invQuery,
      mpQuery,
    ]);

    const err = txRes.error || acctRes.error || catRes.error || invRes.error || mpRes.error;
    if (err) throw new Error(err.message);

    const tx = (txRes.data ?? []) as Row[];
    const accounts = acctRes.data ?? [];
    const categories = catRes.data ?? [];
    const invoices = invRes.data ?? [];
    const mp = mpRes.data ?? [];

    // ─────────── DRE mensal ───────────
    type DreRow = {
      month: string;
      revenue_realized: number;
      revenue_pending: number;
      expense_realized: number;
      expense_pending: number;
      fees: number;
      net: number;
    };
    const dreMap = new Map<string, DreRow>();
    const ensure = (m: string): DreRow => {
      let r = dreMap.get(m);
      if (!r) {
        r = { month: m, revenue_realized: 0, revenue_pending: 0, expense_realized: 0, expense_pending: 0, fees: 0, net: 0 };
        dreMap.set(m, r);
      }
      return r;
    };

    for (const t of tx) {
      const amt = Number(t.net_amount ?? t.amount ?? 0);
      const fee = Number(t.fee ?? 0);
      const ref = t.paid_at ?? t.due_date;
      if (!ref) continue;
      const m = ymKey(ref);
      const row = ensure(m);
      row.fees += fee;
      if (t.kind === "income") {
        if (t.status === "paid") row.revenue_realized += amt;
        else if (t.status === "pending" || t.status === "overdue") row.revenue_pending += amt;
      } else if (t.kind === "expense") {
        if (t.status === "paid") row.expense_realized += amt;
        else if (t.status === "pending" || t.status === "overdue") row.expense_pending += amt;
      }
    }
    for (const r of dreMap.values()) {
      r.net = r.revenue_realized - r.expense_realized - r.fees;
    }
    const dre = Array.from(dreMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // ─────────── Fluxo de caixa diário (últimos 90d) ───────────
    const cashStart = new Date();
    cashStart.setDate(cashStart.getDate() - 90);
    const cashStartKey = cashStart.toISOString().slice(0, 10);
    const cashMap = new Map<string, { date: string; inflow: number; outflow: number; balance: number }>();
    for (const t of tx) {
      if (t.status !== "paid" || !t.paid_at) continue;
      const k = ymdKey(t.paid_at);
      if (k < cashStartKey) continue;
      const row = cashMap.get(k) ?? { date: k, inflow: 0, outflow: 0, balance: 0 };
      const amt = Number(t.net_amount ?? t.amount ?? 0);
      if (t.kind === "income") row.inflow += amt;
      else if (t.kind === "expense") row.outflow += amt;
      cashMap.set(k, row);
    }
    const cashflow = Array.from(cashMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    for (const c of cashflow) {
      running += c.inflow - c.outflow;
      c.balance = running;
    }

    // ─────────── Conciliação por conta ───────────
    const acctSummary = accounts.map((a) => {
      const moved = tx
        .filter((t) => t.account_id === a.id && t.status === "paid")
        .reduce((s, t) => s + (t.kind === "income" ? 1 : -1) * Number(t.net_amount ?? t.amount ?? 0), 0);
      const computed = Number(a.opening_balance ?? 0) + moved;
      const declared = Number(a.current_balance ?? 0);
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        is_active: a.is_active,
        opening_balance: Number(a.opening_balance ?? 0),
        computed_balance: computed,
        declared_balance: declared,
        diff: declared - computed,
      };
    });

    // ─────────── Breakdown por categoria (período total) ───────────
    const catMap = new Map<string, { category_id: string; name: string; kind: string; color: string | null; total: number }>();
    for (const t of tx) {
      if (t.status !== "paid") continue;
      const cat = categories.find((c) => c.id === t.category_id);
      const key = t.category_id ?? "uncategorized";
      const row = catMap.get(key) ?? {
        category_id: key,
        name: cat?.name ?? "Sem categoria",
        kind: cat?.kind ?? t.kind,
        color: cat?.color ?? null,
        total: 0,
      };
      row.total += Number(t.net_amount ?? t.amount ?? 0);
      catMap.set(key, row);
    }
    const byCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    // ─────────── Reconciliação gateway (MercadoPago) ───────────
    const mpApprovedTotal = mp
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + Number(p.transaction_amount ?? 0), 0);
    const mpPendingTotal = mp
      .filter((p) => p.status === "pending" || p.status === "in_process")
      .reduce((s, p) => s + Number(p.transaction_amount ?? 0), 0);

    // ─────────── Faturas (billing) ───────────
    const billingSummary = {
      total: invoices.length,
      paid: invoices.filter((i) => i.status === "paid").length,
      pending: invoices.filter((i) => i.status === "pending" || i.status === "open").length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
      paid_amount: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total ?? 0), 0),
      pending_amount: invoices
        .filter((i) => i.status === "pending" || i.status === "open" || i.status === "overdue")
        .reduce((s, i) => s + Number(i.total ?? 0), 0),
    };

    // ─────────── KPIs ───────────
    const lastMonth = dre[dre.length - 1];
    const prevMonth = dre[dre.length - 2];
    const mrr = lastMonth?.revenue_realized ?? 0;
    const growth = prevMonth && prevMonth.revenue_realized > 0
      ? ((mrr - prevMonth.revenue_realized) / prevMonth.revenue_realized) * 100
      : 0;

    return {
      generated_at: todayIso,
      window: { from: fromIso, months },
      kpis: {
        revenue_month: mrr,
        revenue_growth_pct: Number(growth.toFixed(2)),
        net_month: lastMonth?.net ?? 0,
        pending_receivables: lastMonth?.revenue_pending ?? 0,
        gateway_approved: mpApprovedTotal,
        gateway_pending: mpPendingTotal,
      },
      dre,
      cashflow,
      accounts: acctSummary,
      by_category: byCategory,
      billing: billingSummary,
    };
  });
