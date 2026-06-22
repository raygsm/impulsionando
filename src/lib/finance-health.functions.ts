import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Financeiro Cockpit — Fase 98.
 * Consolida fin_accounts, fin_categories, fin_payment_methods,
 * fin_transactions, fin_payments, fin_commissions.
 * Foco: fluxo de caixa, recebíveis/pagáveis, métodos, categorias e comissões.
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
    const todayIso = new Date().toISOString();

    const [acRes, ctRes, pmRes, trRes, pyRes, cmRes] = await Promise.all([
      supabaseAdmin.from("fin_accounts").select("id, company_id, name, kind, is_active, balance, created_at").limit(50000),
      supabaseAdmin.from("fin_categories").select("id, company_id, name, kind, is_active").limit(50000),
      supabaseAdmin.from("fin_payment_methods").select("id, company_id, name, kind, is_active").limit(50000),
      supabaseAdmin.from("fin_transactions").select("id, company_id, kind, status, amount, due_date, paid_date, category_id, account_id, payment_method_id, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("fin_payments").select("id, company_id, transaction_id, amount, paid_date, payment_method_id, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("fin_commissions").select("id, company_id, status, amount, base_amount, percentage, owner_id, transaction_id, created_at, paid_at").gte("created_at", sinceIso).limit(200000),
    ]);

    const err = acRes.error || ctRes.error || pmRes.error || trRes.error || pyRes.error || cmRes.error;
    if (err) throw new Error(err.message);

    const ac = acRes.data ?? [];
    const ct = ctRes.data ?? [];
    const pm = pmRes.data ?? [];
    const tr = trRes.data ?? [];
    const py = pyRes.data ?? [];
    const cm = cmRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const sumBy = <T,>(rows: T[], key: (r: T) => string | null | undefined, val: (r: T) => number) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + (val(r) || 0)); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count: Math.round(count) })).sort((a, b) => b.count - a.count);
    };
    const sum = (rows: any[], f: string) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
    const catNameById = new Map(ct.map((c: any) => [c.id, c.name]));
    const acctNameById = new Map(ac.map((a: any) => [a.id, a.name]));
    const pmNameById = new Map(pm.map((p: any) => [p.id, p.name]));

    // Accounts
    const acActive = ac.filter((a: any) => a.is_active).length;
    const acBalance = sum(ac.filter((a: any) => a.is_active), "balance");
    const acByKind = countBy(ac, (a: any) => a.kind);

    // Categories / methods
    const ctActive = ct.filter((c: any) => c.is_active).length;
    const ctByKind = countBy(ct, (c: any) => c.kind);
    const pmActive = pm.filter((p: any) => p.is_active).length;
    const pmByKind = countBy(pm, (p: any) => p.kind);

    // Transactions
    const trTotal = tr.length;
    const trIncome = tr.filter((r: any) => String(r.kind) === "income");
    const trExpense = tr.filter((r: any) => String(r.kind) === "expense");
    const incomeAmount = sum(trIncome, "amount");
    const expenseAmount = sum(trExpense, "amount");
    const netCashflow = incomeAmount - expenseAmount;
    const trPaid = tr.filter((r: any) => r.paid_date || String(r.status) === "paid").length;
    const trOverdue = tr.filter((r: any) => !r.paid_date && r.due_date && r.due_date < todayIso && String(r.status) !== "canceled");
    const overdueAmount = sum(trOverdue, "amount");
    const receivablesOpen = trIncome.filter((r: any) => !r.paid_date && String(r.status) !== "canceled");
    const payablesOpen = trExpense.filter((r: any) => !r.paid_date && String(r.status) !== "canceled");
    const receivablesAmount = sum(receivablesOpen, "amount");
    const payablesAmount = sum(payablesOpen, "amount");
    const trByStatus = countBy(tr, (r: any) => r.status);
    const trByKind = countBy(tr, (r: any) => r.kind);
    const trByCategory = sumBy(tr, (r: any) => catNameById.get(r.category_id) as string | undefined, (r: any) => Number(r.amount) || 0).slice(0, 15);
    const trByAccount = sumBy(tr, (r: any) => acctNameById.get(r.account_id) as string | undefined, (r: any) => Number(r.amount) || 0).slice(0, 10);
    const trByMethod = sumBy(tr, (r: any) => pmNameById.get(r.payment_method_id) as string | undefined, (r: any) => Number(r.amount) || 0).slice(0, 10);

    // Payments
    const pyTotal = py.length;
    const pyAmount = sum(py, "amount");
    const pyAvg = pyTotal ? pyAmount / pyTotal : 0;
    const pyByMethod = sumBy(py, (p: any) => pmNameById.get(p.payment_method_id) as string | undefined, (p: any) => Number(p.amount) || 0).slice(0, 10);

    // Commissions
    const cmTotal = cm.length;
    const cmGross = sum(cm, "amount");
    const cmPaid = cm.filter((c: any) => c.paid_at);
    const cmPaidValue = sum(cmPaid, "amount");
    const cmPendingValue = cmGross - cmPaidValue;
    const cmByStatus = countBy(cm, (c: any) => c.status);
    const cmByOwner = sumBy(cm, (c: any) => c.owner_id, (c: any) => Number(c.amount) || 0).slice(0, 10);

    return {
      windowDays: data.days,
      accounts: { total: ac.length, active: acActive, totalBalanceBRL: acBalance, byKind: acByKind },
      categories: { total: ct.length, active: ctActive, byKind: ctByKind },
      paymentMethods: { total: pm.length, active: pmActive, byKind: pmByKind },
      transactions: {
        total: trTotal, paid: trPaid, overdueCount: trOverdue.length, overdueBRL: overdueAmount,
        incomeBRL: incomeAmount, expenseBRL: expenseAmount, netCashflowBRL: netCashflow,
        receivablesOpenCount: receivablesOpen.length, receivablesBRL: receivablesAmount,
        payablesOpenCount: payablesOpen.length, payablesBRL: payablesAmount,
        byStatus: trByStatus, byKind: trByKind,
        byCategory: trByCategory, byAccount: trByAccount, byMethod: trByMethod,
      },
      payments: { total: pyTotal, totalBRL: pyAmount, avgBRL: pyAvg, byMethod: pyByMethod },
      commissions: { total: cmTotal, paidCount: cmPaid.length, grossBRL: cmGross, paidBRL: cmPaidValue, pendingBRL: cmPendingValue, byStatus: cmByStatus, byOwner: cmByOwner },
    };
  });
