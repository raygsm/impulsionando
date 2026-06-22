import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Agenda & Booking Health — Fase 42.
 * Saúde da agenda: no-show, ocupação, waitlist, slots abertos, penalidades.
 */
export const getAgendaHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const nowIso = new Date().toISOString();
    const in7Iso = new Date(Date.now() + 7 * 86400000).toISOString();

    const [apptRes, noShowRes, openSlotsRes, waitlistRes, penaltiesRes, profsRes] = await Promise.all([
      supabaseAdmin
        .from("agenda_appointments")
        .select("id, company_id, professional_id, status, starts_at, ends_at, cancelled_at, price, created_at")
        .gte("starts_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("agenda_no_show_events")
        .select("id, company_id, professional_id, kind, charged_amount, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("agenda_open_slots")
        .select("id, company_id, status, starts_at, expires_at, claimed_at, current_wave, payout_amount, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("agenda_waitlist")
        .select("id, company_id, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("agenda_penalties")
        .select("id, company_id, subject_type, kind, amount, is_active, starts_at, ends_at, created_at")
        .gte("created_at", sinceIso)
        .limit(5000),
      supabaseAdmin
        .from("agenda_professionals")
        .select("id, name, is_active")
        .limit(5000),
    ]);

    const appts = apptRes.data ?? [];
    const noShows = noShowRes.data ?? [];
    const openSlots = openSlotsRes.data ?? [];
    const waitlist = waitlistRes.data ?? [];
    const penalties = penaltiesRes.data ?? [];
    const profs = profsRes.data ?? [];

    const profMap = new Map(profs.map((p) => [p.id, p]));

    // ---- Appointments breakdown ----
    const total = appts.length;
    const statusCount = appts.reduce<Record<string, number>>((acc, a) => {
      acc[a.status ?? "—"] = (acc[a.status ?? "—"] ?? 0) + 1;
      return acc;
    }, {});
    const completed = (statusCount.completed ?? 0) + (statusCount.concluido ?? 0) + (statusCount.realizado ?? 0);
    const cancelled = (statusCount.cancelled ?? 0) + (statusCount.cancelado ?? 0);
    const noShowApp = (statusCount.no_show ?? 0) + (statusCount.faltou ?? 0);
    const scheduled = (statusCount.scheduled ?? 0) + (statusCount.confirmed ?? 0) + (statusCount.agendado ?? 0) + (statusCount.confirmado ?? 0);

    const finished = completed + cancelled + noShowApp;
    const noShowRate = finished ? (noShowApp / finished) * 100 : 0;
    const cancelRate = finished ? (cancelled / finished) * 100 : 0;
    const completionRate = finished ? (completed / finished) * 100 : 0;

    // ---- Receita realizada vs perdida ----
    const revenueCompleted = appts
      .filter((a) => a.status === "completed" || a.status === "concluido" || a.status === "realizado")
      .reduce((s, a) => s + Number(a.price ?? 0), 0);
    const revenueLost = appts
      .filter((a) => a.status === "no_show" || a.status === "faltou" || a.status === "cancelled" || a.status === "cancelado")
      .reduce((s, a) => s + Number(a.price ?? 0), 0);
    const noShowChargedAmount = noShows.reduce((s, n) => s + Number(n.charged_amount ?? 0), 0);

    // ---- Upcoming 7d ----
    const upcoming = appts.filter((a) => a.starts_at >= nowIso && a.starts_at <= in7Iso && (a.status === "scheduled" || a.status === "confirmed" || a.status === "agendado" || a.status === "confirmado"));

    // ---- Open slots ----
    const slotStatus = openSlots.reduce<Record<string, number>>((acc, s) => {
      acc[s.status ?? "—"] = (acc[s.status ?? "—"] ?? 0) + 1;
      return acc;
    }, {});
    const slotsOpen = openSlots.filter((s) => s.status === "open" || s.status === "pending").length;
    const slotsClaimed = openSlots.filter((s) => s.status === "claimed" || s.claimed_at).length;
    const slotsExpired = openSlots.filter((s) => s.status === "expired").length;
    const slotFillRate = openSlots.length ? (slotsClaimed / openSlots.length) * 100 : 0;
    const slotPayoutTotal = openSlots.reduce((s, o) => s + Number(o.payout_amount ?? 0), 0);

    // ---- Top profissionais por no-show ----
    const profAgg = new Map<string, { appts: number; noShows: number; revenue: number }>();
    for (const a of appts) {
      if (!a.professional_id) continue;
      const cur = profAgg.get(a.professional_id) ?? { appts: 0, noShows: 0, revenue: 0 };
      cur.appts++;
      if (a.status === "no_show" || a.status === "faltou") cur.noShows++;
      if (a.status === "completed" || a.status === "concluido" || a.status === "realizado") cur.revenue += Number(a.price ?? 0);
      profAgg.set(a.professional_id, cur);
    }
    for (const n of noShows) {
      if (!n.professional_id) continue;
      const cur = profAgg.get(n.professional_id) ?? { appts: 0, noShows: 0, revenue: 0 };
      profAgg.set(n.professional_id, cur);
    }
    const profStats = Array.from(profAgg.entries())
      .map(([id, v]) => ({
        id,
        name: profMap.get(id)?.name ?? "—",
        appts: v.appts,
        noShows: v.noShows,
        revenue: v.revenue,
        noShowRate: v.appts ? (v.noShows / v.appts) * 100 : 0,
      }))
      .filter((p) => p.appts > 0);
    const topNoShow = [...profStats].sort((a, b) => b.noShowRate - a.noShowRate).slice(0, 10);
    const topRevenue = [...profStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // ---- Penalidades ----
    const activePenalties = penalties.filter((p) => p.is_active).length;
    const penaltyAmount = penalties.reduce((s, p) => s + Number(p.amount ?? 0), 0);

    return {
      windowDays: data.days,
      kpis: {
        totalAppts: total,
        completed,
        cancelled,
        noShowApp,
        scheduled,
        upcoming7d: upcoming.length,
        noShowRate,
        cancelRate,
        completionRate,
        revenueCompleted,
        revenueLost,
        noShowChargedAmount,
        slotsOpen,
        slotsClaimed,
        slotsExpired,
        slotFillRate,
        slotPayoutTotal,
        waitlist: waitlist.length,
        activePenalties,
        penaltyAmount,
        professionalsActive: profs.filter((p) => p.is_active).length,
        professionalsTotal: profs.length,
      },
      statusCount,
      slotStatus,
      topNoShow,
      topRevenue,
    };
  });
