import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marocas (Vacation Rental Ops) Cockpit — Fase 93.
 * Apartamentos, proprietários, profissionais, serviços, manutenção (requests/quotes),
 * suprimentos, statements financeiros e relatórios agendados.
 */
export const getMarocasHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [apRes, owRes, prRes, svRes, mrRes, mqRes, spRes, stRes, schRes, runRes] = await Promise.all([
      supabaseAdmin.from("marocas_apartments").select("id, code, city, state, status, capacity, daily_rate, marocas_commission_percent, created_at").limit(20000),
      supabaseAdmin.from("marocas_owners").select("id, created_at").limit(20000),
      supabaseAdmin.from("marocas_professionals").select("id, role, active, rating, hourly_rate, per_service_rate, created_at").limit(10000),
      supabaseAdmin.from("marocas_services").select("id, apartment_id, professional_id, service_type, status, priority, scheduled_for, started_at, completed_at, cost, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("marocas_maintenance_requests").select("id, apartment_id, category, priority, status, resolved_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_maintenance_quotes").select("id, request_id, professional_id, amount, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_supplies").select("id, apartment_id, category, current_qty, min_qty, unit_cost, last_restocked_at, created_at").limit(50000),
      supabaseAdmin.from("marocas_owner_statements").select("id, owner_id, apartment_id, reference_month, gross_revenue, marocas_fee, expenses, net_payout, status, paid_at, created_at").limit(50000),
      supabaseAdmin.from("marocas_report_schedules").select("id, period, enabled, channels, created_at").limit(5000),
      supabaseAdmin.from("marocas_report_runs").select("id, schedule_id, period, status, total, done, late, error, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = apRes.error || owRes.error || prRes.error || svRes.error || mrRes.error || mqRes.error || spRes.error || stRes.error || schRes.error || runRes.error;
    if (err) throw new Error(err.message);

    const ap = apRes.data ?? [];
    const ow = owRes.data ?? [];
    const pr = prRes.data ?? [];
    const sv = svRes.data ?? [];
    const mr = mrRes.data ?? [];
    const mq = mqRes.data ?? [];
    const sp = spRes.data ?? [];
    const st = stRes.data ?? [];
    const sch = schRes.data ?? [];
    const runs = runRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Apartments
    const apActive = ap.filter((r: any) => String(r.status).toLowerCase() === "active" || String(r.status).toLowerCase() === "available").length;
    const apCapacity = ap.reduce((s: number, r: any) => s + (Number(r.capacity) || 0), 0);
    const apAvgDaily = ap.length > 0 ? ap.reduce((s: number, r: any) => s + (Number(r.daily_rate) || 0), 0) / ap.length : 0;
    const apAvgCommission = ap.length > 0 ? ap.reduce((s: number, r: any) => s + (Number(r.marocas_commission_percent) || 0), 0) / ap.length : 0;
    const apByStatus = countBy(ap, (r: any) => r.status);
    const apByCity = countBy(ap, (r: any) => r.city).slice(0, 10);

    // Professionals
    const prActive = pr.filter((r: any) => r.active).length;
    const prAvgRating = pr.filter((r: any) => r.rating != null).length > 0
      ? pr.filter((r: any) => r.rating != null).reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / pr.filter((r: any) => r.rating != null).length
      : 0;
    const prByRole = countBy(pr, (r: any) => r.role);

    // Services (period)
    const svDone = sv.filter((r: any) => r.completed_at).length;
    const svInProgress = sv.filter((r: any) => r.started_at && !r.completed_at).length;
    const svScheduled = sv.filter((r: any) => !r.started_at && r.scheduled_for).length;
    const svCost = sv.reduce((s: number, r: any) => s + (Number(r.cost) || 0), 0);
    const svDoneTimes = sv.filter((r: any) => r.completed_at && r.started_at);
    const svAvgDurH = svDoneTimes.length > 0
      ? svDoneTimes.reduce((s: number, r: any) => s + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()), 0) / svDoneTimes.length / 3600000
      : 0;
    const svByType = countBy(sv, (r: any) => r.service_type).slice(0, 10);
    const svByStatus = countBy(sv, (r: any) => r.status);
    const svByPriority = countBy(sv, (r: any) => r.priority);

    // Maintenance requests (period)
    const mrResolved = mr.filter((r: any) => r.resolved_at).length;
    const mrOpen = mr.length - mrResolved;
    const mrMTTRH = mr.filter((r: any) => r.resolved_at && r.created_at).length > 0
      ? mr.filter((r: any) => r.resolved_at && r.created_at).reduce((s: number, r: any) => s + (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()), 0) / mr.filter((r: any) => r.resolved_at).length / 3600000
      : 0;
    const mrByCategory = countBy(mr, (r: any) => r.category).slice(0, 10);
    const mrByPriority = countBy(mr, (r: any) => r.priority);
    const mrByStatus = countBy(mr, (r: any) => r.status);

    // Quotes (period)
    const mqApproved = mq.filter((r: any) => String(r.status).toLowerCase() === "approved").length;
    const mqRejected = mq.filter((r: any) => String(r.status).toLowerCase() === "rejected").length;
    const mqAmount = mq.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const mqByStatus = countBy(mq, (r: any) => r.status);

    // Supplies
    const spLow = sp.filter((r: any) => Number(r.current_qty) <= Number(r.min_qty || 0)).length;
    const spValue = sp.reduce((s: number, r: any) => s + (Number(r.current_qty) || 0) * (Number(r.unit_cost) || 0), 0);
    const spByCategory = countBy(sp, (r: any) => r.category).slice(0, 10);

    // Statements
    const stPaid = st.filter((r: any) => r.paid_at).length;
    const stPending = st.length - stPaid;
    const stGross = st.reduce((s: number, r: any) => s + (Number(r.gross_revenue) || 0), 0);
    const stFees = st.reduce((s: number, r: any) => s + (Number(r.marocas_fee) || 0), 0);
    const stExpenses = st.reduce((s: number, r: any) => s + (Number(r.expenses) || 0), 0);
    const stNet = st.reduce((s: number, r: any) => s + (Number(r.net_payout) || 0), 0);
    const stByStatus = countBy(st, (r: any) => r.status);

    // Reports
    const schEnabled = sch.filter((r: any) => r.enabled).length;
    const schByPeriod = countBy(sch, (r: any) => r.period);
    const runOk = runs.filter((r: any) => String(r.status).toLowerCase() === "done" || String(r.status).toLowerCase() === "ok" || String(r.status).toLowerCase() === "success").length;
    const runErrors = runs.reduce((s: number, r: any) => s + (Number(r.error) || 0), 0);
    const runLate = runs.reduce((s: number, r: any) => s + (Number(r.late) || 0), 0);
    const runByStatus = countBy(runs, (r: any) => r.status);

    return {
      days: data.days,
      apartments: { total: ap.length, active: apActive, capacity: apCapacity, avgDailyRate: apAvgDaily, avgCommissionPct: apAvgCommission, byStatus: apByStatus, byCity: apByCity },
      owners: { total: ow.length },
      professionals: { total: pr.length, active: prActive, avgRating: prAvgRating, byRole: prByRole },
      services: { total: sv.length, done: svDone, inProgress: svInProgress, scheduled: svScheduled, cost: svCost, avgDurationHours: svAvgDurH, byType: svByType, byStatus: svByStatus, byPriority: svByPriority },
      maintenance: { total: mr.length, resolved: mrResolved, open: mrOpen, mttrHours: mrMTTRH, byCategory: mrByCategory, byPriority: mrByPriority, byStatus: mrByStatus },
      quotes: { total: mq.length, approved: mqApproved, rejected: mqRejected, amount: mqAmount, byStatus: mqByStatus },
      supplies: { total: sp.length, low: spLow, stockValue: spValue, byCategory: spByCategory },
      statements: { total: st.length, paid: stPaid, pending: stPending, gross: stGross, fees: stFees, expenses: stExpenses, net: stNet, byStatus: stByStatus },
      reports: { schedulesTotal: sch.length, schedulesEnabled: schEnabled, byPeriod: schByPeriod, runs: runs.length, runOk, runErrors, runLate, byStatus: runByStatus },
    };
  });
