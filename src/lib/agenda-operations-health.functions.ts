import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Agenda Operations Cockpit — Fase 96.
 * Operação corrente da Agenda: appointments, open_slots, waitlist, slot_offers,
 * penalties, no_show_events. Complementa o cockpit de Recursos (Fase 95).
 */
export const getAgendaOperationsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const nowIso = new Date().toISOString();

    const [apptRes, slotRes, wlRes, offRes, penRes, nsRes] = await Promise.all([
      supabaseAdmin
        .from("agenda_appointments")
        .select("id, company_id, status, channel, professional_id, service_id, location_id, room_id, customer_id, price, created_at, starts_at, ends_at, cancelled_at, no_show_at")
        .gte("created_at", sinceIso)
        .limit(200000),
      supabaseAdmin
        .from("agenda_open_slots")
        .select("id, company_id, status, professional_id, service_id, location_id, starts_at, ends_at, price, created_at, filled_at")
        .gte("created_at", sinceIso)
        .limit(200000),
      supabaseAdmin
        .from("agenda_waitlist")
        .select("id, company_id, status, service_id, professional_id, customer_id, priority, created_at, resolved_at")
        .gte("created_at", sinceIso)
        .limit(100000),
      supabaseAdmin
        .from("agenda_slot_offers")
        .select("id, company_id, slot_id, customer_id, status, sent_at, responded_at, expires_at, created_at")
        .gte("created_at", sinceIso)
        .limit(200000),
      supabaseAdmin
        .from("agenda_penalties")
        .select("id, company_id, customer_id, kind, amount, status, applied_at, created_at")
        .gte("created_at", sinceIso)
        .limit(100000),
      supabaseAdmin
        .from("agenda_no_show_events")
        .select("id, company_id, appointment_id, customer_id, professional_id, reason, created_at")
        .gte("created_at", sinceIso)
        .limit(100000),
    ]);

    const err = apptRes.error || slotRes.error || wlRes.error || offRes.error || penRes.error || nsRes.error;
    if (err) throw new Error(err.message);

    const appt = apptRes.data ?? [];
    const slot = slotRes.data ?? [];
    const wl = wlRes.data ?? [];
    const off = offRes.data ?? [];
    const pen = penRes.data ?? [];
    const ns = nsRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const sum = (rows: any[], f: string) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);

    // Appointments
    const apptTotal = appt.length;
    const apptByStatus = countBy(appt, (r: any) => r.status);
    const apptByChannel = countBy(appt, (r: any) => r.channel);
    const apptCompanies = new Set(appt.map((r: any) => r.company_id)).size;
    const apptCancelled = appt.filter((r: any) => r.cancelled_at).length;
    const apptNoShow = appt.filter((r: any) => r.no_show_at).length;
    const apptConfirmed = appt.filter((r: any) => ["confirmed", "completed", "done", "checked_in"].includes(String(r.status))).length;
    const apptUpcoming = appt.filter((r: any) => r.starts_at && r.starts_at > nowIso && !r.cancelled_at).length;
    const apptGross = sum(appt.filter((r: any) => !r.cancelled_at), "price");
    const apptAvgTicket = apptConfirmed ? apptGross / apptConfirmed : 0;
    const apptCancelRate = apptTotal ? (apptCancelled / apptTotal) * 100 : 0;
    const apptNoShowRate = apptTotal ? (apptNoShow / apptTotal) * 100 : 0;

    // Open slots
    const slotTotal = slot.length;
    const slotByStatus = countBy(slot, (r: any) => r.status);
    const slotFilled = slot.filter((r: any) => r.filled_at || ["filled", "booked"].includes(String(r.status))).length;
    const slotFillRate = slotTotal ? (slotFilled / slotTotal) * 100 : 0;
    const slotAvgPrice = slot.length ? sum(slot, "price") / slot.length : 0;

    // Waitlist
    const wlTotal = wl.length;
    const wlByStatus = countBy(wl, (r: any) => r.status);
    const wlOpen = wl.filter((r: any) => !r.resolved_at && !["resolved", "cancelled", "expired"].includes(String(r.status))).length;
    const wlResolved = wl.filter((r: any) => r.resolved_at).length;
    const wlByPriority = countBy(wl, (r: any) => String(r.priority ?? ""));
    const wlResolutionH = (() => {
      const arr = wl.filter((r: any) => r.resolved_at && r.created_at).map((r: any) =>
        (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 36e5
      );
      return arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    })();

    // Slot offers
    const offTotal = off.length;
    const offByStatus = countBy(off, (r: any) => r.status);
    const offAccepted = off.filter((r: any) => ["accepted", "confirmed"].includes(String(r.status))).length;
    const offDeclined = off.filter((r: any) => ["declined", "rejected"].includes(String(r.status))).length;
    const offExpired = off.filter((r: any) => r.expires_at && r.expires_at < nowIso && !r.responded_at).length;
    const offAcceptRate = offTotal ? (offAccepted / offTotal) * 100 : 0;
    const offResponseMin = (() => {
      const arr = off.filter((r: any) => r.responded_at && r.sent_at).map((r: any) =>
        (new Date(r.responded_at).getTime() - new Date(r.sent_at).getTime()) / 60000
      );
      return arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    })();

    // Penalties
    const penTotal = pen.length;
    const penByStatus = countBy(pen, (r: any) => r.status);
    const penByKind = countBy(pen, (r: any) => r.kind);
    const penApplied = pen.filter((r: any) => r.applied_at).length;
    const penGross = sum(pen, "amount");

    // No-show events
    const nsTotal = ns.length;
    const nsByReason = countBy(ns, (r: any) => r.reason).slice(0, 15);
    const nsByPro = countBy(ns, (r: any) => r.professional_id).slice(0, 10);
    const nsByCustomer = countBy(ns, (r: any) => r.customer_id).slice(0, 10);

    // Top professionals (by appointment volume)
    const apptByPro = countBy(appt, (r: any) => r.professional_id).slice(0, 10);
    const apptByService = countBy(appt, (r: any) => r.service_id).slice(0, 10);
    const apptByLocation = countBy(appt, (r: any) => r.location_id).slice(0, 10);

    return {
      windowDays: data.days,
      appointments: {
        total: apptTotal, companies: apptCompanies, confirmed: apptConfirmed,
        cancelled: apptCancelled, noShow: apptNoShow, upcoming: apptUpcoming,
        grossBRL: apptGross, avgTicketBRL: apptAvgTicket,
        cancelRate: apptCancelRate, noShowRate: apptNoShowRate,
        byStatus: apptByStatus, byChannel: apptByChannel,
        byProfessional: apptByPro, byService: apptByService, byLocation: apptByLocation,
      },
      openSlots: {
        total: slotTotal, filled: slotFilled, fillRate: slotFillRate,
        avgPriceBRL: slotAvgPrice, byStatus: slotByStatus,
      },
      waitlist: {
        total: wlTotal, open: wlOpen, resolved: wlResolved,
        avgResolutionHours: wlResolutionH,
        byStatus: wlByStatus, byPriority: wlByPriority,
      },
      slotOffers: {
        total: offTotal, accepted: offAccepted, declined: offDeclined, expired: offExpired,
        acceptRate: offAcceptRate, avgResponseMin: offResponseMin,
        byStatus: offByStatus,
      },
      penalties: {
        total: penTotal, applied: penApplied, grossBRL: penGross,
        byStatus: penByStatus, byKind: penByKind,
      },
      noShow: {
        total: nsTotal, byReason: nsByReason,
        byProfessional: nsByPro, byCustomer: nsByCustomer,
      },
    };
  });
