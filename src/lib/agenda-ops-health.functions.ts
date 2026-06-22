import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Agenda Operations Cockpit — Fase 73.
 * Open-slots, ofertas para profissionais, no-show, waitlist, penalidades.
 */
export const getAgendaOpsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({
    days: Math.max(7, Math.min(180, d?.days ?? 30)),
  }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [slotsRes, offersRes, noshowRes, wlRes, penRes, profsRes, svcRes] = await Promise.all([
      supabaseAdmin.from("agenda_open_slots")
        .select("id, company_id, origin, service_id, status, payout_amount, current_wave, claimed_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("agenda_slot_offers")
        .select("id, company_id, open_slot_id, professional_id, wave, status, sent_at, seen_at, responded_at, channel, created_at")
        .gte("created_at", sinceIso)
        .limit(100000),
      supabaseAdmin.from("agenda_no_show_events")
        .select("id, company_id, kind, charged_amount, policy_applied, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("agenda_waitlist")
        .select("id, company_id, status, created_at")
        .limit(50000),
      supabaseAdmin.from("agenda_penalties")
        .select("id, company_id, subject_type, kind, amount, is_active, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("agenda_professionals")
        .select("id, company_id, is_active")
        .limit(20000),
      supabaseAdmin.from("agenda_services")
        .select("id, company_id, is_active")
        .limit(20000),
    ]);

    const slots = slotsRes.data ?? [];
    const offers = offersRes.data ?? [];
    const ns = noshowRes.data ?? [];
    const wl = wlRes.data ?? [];
    const pen = penRes.data ?? [];
    const profs = profsRes.data ?? [];
    const svcs = svcRes.data ?? [];

    const slotByStatus: Record<string, number> = {};
    for (const s of slots) slotByStatus[s.status ?? "—"] = (slotByStatus[s.status ?? "—"] ?? 0) + 1;
    const claimedSlots = slots.filter((s: any) => s.claimed_at).length;
    const fillRate = slots.length ? Math.round((claimedSlots / slots.length) * 1000) / 10 : 0;
    let claimLagSum = 0, claimLagN = 0;
    for (const s of slots) {
      if (s.claimed_at && s.created_at) {
        claimLagSum += (new Date(s.claimed_at).getTime() - new Date(s.created_at).getTime()) / 60000;
        claimLagN++;
      }
    }
    const avgClaimMin = claimLagN ? Math.round(claimLagSum / claimLagN) : 0;
    const totalPayout = slots.reduce((s: number, x: any) => s + Number(x.payout_amount ?? 0), 0);

    const offByStatus: Record<string, number> = {};
    const offByChannel: Record<string, number> = {};
    for (const o of offers) {
      offByStatus[o.status ?? "—"] = (offByStatus[o.status ?? "—"] ?? 0) + 1;
      offByChannel[o.channel ?? "—"] = (offByChannel[o.channel ?? "—"] ?? 0) + 1;
    }
    const seenOffers = offers.filter((o: any) => o.seen_at).length;
    const respondedOffers = offers.filter((o: any) => o.responded_at).length;
    const acceptedOffers = offers.filter((o: any) => o.status === "accepted" || o.status === "claimed").length;
    const acceptanceRate = respondedOffers ? Math.round((acceptedOffers / respondedOffers) * 1000) / 10 : 0;

    const nsByKind: Record<string, number> = {};
    for (const n of ns) nsByKind[n.kind ?? "—"] = (nsByKind[n.kind ?? "—"] ?? 0) + 1;
    const nsCharged = ns.reduce((s: number, n: any) => s + Number(n.charged_amount ?? 0), 0);

    const wlActive = wl.filter((w: any) => w.status === "active" || w.status === "waiting").length;
    const wlFulfilled = wl.filter((w: any) => w.status === "fulfilled" || w.status === "scheduled").length;

    const penByKind: Record<string, number> = {};
    for (const p of pen) penByKind[p.kind ?? "—"] = (penByKind[p.kind ?? "—"] ?? 0) + 1;
    const activePenalties = pen.filter((p: any) => p.is_active).length;
    const penTotal = pen.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    return {
      slots: {
        total: slots.length,
        claimed: claimedSlots,
        fillRate,
        avgClaimMin,
        totalPayout,
        byStatus: Object.entries(slotByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      offers: {
        total: offers.length,
        seen: seenOffers,
        responded: respondedOffers,
        accepted: acceptedOffers,
        acceptanceRate,
        byStatus: Object.entries(offByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
        byChannel: Object.entries(offByChannel).map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count),
      },
      noShow: {
        total: ns.length,
        charged: nsCharged,
        byKind: Object.entries(nsByKind).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      },
      waitlist: {
        total: wl.length,
        active: wlActive,
        fulfilled: wlFulfilled,
      },
      penalties: {
        total: pen.length,
        active: activePenalties,
        amount: penTotal,
        byKind: Object.entries(penByKind).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      },
      resources: {
        professionals: profs.length,
        activeProfessionals: profs.filter((p: any) => p.is_active).length,
        services: svcs.length,
        activeServices: svcs.filter((s: any) => s.is_active).length,
      },
    };
  });
