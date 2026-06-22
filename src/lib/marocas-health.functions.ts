import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marocas Hospitality Cockpit — Fase 63.
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

    const [aptRes, ownRes, reqRes, quoteRes, statRes, profRes, servRes, supRes, runRes, schedRes] = await Promise.all([
      supabaseAdmin.from("marocas_apartments").select("id, status, building, owner_id").limit(20000),
      supabaseAdmin.from("marocas_owners").select("id, created_at").limit(20000),
      supabaseAdmin.from("marocas_maintenance_requests").select("id, status, priority, apartment_id, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_maintenance_quotes").select("id, status, amount, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_owner_statements").select("id, owner_id, reference_month, net_payout, gross_revenue, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_professionals").select("id, active, role").limit(5000),
      supabaseAdmin.from("marocas_services").select("id, status, service_type, cost, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_supplies").select("id, current_qty, min_qty, unit_cost, created_at").limit(20000),
      supabaseAdmin.from("marocas_report_runs").select("id, status, schedule_id, total, done, late, error, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_report_schedules").select("id, enabled, period").limit(2000),
    ]);

    const err = aptRes.error || ownRes.error || reqRes.error || quoteRes.error || statRes.error || profRes.error || servRes.error || supRes.error || runRes.error || schedRes.error;
    if (err) throw new Error(err.message);

    const apts = (aptRes.data ?? []) as any[];
    const owners = (ownRes.data ?? []) as any[];
    const reqs = (reqRes.data ?? []) as any[];
    const quotes = (quoteRes.data ?? []) as any[];
    const stmts = (statRes.data ?? []) as any[];
    const profs = (profRes.data ?? []) as any[];
    const servs = (servRes.data ?? []) as any[];
    const sups = (supRes.data ?? []) as any[];
    const runs = (runRes.data ?? []) as any[];
    const scheds = (schedRes.data ?? []) as any[];

    const aptAvail = apts.filter((a) => a.status === "disponivel" || a.status === "ocupado").length;
    const aptMaint = apts.filter((a) => a.status === "manutencao").length;
    const buildingMap = new Map<string, number>();
    for (const a of apts) { const k = a.building || "—"; buildingMap.set(k, (buildingMap.get(k) ?? 0) + 1); }
    const topBuildings = Array.from(buildingMap, ([building, count]) => ({ building, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const reqOpen = reqs.filter((r) => r.status === "open" || r.status === "pending" || r.status === "in_progress").length;
    const reqDone = reqs.filter((r) => r.status === "done" || r.status === "resolved" || r.status === "completed").length;
    const reqHigh = reqs.filter((r) => r.priority === "alta" || r.priority === "urgente").length;

    const quoteApproved = quotes.filter((q) => q.status === "approved" || q.status === "accepted").length;
    const quoteAmount = quotes.filter((q) => q.status === "approved" || q.status === "accepted").reduce((s, q) => s + Number(q.amount || 0), 0);

    const stmtAmount = stmts.reduce((s, st) => s + Number(st.net_payout || 0), 0);
    const stmtPaid = stmts.filter((s) => s.status === "paid" || s.status === "sent").length;

    const profActive = profs.filter((p) => p.active).length;
    const servAmount = servs.reduce((s, sv) => s + Number(sv.cost || 0), 0);
    const supLow = sups.filter((s) => Number(s.current_qty || 0) <= Number(s.min_qty || 0)).length;
    const supValue = sups.reduce((s, sp) => s + Number(sp.current_qty || 0) * Number(sp.unit_cost || 0), 0);

    const runsOk = runs.filter((r) => r.status === "success" || r.status === "done" || r.status === "completed").length;
    const runsFail = runs.filter((r) => r.status === "failed" || r.status === "error").length;
    const schedsActive = scheds.filter((s) => s.enabled).length;

    return {
      days: data.days,
      apartments: { total: apts.length, available: aptAvail, maintenance: aptMaint, topBuildings },
      owners: { total: owners.length },
      maintenance: { total: reqs.length, open: reqOpen, done: reqDone, highPriority: reqHigh, quotes: quotes.length, approvedQuotes: quoteApproved, approvedAmount: quoteAmount },
      statements: { total: stmts.length, paid: stmtPaid, amount: stmtAmount },
      professionals: { total: profs.length, active: profActive },
      services: { total: servs.length, amount: servAmount },
      supplies: { total: sups.length, lowStock: supLow, totalValue: supValue },
      reports: { runs: runs.length, ok: runsOk, fail: runsFail, schedules: scheds.length, activeSchedules: schedsActive },
    };
  });
