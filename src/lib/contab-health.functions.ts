import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Contábil & Office Cockpit — Fase 49.
 * Saúde do escritório contábil: clientes ativos, obrigações no prazo/atraso,
 * documentos pendentes, tarefas em aberto, jornadas IRPF e financeiro do office.
 */
export const getContabHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const sinceIso = new Date(now - data.days * 86400000).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(now + 30 * 86400000).toISOString().slice(0, 10);

    const [clientsRes, oblRes, docsRes, tasksRes, irpfRes, finRes, remRes, contractsRes] = await Promise.all([
      supabaseAdmin
        .from("contab_clients")
        .select("id, company_id, status, tax_regime, monthly_fee, onboarding_step, created_at")
        .limit(50000),
      supabaseAdmin
        .from("contab_obligations")
        .select("id, company_id, client_id, obligation_type, status, due_date, amount, paid_at, sent_at, created_at")
        .limit(50000),
      supabaseAdmin
        .from("contab_documents")
        .select("id, company_id, client_id, doc_type, status, source, reviewed_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("contab_tasks")
        .select("id, company_id, client_id, priority, status, due_date, done_at, created_at")
        .limit(50000),
      supabaseAdmin
        .from("contab_irpf_journeys")
        .select("id, company_id, client_id, base_year, current_step, status, result_type, result_amount, fee_amount, fee_paid, created_at")
        .limit(20000),
      supabaseAdmin
        .from("contab_office_finance")
        .select("id, company_id, kind, category, amount, due_date, paid_at, status, created_at")
        .gte("created_at", new Date(now - 90 * 86400000).toISOString())
        .limit(50000),
      supabaseAdmin
        .from("contab_reminders")
        .select("id, status, channel, scheduled_for, sent_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("contab_contracts")
        .select("id, status, monthly_fee, signed_at, start_date, end_date, created_at")
        .limit(20000),
    ]);

    const err = clientsRes.error || oblRes.error || docsRes.error || tasksRes.error || irpfRes.error || finRes.error || remRes.error || contractsRes.error;
    if (err) throw new Error(err.message);

    const clients = clientsRes.data ?? [];
    const obligations = oblRes.data ?? [];
    const docs = docsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const irpf = irpfRes.data ?? [];
    const finance = finRes.data ?? [];
    const reminders = remRes.data ?? [];
    const contracts = contractsRes.data ?? [];

    // Clients
    const clientsActive = clients.filter((c) => c.status === "active" || c.status === "ativo").length;
    const clientsInOnb = clients.filter((c) => (c.onboarding_step ?? 0) > 0 && (c.onboarding_step ?? 0) < 100).length;
    const clientsChurned = clients.filter((c) => c.status === "inactive" || c.status === "churned" || c.status === "cancelado").length;
    const mrrClients = clients.reduce((s, c) => s + Number(c.monthly_fee || 0), 0);

    const regimeMap = new Map<string, number>();
    for (const c of clients) {
      const k = c.tax_regime || "—";
      regimeMap.set(k, (regimeMap.get(k) ?? 0) + 1);
    }
    const regimes = Array.from(regimeMap, ([regime, count]) => ({ regime, count })).sort((a, b) => b.count - a.count);

    // Obligations
    const oblPending = obligations.filter((o) => o.status === "pending" || o.status === "in_progress" || o.status === "open");
    const oblPaid = obligations.filter((o) => o.status === "paid" || o.status === "done" || !!o.paid_at);
    const oblOverdue = obligations.filter((o) => o.due_date && o.due_date < today && !(o.status === "paid" || o.status === "done" || o.paid_at));
    const oblDueSoon = obligations.filter((o) => o.due_date && o.due_date >= today && o.due_date <= horizon && !(o.status === "paid" || o.status === "done" || o.paid_at));
    const oblAmountOverdue = oblOverdue.reduce((s, o) => s + Number(o.amount || 0), 0);
    const oblAmountDueSoon = oblDueSoon.reduce((s, o) => s + Number(o.amount || 0), 0);
    const oblTotalClosed = obligations.length;
    const onTimeRate = oblPaid.length / Math.max(1, oblPaid.length + oblOverdue.length) * 100;

    const oblTypeMap = new Map<string, { total: number; overdue: number; paid: number }>();
    for (const o of obligations) {
      const k = o.obligation_type || "—";
      const cur = oblTypeMap.get(k) ?? { total: 0, overdue: 0, paid: 0 };
      cur.total++;
      if (o.due_date && o.due_date < today && !o.paid_at) cur.overdue++;
      if (o.paid_at || o.status === "paid" || o.status === "done") cur.paid++;
      oblTypeMap.set(k, cur);
    }
    const oblByType = Array.from(oblTypeMap, ([type, v]) => ({ type, ...v })).sort((a, b) => b.total - a.total).slice(0, 12);

    // Documents
    const docsPending = docs.filter((d) => d.status === "pending" || d.status === "received" || d.status === "uploaded").length;
    const docsReviewed = docs.filter((d) => !!d.reviewed_at || d.status === "reviewed" || d.status === "approved").length;
    const docsRejected = docs.filter((d) => d.status === "rejected" || d.status === "error").length;
    const reviewTimes = docs.filter((d) => d.reviewed_at && d.created_at)
      .map((d) => (new Date(d.reviewed_at as string).getTime() - new Date(d.created_at as string).getTime()) / 86400000);
    const avgReviewDays = reviewTimes.length ? reviewTimes.reduce((s, n) => s + n, 0) / reviewTimes.length : 0;

    // Tasks
    const tasksOpen = tasks.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "pending");
    const tasksOverdue = tasksOpen.filter((t) => t.due_date && t.due_date < today).length;
    const tasksDone = tasks.filter((t) => !!t.done_at || t.status === "done" || t.status === "completed").length;
    const tasksHigh = tasksOpen.filter((t) => t.priority === "high" || t.priority === "urgent").length;

    // IRPF
    const irpfActive = irpf.filter((j) => j.status === "in_progress" || j.status === "open" || j.status === "pending").length;
    const irpfDone = irpf.filter((j) => j.status === "done" || j.status === "completed" || j.status === "transmitted").length;
    const irpfRestituir = irpf.filter((j) => j.result_type === "restitution" || j.result_type === "restituir");
    const irpfPagar = irpf.filter((j) => j.result_type === "tax_due" || j.result_type === "pagar");
    const irpfFeeTotal = irpf.reduce((s, j) => s + Number(j.fee_amount || 0), 0);
    const irpfFeePaid = irpf.filter((j) => j.fee_paid).reduce((s, j) => s + Number(j.fee_amount || 0), 0);

    // Office finance
    const finReceived = finance.filter((f) => (f.kind === "receivable" || f.kind === "income") && f.paid_at).reduce((s, f) => s + Number(f.amount || 0), 0);
    const finToReceive = finance.filter((f) => (f.kind === "receivable" || f.kind === "income") && !f.paid_at).reduce((s, f) => s + Number(f.amount || 0), 0);
    const finPaid = finance.filter((f) => (f.kind === "payable" || f.kind === "expense") && f.paid_at).reduce((s, f) => s + Number(f.amount || 0), 0);
    const finToPay = finance.filter((f) => (f.kind === "payable" || f.kind === "expense") && !f.paid_at).reduce((s, f) => s + Number(f.amount || 0), 0);
    const finOverdue = finance.filter((f) => f.due_date && f.due_date < today && !f.paid_at).length;
    const finNet = finReceived - finPaid;

    // Reminders
    const remSent = reminders.filter((r) => !!r.sent_at || r.status === "sent").length;
    const remFailed = reminders.filter((r) => r.status === "failed" || r.status === "error").length;
    const remPending = reminders.filter((r) => r.status === "pending" || r.status === "scheduled").length;

    // Contracts
    const contractsActive = contracts.filter((c) => c.status === "active" || c.status === "signed" || !!c.signed_at).length;
    const contractsExpiring = contracts.filter((c) => c.end_date && c.end_date >= today && c.end_date <= horizon).length;
    const contractsMRR = contracts.filter((c) => c.status === "active" || c.status === "signed").reduce((s, c) => s + Number(c.monthly_fee || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      clients: {
        total: clients.length,
        active: clientsActive,
        inOnboarding: clientsInOnb,
        churned: clientsChurned,
        mrr: mrrClients,
        byRegime: regimes,
      },
      obligations: {
        total: oblTotalClosed,
        pending: oblPending.length,
        overdue: oblOverdue.length,
        dueSoon: oblDueSoon.length,
        paid: oblPaid.length,
        onTimeRate,
        amountOverdue: oblAmountOverdue,
        amountDueSoon: oblAmountDueSoon,
        byType: oblByType,
      },
      documents: {
        total: docs.length,
        pending: docsPending,
        reviewed: docsReviewed,
        rejected: docsRejected,
        avgReviewDays,
      },
      tasks: {
        total: tasks.length,
        open: tasksOpen.length,
        overdue: tasksOverdue,
        done: tasksDone,
        highPriority: tasksHigh,
      },
      irpf: {
        total: irpf.length,
        active: irpfActive,
        done: irpfDone,
        restituir: irpfRestituir.length,
        restituirTotal: irpfRestituir.reduce((s, j) => s + Number(j.result_amount || 0), 0),
        pagar: irpfPagar.length,
        pagarTotal: irpfPagar.reduce((s, j) => s + Number(j.result_amount || 0), 0),
        feeTotal: irpfFeeTotal,
        feePaid: irpfFeePaid,
      },
      office: {
        received: finReceived,
        toReceive: finToReceive,
        paid: finPaid,
        toPay: finToPay,
        net: finNet,
        overdueCount: finOverdue,
      },
      reminders: { total: reminders.length, sent: remSent, failed: remFailed, pending: remPending },
      contracts: { total: contracts.length, active: contractsActive, expiring30d: contractsExpiring, mrr: contractsMRR },
    };
  });
