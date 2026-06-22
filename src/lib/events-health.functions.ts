import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Eventos & Ticketing Cockpit — Fase 50.
 * Vendas, sell-through, check-in rate, transferências e receita por evento.
 */
export const getEventsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const sinceIso = new Date(now - data.days * 86400000).toISOString();

    const [evRes, ttRes, tkRes, ckRes, trRes] = await Promise.all([
      supabaseAdmin
        .from("evt_events")
        .select("id, company_id, title, city, state, starts_at, ends_at, capacity, status, is_published, transfer_policy")
        .limit(20000),
      supabaseAdmin
        .from("evt_ticket_types")
        .select("id, company_id, event_id, name, price, quantity, quantity_sold, is_active")
        .limit(50000),
      supabaseAdmin
        .from("evt_tickets")
        .select("id, company_id, event_id, ticket_type_id, status, price_paid, issued_at, used_at, cancelled_at, created_at")
        .limit(100000),
      supabaseAdmin
        .from("evt_checkins")
        .select("id, event_id, ticket_id, gate, checked_in_at")
        .gte("checked_in_at", sinceIso)
        .limit(100000),
      supabaseAdmin
        .from("evt_ticket_transfers")
        .select("id, ticket_id, status, fee_cents, created_at, decided_at")
        .gte("created_at", sinceIso)
        .limit(50000),
    ]);

    const err = evRes.error || ttRes.error || tkRes.error || ckRes.error || trRes.error;
    if (err) throw new Error(err.message);

    const events = evRes.data ?? [];
    const types = ttRes.data ?? [];
    const tickets = tkRes.data ?? [];
    const checkins = ckRes.data ?? [];
    const transfers = trRes.data ?? [];

    const todayIso = new Date().toISOString();
    const upcoming = events.filter((e) => e.starts_at && e.starts_at >= todayIso);
    const past = events.filter((e) => e.ends_at && e.ends_at < todayIso);
    const published = events.filter((e) => e.is_published).length;

    const ticketsValid = tickets.filter((t) => t.status === "issued" || t.status === "active" || t.status === "valid" || !!t.issued_at && !t.cancelled_at);
    const ticketsUsed = tickets.filter((t) => !!t.used_at || t.status === "used").length;
    const ticketsCancelled = tickets.filter((t) => !!t.cancelled_at || t.status === "cancelled" || t.status === "refunded").length;
    const ticketsInWindow = tickets.filter((t) => t.created_at && t.created_at >= sinceIso);
    const gmv = tickets.reduce((s, t) => s + Number(t.price_paid || 0), 0);
    const gmvWindow = ticketsInWindow.reduce((s, t) => s + Number(t.price_paid || 0), 0);
    const refundedRevenue = tickets.filter((t) => !!t.cancelled_at).reduce((s, t) => s + Number(t.price_paid || 0), 0);
    const avgTicket = ticketsValid.length ? gmv / ticketsValid.length : 0;

    const checkinRate = ticketsValid.length ? (ticketsUsed / ticketsValid.length) * 100 : 0;

    const totalCapacity = events.reduce((s, e) => s + Number(e.capacity || 0), 0);
    const totalSold = types.reduce((s, t) => s + Number(t.quantity_sold || 0), 0);
    const totalOffered = types.reduce((s, t) => s + Number(t.quantity || 0), 0);
    const sellThrough = totalOffered ? (totalSold / totalOffered) * 100 : 0;

    // transfers
    const trApproved = transfers.filter((t) => t.status === "approved" || t.status === "completed").length;
    const trPending = transfers.filter((t) => t.status === "pending" || t.status === "requested").length;
    const trRejected = transfers.filter((t) => t.status === "rejected" || t.status === "denied").length;
    const trFees = transfers.reduce((s, t) => s + Number(t.fee_cents || 0), 0) / 100;

    // ranking events
    const evMap = new Map<string, { title: string; city: string; starts: string | null; capacity: number; sold: number; used: number; revenue: number; cancelled: number }>();
    for (const e of events) {
      evMap.set(e.id, { title: e.title, city: [e.city, e.state].filter(Boolean).join("/") || "—", starts: e.starts_at, capacity: Number(e.capacity || 0), sold: 0, used: 0, revenue: 0, cancelled: 0 });
    }
    for (const t of tickets) {
      const m = evMap.get(t.event_id);
      if (!m) continue;
      if (!t.cancelled_at) {
        m.sold++;
        m.revenue += Number(t.price_paid || 0);
      } else {
        m.cancelled++;
      }
      if (t.used_at) m.used++;
    }
    const eventsRanking = Array.from(evMap, ([id, v]) => ({
      id,
      ...v,
      occupancy: v.capacity ? (v.sold / v.capacity) * 100 : 0,
      checkinRate: v.sold ? (v.used / v.sold) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

    // por tipo
    const typeMap = new Map<string, { name: string; price: number; sold: number; offered: number; revenue: number }>();
    for (const tt of types) {
      typeMap.set(tt.id, { name: tt.name, price: Number(tt.price || 0), sold: Number(tt.quantity_sold || 0), offered: Number(tt.quantity || 0), revenue: 0 });
    }
    for (const t of tickets) {
      if (t.cancelled_at) continue;
      const m = typeMap.get(t.ticket_type_id);
      if (m) m.revenue += Number(t.price_paid || 0);
    }
    const topTypes = Array.from(typeMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    // gates
    const gateMap = new Map<string, number>();
    for (const c of checkins) {
      const k = c.gate || "padrão";
      gateMap.set(k, (gateMap.get(k) ?? 0) + 1);
    }
    const gates = Array.from(gateMap, ([gate, count]) => ({ gate, count })).sort((a, b) => b.count - a.count);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      events: {
        total: events.length,
        published,
        upcoming: upcoming.length,
        past: past.length,
        capacity: totalCapacity,
      },
      sales: {
        ticketsTotal: tickets.length,
        ticketsValid: ticketsValid.length,
        ticketsUsed,
        ticketsCancelled,
        ticketsWindow: ticketsInWindow.length,
        gmv,
        gmvWindow,
        refundedRevenue,
        avgTicket,
        sellThrough,
        totalSold,
        totalOffered,
        checkinRate,
        checkinsWindow: checkins.length,
      },
      transfers: {
        total: transfers.length,
        approved: trApproved,
        pending: trPending,
        rejected: trRejected,
        feeRevenue: trFees,
      },
      eventsRanking,
      topTypes,
      gates,
    };
  });
