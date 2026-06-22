import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Billing & Subscriptions Cockpit — Fase 99.
 * Consolida billing_plans, billing_contracts, billing_invoices,
 * billing_pix_charges, billing_dunning_runs, billing_suspensions,
 * subscriptions e mpago_payments/mpago_subscriptions.
 */
export const getBillingHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const todayIso = new Date().toISOString();

    const [plRes, ctRes, invRes, pixRes, dunRes, susRes, subRes, mpRes, mpSubRes] = await Promise.all([
      supabaseAdmin.from("billing_plans").select("id, code, name, tier, price_brl, interval, is_active, created_at").limit(10000),
      supabaseAdmin.from("billing_contracts").select("id, company_id, plan_id, status, start_date, end_date, created_at").limit(100000),
      supabaseAdmin.from("billing_invoices").select("id, company_id, contract_id, status, amount, due_date, paid_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("billing_pix_charges").select("id, company_id, status, amount, expires_at, paid_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("billing_dunning_runs").select("id, company_id, status, attempt, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("billing_suspensions").select("id, company_id, status, reason, suspended_at, resumed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("subscriptions").select("id, company_id, status, plan_code, started_at, current_period_end, canceled_at, created_at").limit(200000),
      supabaseAdmin.from("mpago_payments").select("id, company_id, status, transaction_amount, payment_method_id, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("mpago_subscriptions").select("id, company_id, status, plan_id, created_at").limit(100000),
    ]);

    const err = plRes.error || ctRes.error || invRes.error || pixRes.error || dunRes.error || susRes.error || subRes.error || mpRes.error || mpSubRes.error;
    if (err) throw new Error(err.message);

    const pl = plRes.data ?? [];
    const ct = ctRes.data ?? [];
    const inv = invRes.data ?? [];
    const pix = pixRes.data ?? [];
    const dun = dunRes.data ?? [];
    const sus = susRes.data ?? [];
    const sub = subRes.data ?? [];
    const mp = mpRes.data ?? [];
    const mpSub = mpSubRes.data ?? [];

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
    const planNameById = new Map(pl.map((p: any) => [p.id, p.name]));

    // Plans
    const plActive = pl.filter((p: any) => p.is_active).length;
    const plByTier = countBy(pl, (p: any) => p.tier);
    const plByInterval = countBy(pl, (p: any) => p.interval);

    // Contracts
    const ctActive = ct.filter((c: any) => String(c.status) === "active").length;
    const ctCanceled = ct.filter((c: any) => String(c.status) === "canceled").length;
    const ctByStatus = countBy(ct, (c: any) => c.status);
    const ctByPlan = countBy(ct, (c: any) => planNameById.get(c.plan_id) as string | undefined).slice(0, 15);

    // Invoices
    const invTotal = inv.length;
    const invPaid = inv.filter((i: any) => i.paid_at || String(i.status) === "paid");
    const invOpen = inv.filter((i: any) => !i.paid_at && !["paid","canceled","void"].includes(String(i.status)));
    const invOverdue = invOpen.filter((i: any) => i.due_date && i.due_date < todayIso);
    const invGrossBRL = sum(inv, "amount");
    const invPaidBRL = sum(invPaid, "amount");
    const invOpenBRL = sum(invOpen, "amount");
    const invOverdueBRL = sum(invOverdue, "amount");
    const invPayRate = invTotal ? (invPaid.length / invTotal) * 100 : 0;
    const invByStatus = countBy(inv, (i: any) => i.status);

    // PIX
    const pixTotal = pix.length;
    const pixPaid = pix.filter((p: any) => p.paid_at).length;
    const pixPaidBRL = sum(pix.filter((p: any) => p.paid_at), "amount");
    const pixPayRate = pixTotal ? (pixPaid / pixTotal) * 100 : 0;
    const pixExpired = pix.filter((p: any) => !p.paid_at && p.expires_at && p.expires_at < todayIso).length;
    const pixByStatus = countBy(pix, (p: any) => p.status);

    // Dunning
    const dunTotal = dun.length;
    const dunByStatus = countBy(dun, (d: any) => d.status);
    const dunByAttempt = countBy(dun, (d: any) => String(d.attempt ?? ""));

    // Suspensions
    const susTotal = sus.length;
    const susActive = sus.filter((s: any) => !s.resumed_at).length;
    const susByReason = countBy(sus, (s: any) => s.reason);
    const susByStatus = countBy(sus, (s: any) => s.status);

    // Subscriptions
    const subActive = sub.filter((s: any) => String(s.status) === "active").length;
    const subCanceled = sub.filter((s: any) => s.canceled_at || String(s.status) === "canceled").length;
    const subChurnRate = sub.length ? (subCanceled / sub.length) * 100 : 0;
    const subByStatus = countBy(sub, (s: any) => s.status);
    const subByPlan = countBy(sub, (s: any) => s.plan_code).slice(0, 15);

    // Mercado Pago
    const mpTotal = mp.length;
    const mpApproved = mp.filter((p: any) => String(p.status) === "approved");
    const mpApprovedBRL = sum(mpApproved, "transaction_amount");
    const mpApprovalRate = mpTotal ? (mpApproved.length / mpTotal) * 100 : 0;
    const mpByStatus = countBy(mp, (p: any) => p.status);
    const mpByMethod = sumBy(mp, (p: any) => p.payment_method_id, (p: any) => Number(p.transaction_amount) || 0).slice(0, 10);
    const mpSubActive = mpSub.filter((s: any) => String(s.status) === "authorized" || String(s.status) === "active").length;
    const mpSubByStatus = countBy(mpSub, (s: any) => s.status);

    return {
      windowDays: data.days,
      plans: { total: pl.length, active: plActive, byTier: plByTier, byInterval: plByInterval },
      contracts: { total: ct.length, active: ctActive, canceled: ctCanceled, byStatus: ctByStatus, byPlan: ctByPlan },
      invoices: {
        total: invTotal, paidCount: invPaid.length, openCount: invOpen.length, overdueCount: invOverdue.length,
        grossBRL: invGrossBRL, paidBRL: invPaidBRL, openBRL: invOpenBRL, overdueBRL: invOverdueBRL,
        payRate: invPayRate, byStatus: invByStatus,
      },
      pix: { total: pixTotal, paid: pixPaid, paidBRL: pixPaidBRL, payRate: pixPayRate, expired: pixExpired, byStatus: pixByStatus },
      dunning: { total: dunTotal, byStatus: dunByStatus, byAttempt: dunByAttempt },
      suspensions: { total: susTotal, active: susActive, byReason: susByReason, byStatus: susByStatus },
      subscriptions: { total: sub.length, active: subActive, canceled: subCanceled, churnRate: subChurnRate, byStatus: subByStatus, byPlan: subByPlan },
      mpago: {
        total: mpTotal, approved: mpApproved.length, approvedBRL: mpApprovedBRL, approvalRate: mpApprovalRate,
        byStatus: mpByStatus, byMethod: mpByMethod,
        subTotal: mpSub.length, subActive: mpSubActive, subByStatus: mpSubByStatus,
      },
    };
  });
