import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Accounting (Contab) Cockpit — Fase 92.
 * Clientes contábeis, contratos, departamentos, documentos, obrigações fiscais,
 * lembretes, tarefas, jornadas IRPF e finanças do escritório.
 */
export const getContabHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const nowIso = new Date().toISOString();
    const in30Iso = new Date(Date.now() + 30 * 86400000).toISOString();

    const [clRes, ctRes, dpRes, doRes, fcRes, obRes, rmRes, tkRes, ijRes, isRes, ofRes, onRes] = await Promise.all([
      supabaseAdmin.from("contab_clients").select("id, company_id, tax_regime, status, monthly_fee, onboarding_step, created_at").limit(50000),
      supabaseAdmin.from("contab_contracts").select("id, company_id, client_id, status, monthly_fee, start_date, end_date, signed_at, created_at").limit(50000),
      supabaseAdmin.from("contab_departments").select("id, company_id, slug, is_active, created_at").limit(5000),
      supabaseAdmin.from("contab_documents").select("id, company_id, client_id, doc_type, status, source, reviewed_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("contab_fiscal_calendar").select("id, company_id, obligation_type, scope, recurrence, is_active, applies_to_regime, created_at").limit(20000),
      supabaseAdmin.from("contab_obligations").select("id, company_id, client_id, obligation_type, due_date, amount, status, paid_at, sent_at, created_at").limit(200000),
      supabaseAdmin.from("contab_reminders").select("id, company_id, channel, status, scheduled_for, sent_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("contab_tasks").select("id, company_id, priority, status, due_date, done_at, assigned_to, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("contab_irpf_journeys").select("id, company_id, status, result_type, result_amount, fee_amount, fee_paid, base_year, created_at").limit(50000),
      supabaseAdmin.from("contab_irpf_steps").select("id, journey_id, status, completed_at, created_at").limit(200000),
      supabaseAdmin.from("contab_office_finance").select("id, company_id, kind, category, amount, due_date, paid_at, status, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("contab_onboarding").select("id, company_id, client_id, step_name, step_order, status, completed_at, created_at").limit(50000),
    ]);

    const err = clRes.error || ctRes.error || dpRes.error || doRes.error || fcRes.error || obRes.error || rmRes.error || tkRes.error || ijRes.error || isRes.error || ofRes.error || onRes.error;
    if (err) throw new Error(err.message);

    const cl = clRes.data ?? [];
    const ct = ctRes.data ?? [];
    const dp = dpRes.data ?? [];
    const docs = doRes.data ?? [];
    const fc = fcRes.data ?? [];
    const ob = obRes.data ?? [];
    const rm = rmRes.data ?? [];
    const tk = tkRes.data ?? [];
    const ij = ijRes.data ?? [];
    const is = isRes.data ?? [];
    const ofin = ofRes.data ?? [];
    const onb = onRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Clients
    const clActive = cl.filter((r: any) => String(r.status).toLowerCase() === "active" || String(r.status).toLowerCase() === "ativo").length;
    const clMrr = cl.reduce((s: number, r: any) => s + (Number(r.monthly_fee) || 0), 0);
    const clByRegime = countBy(cl, (r: any) => r.tax_regime);
    const clByStatus = countBy(cl, (r: any) => r.status);

    // Contracts
    const ctActive = ct.filter((r: any) => String(r.status).toLowerCase() === "active").length;
    const ctSigned = ct.filter((r: any) => r.signed_at).length;
    const ctRevenue = ct.reduce((s: number, r: any) => s + (Number(r.monthly_fee) || 0), 0);
    const ctByStatus = countBy(ct, (r: any) => r.status);

    // Departments
    const dpActive = dp.filter((r: any) => r.is_active).length;

    // Documents (period)
    const docByStatus = countBy(docs, (r: any) => r.status);
    const docByType = countBy(docs, (r: any) => r.doc_type).slice(0, 10);
    const docBySource = countBy(docs, (r: any) => r.source);
    const docReviewed = docs.filter((r: any) => r.reviewed_at).length;
    const docReviewRate = docs.length > 0 ? (docReviewed / docs.length) * 100 : 0;

    // Fiscal calendar
    const fcActive = fc.filter((r: any) => r.is_active).length;
    const fcByScope = countBy(fc, (r: any) => r.scope);
    const fcByRecurrence = countBy(fc, (r: any) => r.recurrence);

    // Obligations
    const obDueSoon = ob.filter((r: any) => r.due_date && r.due_date >= nowIso.slice(0,10) && r.due_date <= in30Iso.slice(0,10)).length;
    const obOverdue = ob.filter((r: any) => r.due_date && r.due_date < nowIso.slice(0,10) && !r.paid_at).length;
    const obPaid = ob.filter((r: any) => r.paid_at).length;
    const obAmountPending = ob.filter((r: any) => !r.paid_at).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const obAmountPaid = ob.filter((r: any) => r.paid_at).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const obByType = countBy(ob, (r: any) => r.obligation_type).slice(0, 10);
    const obByStatus = countBy(ob, (r: any) => r.status);

    // Reminders (period)
    const rmSent = rm.filter((r: any) => r.sent_at).length;
    const rmFailed = rm.filter((r: any) => String(r.status).toLowerCase() === "failed" || String(r.status).toLowerCase() === "error").length;
    const rmByChannel = countBy(rm, (r: any) => r.channel);
    const rmByStatus = countBy(rm, (r: any) => r.status);

    // Tasks (period)
    const tkDone = tk.filter((r: any) => r.done_at).length;
    const tkOpen = tk.filter((r: any) => !r.done_at).length;
    const tkOverdue = tk.filter((r: any) => !r.done_at && r.due_date && r.due_date < nowIso.slice(0,10)).length;
    const tkByPriority = countBy(tk, (r: any) => r.priority);
    const tkByStatus = countBy(tk, (r: any) => r.status);
    const tkDoneTimes = tk.filter((r: any) => r.done_at && r.created_at);
    const tkAvgCycleH = tkDoneTimes.length > 0
      ? tkDoneTimes.reduce((s: number, r: any) => s + (new Date(r.done_at).getTime() - new Date(r.created_at).getTime()), 0) / tkDoneTimes.length / 3600000
      : 0;

    // IRPF
    const ijTotal = ij.length;
    const ijDone = ij.filter((r: any) => String(r.status).toLowerCase() === "done" || String(r.status).toLowerCase() === "concluded" || String(r.status).toLowerCase() === "completed").length;
    const ijFeeTotal = ij.reduce((s: number, r: any) => s + (Number(r.fee_amount) || 0), 0);
    const ijFeePaid = ij.filter((r: any) => r.fee_paid).reduce((s: number, r: any) => s + (Number(r.fee_amount) || 0), 0);
    const ijResultRestituir = ij.filter((r: any) => String(r.result_type).toLowerCase() === "restituir").length;
    const ijResultPagar = ij.filter((r: any) => String(r.result_type).toLowerCase() === "pagar").length;
    const ijByStatus = countBy(ij, (r: any) => r.status);
    const ijByYear = countBy(ij, (r: any) => String(r.base_year ?? ""));
    const isDone = is.filter((r: any) => r.completed_at).length;
    const isCompletionRate = is.length > 0 ? (isDone / is.length) * 100 : 0;

    // Office finance (period)
    const ofRevenue = ofin.filter((r: any) => String(r.kind).toLowerCase() === "income" || String(r.kind).toLowerCase() === "receita").reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const ofExpense = ofin.filter((r: any) => String(r.kind).toLowerCase() === "expense" || String(r.kind).toLowerCase() === "despesa").reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const ofMargin = ofRevenue - ofExpense;
    const ofByCategory = countBy(ofin, (r: any) => r.category).slice(0, 10);
    const ofByStatus = countBy(ofin, (r: any) => r.status);

    // Onboarding
    const onbByStatus = countBy(onb, (r: any) => r.status);
    const onbDone = onb.filter((r: any) => r.completed_at).length;
    const onbCompletion = onb.length > 0 ? (onbDone / onb.length) * 100 : 0;

    return {
      days: data.days,
      clients: { total: cl.length, active: clActive, mrr: clMrr, byRegime: clByRegime, byStatus: clByStatus },
      contracts: { total: ct.length, active: ctActive, signed: ctSigned, revenue: ctRevenue, byStatus: ctByStatus },
      departments: { total: dp.length, active: dpActive },
      documents: { total: docs.length, reviewed: docReviewed, reviewRate: docReviewRate, byStatus: docByStatus, byType: docByType, bySource: docBySource },
      fiscalCalendar: { total: fc.length, active: fcActive, byScope: fcByScope, byRecurrence: fcByRecurrence },
      obligations: { total: ob.length, dueSoon: obDueSoon, overdue: obOverdue, paid: obPaid, amountPending: obAmountPending, amountPaid: obAmountPaid, byType: obByType, byStatus: obByStatus },
      reminders: { total: rm.length, sent: rmSent, failed: rmFailed, byChannel: rmByChannel, byStatus: rmByStatus },
      tasks: { total: tk.length, done: tkDone, open: tkOpen, overdue: tkOverdue, avgCycleHours: tkAvgCycleH, byPriority: tkByPriority, byStatus: tkByStatus },
      irpf: { total: ijTotal, done: ijDone, feeTotal: ijFeeTotal, feePaid: ijFeePaid, restituir: ijResultRestituir, pagar: ijResultPagar, byStatus: ijByStatus, byYear: ijByYear, stepsCompletion: isCompletionRate },
      officeFinance: { total: ofin.length, revenue: ofRevenue, expense: ofExpense, margin: ofMargin, byCategory: ofByCategory, byStatus: ofByStatus },
      onboarding: { total: onb.length, completionRate: onbCompletion, byStatus: onbByStatus },
    };
  });
