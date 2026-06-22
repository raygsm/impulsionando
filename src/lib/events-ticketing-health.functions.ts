import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Events & Ticketing Cockpit — Fase 89.
 * Eventos, tipos de ingressos, vendas, check-ins de portaria e transferências.
 */
export const getEventsTicketingHealth = createServerFn({ method: "POST" })
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

    const [evRes, ttRes, tkRes, ciRes, trRes] = await Promise.all([
      supabaseAdmin.from("evt_events").select("id, company_id, title, slug, city, state, starts_at, ends_at, capacity, status, is_published, transfer_policy, refund_policy, created_at").limit(20000),
      supabaseAdmin.from("evt_ticket_types").select("id, company_id, event_id, name, price, quantity, quantity_sold, is_active, sale_starts_at, sale_ends_at, created_at").limit(50000),
      supabaseAdmin.from("evt_tickets").select("id, company_id, event_id, ticket_type_id, status, price_paid, issued_at, used_at, cancelled_at, customer_id, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("evt_checkins").select("id, company_id, event_id, ticket_id, gate, checked_in_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("evt_ticket_transfers").select("id, company_id, ticket_id, status, reason, fee_cents, decided_at, created_at, updated_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = evRes.error || ttRes.error || tkRes.error || ciRes.error || trRes.error;
    if (err) throw new Error(err.message);

    const ev = evRes.data ?? [];
    const tt = ttRes.data ?? [];
    const tk = tkRes.data ?? [];
    const ci = ciRes.data ?? [];
    const tr = trRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Events
    const evPublished = ev.filter((r: any) => r.is_published).length;
    const evUpcoming = ev.filter((r: any) => r.starts_at && r.starts_at >= nowIso && r.starts_at <= in30Iso).length;
    const evLive = ev.filter((r: any) => r.starts_at && r.ends_at && r.starts_at <= nowIso && r.ends_at >= nowIso).length;
    const evPast = ev.filter((r: any) => r.ends_at && r.ends_at < nowIso).length;
    const evByStatus = countBy(ev, (r: any) => r.status);
    const evByState = countBy(ev, (r: any) => r.state).slice(0, 10);
    const evByCity = countBy(ev, (r: any) => r.city).slice(0, 10);

    // Ticket types & sales
    const ttActive = tt.filter((r: any) => r.is_active).length;
    const ttCapacity = tt.reduce((a: number, r: any) => a + (Number(r.quantity) || 0), 0);
    const ttSold = tt.reduce((a: number, r: any) => a + (Number(r.quantity_sold) || 0), 0);
    const ttSellThrough = ttCapacity > 0 ? (ttSold / ttCapacity) * 100 : 0;
    const ttSoldOut = tt.filter((r: any) => Number(r.quantity) > 0 && Number(r.quantity_sold) >= Number(r.quantity)).length;

    // Tickets (period)
    const tkValid = tk.filter((r: any) => String(r.status).toLowerCase() === "valid" || String(r.status).toLowerCase() === "issued").length;
    const tkUsed = tk.filter((r: any) => r.used_at).length;
    const tkCancelled = tk.filter((r: any) => r.cancelled_at).length;
    const tkRevenue = tk.reduce((a: number, r: any) => a + (Number(r.price_paid) || 0), 0);
    const tkByStatus = countBy(tk, (r: any) => r.status);
    const tkAvgPrice = tk.length > 0 ? tkRevenue / tk.length : 0;

    // Top events by ticket count
    const evTitle = new Map<string, string>(ev.map((e: any) => [e.id, e.title]));
    const tkByEvent = new Map<string, { count: number; revenue: number; used: number }>();
    for (const r of tk as any[]) {
      const k = r.event_id ?? "—";
      const cur = tkByEvent.get(k) ?? { count: 0, revenue: 0, used: 0 };
      cur.count += 1;
      cur.revenue += Number(r.price_paid) || 0;
      if (r.used_at) cur.used += 1;
      tkByEvent.set(k, cur);
    }
    const topEvents = Array.from(tkByEvent.entries())
      .map(([id, v]) => ({ id, title: evTitle.get(id) ?? id.slice(0, 8), count: v.count, revenue: v.revenue, used: v.used, attendance: v.count > 0 ? (v.used / v.count) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 12);

    // Check-ins
    const ciByGate = countBy(ci, (r: any) => r.gate).slice(0, 10);
    const uniqueTicketsCheckedIn = new Set(ci.map((r: any) => r.ticket_id)).size;
    const ciDuplicates = ci.length - uniqueTicketsCheckedIn;

    // Transfers
    const trByStatus = countBy(tr, (r: any) => r.status);
    const trApproved = tr.filter((r: any) => String(r.status).toLowerCase() === "approved").length;
    const trRejected = tr.filter((r: any) => String(r.status).toLowerCase() === "rejected").length;
    const trPending = tr.filter((r: any) => String(r.status).toLowerCase() === "pending").length;
    const trFeeCents = tr.reduce((a: number, r: any) => a + (Number(r.fee_cents) || 0), 0);
    const decided = tr.filter((r: any) => r.decided_at && r.created_at);
    const avgDecisionH = decided.length > 0
      ? decided.reduce((a: number, r: any) => a + (new Date(r.decided_at).getTime() - new Date(r.created_at).getTime()), 0) / decided.length / 3600000
      : 0;

    return {
      days: data.days,
      events: {
        total: ev.length, published: evPublished, upcoming30d: evUpcoming, live: evLive, past: evPast,
        byStatus: evByStatus, byState: evByState, byCity: evByCity,
      },
      ticketTypes: {
        total: tt.length, active: ttActive, capacity: ttCapacity, sold: ttSold,
        sellThroughPct: ttSellThrough, soldOut: ttSoldOut,
      },
      tickets: {
        total: tk.length, valid: tkValid, used: tkUsed, cancelled: tkCancelled,
        revenue: tkRevenue, avgPrice: tkAvgPrice, byStatus: tkByStatus, topEvents,
      },
      checkins: {
        total: ci.length, uniqueTickets: uniqueTicketsCheckedIn, duplicates: ciDuplicates, byGate: ciByGate,
      },
      transfers: {
        total: tr.length, approved: trApproved, rejected: trRejected, pending: trPending,
        feeCents: trFeeCents, avgDecisionHours: avgDecisionH, byStatus: trByStatus,
      },
    };
  });
