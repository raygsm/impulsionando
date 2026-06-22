import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * MercadoPago & Billing Cockpit — Fase 62.
 */
export const getMercadoPagoBillingHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [credsRes, payRes, refRes, subsRes, whRes, invRes, plansRes, dunRes, susRes, contRes, pixRes, payAllRes] = await Promise.all([
      supabaseAdmin.from("mpago_credentials").select("id, company_id, environment, active").limit(2000),
      supabaseAdmin.from("mpago_payments").select("id, status, amount_cents, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("mpago_refunds").select("id, status, amount_cents, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("mpago_subscriptions").select("id, status, plan_slug, amount_cents, created_at").limit(50000),
      supabaseAdmin.from("mpago_webhook_events").select("id, event_type, processed, processed_at, received_at").gte("received_at", sinceIso).limit(50000),
      supabaseAdmin.from("billing_invoices").select("id, status, amount, due_date, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("billing_plans").select("id, code, name, is_active, recurring_amount").limit(2000),
      supabaseAdmin.from("billing_dunning_runs").select("id, invoice_id, status, step, sent_at").gte("sent_at", sinceIso).limit(20000),
      supabaseAdmin.from("billing_suspensions").select("id, company_id, suspended_at, reactivated_at").gte("suspended_at", sinceIso).limit(20000),
      supabaseAdmin.from("billing_contracts").select("id, status, plan_id, start_date, next_due_date, recurring_amount").limit(20000),
      supabaseAdmin.from("billing_pix_charges").select("id, status, base_amount_cents, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("payments").select("id, status, amount_cents, payment_method, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = credsRes.error || payRes.error || refRes.error || subsRes.error || whRes.error || invRes.error || plansRes.error || dunRes.error || susRes.error || contRes.error || pixRes.error || payAllRes.error;
    if (err) throw new Error(err.message);

    const creds = (credsRes.data ?? []) as any[];
    const pays = (payRes.data ?? []) as any[];
    const refs = (refRes.data ?? []) as any[];
    const subs = (subsRes.data ?? []) as any[];
    const wh = (whRes.data ?? []) as any[];
    const invs = (invRes.data ?? []) as any[];
    const plans = (plansRes.data ?? []) as any[];
    const dun = (dunRes.data ?? []) as any[];
    const sus = (susRes.data ?? []) as any[];
    const conts = (contRes.data ?? []) as any[];
    const pix = (pixRes.data ?? []) as any[];
    const payAll = (payAllRes.data ?? []) as any[];

    const credsActive = creds.filter((c) => c.active).length;
    const credsProd = creds.filter((c) => c.environment === "production").length;

    const payApproved = pays.filter((p) => p.status === "approved").length;
    const payRejected = pays.filter((p) => p.status === "rejected").length;
    const payPending = pays.filter((p) => p.status === "pending" || p.status === "in_process").length;
    const payAmount = pays.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount_cents || 0), 0) / 100;

    const refTotal = refs.reduce((s, r) => s + Number(r.amount_cents || 0), 0) / 100;

    const subsActive = subs.filter((s) => s.status === "authorized" || s.status === "active").length;
    const subsCancelled = subs.filter((s) => s.status === "cancelled").length;

    const whProcessed = wh.filter((w) => w.processed).length;
    const whTypeMap = new Map<string, number>();
    for (const w of wh) { const k = w.event_type || "—"; whTypeMap.set(k, (whTypeMap.get(k) ?? 0) + 1); }
    const topWhTypes = Array.from(whTypeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const invPaid = invs.filter((i) => i.status === "paid" || i.paid_at).length;
    const invOpen = invs.filter((i) => i.status === "open" || i.status === "pending").length;
    const invOverdue = invs.filter((i) => !i.paid_at && i.due_date && new Date(i.due_date) < new Date()).length;
    const invRevenue = invs.filter((i) => i.paid_at).reduce((s, i) => s + Number(i.amount || 0), 0);

    const plansActive = plans.filter((p) => p.is_active).length;

    const dunActive = dun.filter((d) => d.status === "running" || d.status === "pending" || d.status === "sent").length;
    const dunFailed = dun.filter((d) => d.status === "failed" || d.status === "error").length;

    const susActive = sus.filter((s) => !s.reactivated_at).length;

    const contsActive = conts.filter((c) => c.status === "active" || c.status === "ativo").length;

    const pixApproved = pix.filter((p) => p.status === "paid" || p.status === "approved").length;
    const pixPending = pix.filter((p) => p.status === "pending" || p.status === "waiting").length;
    const pixAmount = pix.filter((p) => p.status === "paid" || p.status === "approved").reduce((s, p) => s + Number(p.base_amount_cents || 0), 0) / 100;

    const providerMap = new Map<string, { total: number; ok: number; amount: number }>();
    for (const p of payAll) {
      const k = p.payment_method || "—";
      const cur = providerMap.get(k) ?? { total: 0, ok: 0, amount: 0 };
      cur.total++;
      if (p.status === "approved" || p.status === "paid" || p.status === "success") { cur.ok++; cur.amount += Number(p.amount_cents || 0) / 100; }
      providerMap.set(k, cur);
    }
    const providers = Array.from(providerMap, ([provider, v]) => ({ provider, ...v, approvalRate: v.total ? Math.round((v.ok / v.total) * 1000) / 10 : 0 })).sort((a, b) => b.total - a.total);

    return {
      days: data.days,
      credentials: { total: creds.length, active: credsActive, production: credsProd },
      payments: { total: pays.length, approved: payApproved, rejected: payRejected, pending: payPending, amount: payAmount, approvalRate: pays.length ? Math.round((payApproved / pays.length) * 1000) / 10 : 0 },
      refunds: { total: refs.length, amount: refTotal },
      subscriptions: { total: subs.length, active: subsActive, cancelled: subsCancelled },
      webhooks: { total: wh.length, processed: whProcessed, topTypes: topWhTypes },
      invoices: { total: invs.length, paid: invPaid, open: invOpen, overdue: invOverdue, revenue: invRevenue },
      plans: { total: plans.length, active: plansActive },
      dunning: { total: dun.length, active: dunActive, failed: dunFailed },
      suspensions: { total: sus.length, active: susActive },
      contracts: { total: conts.length, active: contsActive },
      pix: { total: pix.length, approved: pixApproved, pending: pixPending, amount: pixAmount },
      providers,
    };
  });
