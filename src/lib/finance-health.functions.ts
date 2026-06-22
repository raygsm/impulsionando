import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Finance & Cashflow Cockpit — Fase 54.
 * Saldos, fluxo de caixa, recebíveis, pagáveis, comissões e taxas.
 */
export const getFinanceHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [accRes, catRes, txRes, payRes, comRes] = await Promise.all([
      supabaseAdmin.from("fin_accounts").select("id, name, type, current_balance, is_active").limit(5000),
      supabaseAdmin.from("fin_categories").select("id, name, kind, is_active").limit(5000),
      supabaseAdmin.from("fin_transactions").select("id, kind, status, amount, fee, net_amount, due_date, paid_at, category_id, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("fin_payments").select("id, provider, status, amount, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("fin_commissions").select("id, beneficiary_user_id, base_amount, percentage, amount, status, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = accRes.error || catRes.error || txRes.error || payRes.error || comRes.error;
    if (err) throw new Error(err.message);

    const accounts = accRes.data ?? [];
    const cats = catRes.data ?? [];
    const txs = txRes.data ?? [];
    const payments = payRes.data ?? [];
    const commissions = comRes.data ?? [];

    const totalBalance = accounts.filter((a) => a.is_active).reduce((s, a) => s + Number(a.current_balance || 0), 0);

    const inflows = txs.filter((t) => t.kind === "income" || t.kind === "credit" || t.kind === "receivable");
    const outflows = txs.filter((t) => t.kind === "expense" || t.kind === "debit" || t.kind === "payable");
    const received = inflows.filter((t) => t.paid_at || t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const toReceive = inflows.filter((t) => !t.paid_at && t.status !== "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const paid = outflows.filter((t) => t.paid_at || t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const toPay = outflows.filter((t) => !t.paid_at && t.status !== "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalFees = txs.reduce((s, t) => s + Number(t.fee || 0), 0);
    const net = received - paid;

    const overdueIn = inflows.filter((t) => t.due_date && t.due_date < today && !t.paid_at).length;
    const overdueOut = outflows.filter((t) => t.due_date && t.due_date < today && !t.paid_at).length;
    const dueSoonIn = inflows.filter((t) => t.due_date && t.due_date >= today && t.due_date <= horizon && !t.paid_at).reduce((s, t) => s + Number(t.amount || 0), 0);
    const dueSoonOut = outflows.filter((t) => t.due_date && t.due_date >= today && t.due_date <= horizon && !t.paid_at).reduce((s, t) => s + Number(t.amount || 0), 0);

    const catMap = new Map(cats.map((c) => [c.id, c]));
    const catAgg = new Map<string, { name: string; kind: string; amount: number; count: number }>();
    for (const t of txs) {
      if (!t.paid_at && t.status !== "paid") continue;
      const c = catMap.get(t.category_id);
      const key = t.category_id || "—";
      const cur = catAgg.get(key) ?? { name: c?.name || "Sem categoria", kind: c?.kind || t.kind || "—", amount: 0, count: 0 };
      cur.amount += Number(t.amount || 0);
      cur.count++;
      catAgg.set(key, cur);
    }
    const topCategories = Array.from(catAgg.values()).sort((a, b) => b.amount - a.amount).slice(0, 15);

    const provMap = new Map<string, { count: number; amount: number; approved: number }>();
    for (const p of payments) {
      const k = p.provider || "—";
      const cur = provMap.get(k) ?? { count: 0, amount: 0, approved: 0 };
      cur.count++;
      cur.amount += Number(p.amount || 0);
      if (p.status === "approved" || p.status === "paid") cur.approved++;
      provMap.set(k, cur);
    }
    const providers = Array.from(provMap, ([provider, v]) => ({ provider, ...v, approvalRate: v.count ? (v.approved / v.count) * 100 : 0 })).sort((a, b) => b.amount - a.amount);

    const comPending = commissions.filter((c) => c.status === "pending" || c.status === "open").reduce((s, c) => s + Number(c.amount || 0), 0);
    const comPaid = commissions.filter((c) => c.status === "paid" || !!c.paid_at).reduce((s, c) => s + Number(c.amount || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      balance: { total: totalBalance, accounts: accounts.filter((a) => a.is_active).length },
      cashflow: { received, toReceive, paid, toPay, net, fees: totalFees, overdueIn, overdueOut, dueSoonIn, dueSoonOut },
      topCategories,
      providers,
      commissions: { total: commissions.length, pendingAmount: comPending, paidAmount: comPaid },
    };
  });
