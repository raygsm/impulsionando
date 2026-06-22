import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marocas Hospitality Cockpit — Fase 63.
 * Apartamentos, proprietários, manutenção, suprimentos, profissionais e relatórios.
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
      supabaseAdmin.from("marocas_owners").select("id, status, created_at").limit(20000),
      supabaseAdmin.from("marocas_maintenance_requests").select("id, status, priority, apartment_id, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_maintenance_quotes").select("id, status, total_amount, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_owner_statements").select("id, owner_id, period, total_amount, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_professionals").select("id, status, specialty").limit(5000),
      supabaseAdmin.from("marocas_services").select("id, status, service_type, total_amount, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_supplies").select("id, status, total_amount, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_report_runs").select("id, status, schedule_id, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_report_schedules").select("id, active, name").limit(2000),
    ]);

    const err = aptRes.error || ownRes.error || reqRes.error || quoteRes.error || statRes.error || profRes.error || servRes.error || supRes.error || runRes.error || schedRes.error;
    if (err) throw new Error(err.message);

    const apts = aptRes.data ?? [];
    const owners = ownRes.data ?? [];
    const reqs = reqRes.data ?? [];
    const quotes = quoteRes.data ?? [];
    const stmts = statRes.data ?? [];
    const profs = profRes.data ?? [];
    const servs = servRes.data ?? [];
    const sups = supRes.data ?? [];
    const runs = runRes.data ?? [];
    const scheds = schedRes.data ?? [];

    const aptActive = apts.filter((a) => a.status === "active" || a.status === "ativo").length;
    const buildingMap = new Map<string, number>();
    for (const a of apts) { const k = a.building || "—"; buildingMap.set(k, (buildingMap.get(k) ?? 0) + 1); }
    const topBuildings = Array.from(buildingMap, ([building, count]) => ({ building, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const reqOpen = reqs.filter((r) => r.status === "open" || r.status === "pending" || r.status === "in_progress").length;
    const reqDone = reqs.filter((r) => r.status === "done" || r.status === "completed" || r.status === "resolved").length;
    const reqHigh = reqs.filter((r) => r.priority === "high" || r.priority === "urgent").length;

    const quoteApproved = quotes.filter((q) => q.status === "approved" || q.status === "accepted").length;
    const quoteAmount = quotes.filter((q) => q.status === "approved" || q.status === "accepted").reduce((s, q) => s + Number(q.total_amount || 0), 0);

    const stmtAmount = stmts.reduce((s, st) => s + Number(st.total_amount || 0), 0);
    const stmtSent = stmts.filter((s) => s.status === "sent" || s.status === "delivered").length;

    const profActive = profs.filter((p) => p.status === "active" || p.status === "ativo").length;
    const servAmount = servs.reduce((s, sv) => s + Number(sv.total_amount || 0), 0);
    const supAmount = sups.reduce((s, sp) => s + Number(sp.total_amount || 0), 0);

    const runsOk = runs.filter((r) => r.status === "success" || r.status === "done").length;
    const runsFail = runs.filter((r) => r.status === "failed" || r.status === "error").length;
    const schedsActive = scheds.filter((s) => s.active).length;

    return {
      days: data.days,
      apartments: { total: apts.length, active: aptActive, topBuildings },
      owners: { total: owners.length },
      maintenance: { total: reqs.length, open: reqOpen, done: reqDone, highPriority: reqHigh, quotes: quotes.length, approvedQuotes: quoteApproved, approvedAmount: quoteAmount },
      statements: { total: stmts.length, sent: stmtSent, amount: stmtAmount },
      professionals: { total: profs.length, active: profActive },
      services: { total: servs.length, amount: servAmount },
      supplies: { total: sups.length, amount: supAmount },
      reports: { runs: runs.length, ok: runsOk, fail: runsFail, schedules: scheds.length, activeSchedules: schedsActive },
    };
  });
