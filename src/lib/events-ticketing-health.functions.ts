import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Eventos & Ticketing Cockpit — Fase 69.
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

    const [evRes, ttRes, tkRes, trRes, ciRes] = await Promise.all([
      supabaseAdmin.from("evt_events").select("id, status, starts_at, ends_at, city, created_at").limit(20000),
      supabaseAdmin.from("evt_ticket_types").select("id, event_id, name, price, capacity, sold").limit(20000),
      supabaseAdmin.from("evt_tickets").select("id, event_id, status, price, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("evt_ticket_transfers").select("id, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("evt_checkins").select("id, event_id, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = evRes.error || ttRes.error || tkRes.error || trRes.error || ciRes.error;
    if (err) throw new Error(err.message);

    const ev = (evRes.data ?? []) as any[];
    const tt = (ttRes.data ?? []) as any[];
    const tk = (tkRes.data ?? []) as any[];
    const tr = (trRes.data ?? []) as any[];
    const ci = (ciRes.data ?? []) as any[];

    const now = Date.now();
    const evUpcoming = ev.filter((e) => e.starts_at && new Date(e.starts_at).getTime() > now && (e.status === "published" || e.status === "active" || e.status === "publicado")).length;
    const evPast = ev.filter((e) => e.ends_at && new Date(e.ends_at).getTime() < now).length;
    const evDraft = ev.filter((e) => e.status === "draft" || e.status === "rascunho").length;
    const evByCity = (() => { const m = new Map<string, number>(); for (const e of ev) { const k = e.city || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 10); })();

    const ttCapacity = tt.reduce((a, b) => a + (Number(b.capacity) || 0), 0);
    const ttSold = tt.reduce((a, b) => a + (Number(b.sold) || 0), 0);
    const occupancy = ttCapacity > 0 ? Math.round((ttSold / ttCapacity) * 1000) / 10 : 0;

    const tkPaid = tk.filter((t) => t.status === "paid" || t.status === "confirmed" || t.status === "ativo").length;
    const tkCanceled = tk.filter((t) => t.status === "canceled" || t.status === "cancelado" || t.status === "refunded").length;
    const tkRevenue = tk.filter((t) => t.status === "paid" || t.status === "confirmed").map((t) => Number(t.price) || 0).reduce((a, b) => a + b, 0);

    const trDone = tr.filter((t) => t.status === "completed" || t.status === "concluido" || t.status === "accepted").length;
    const trPending = tr.filter((t) => t.status === "pending" || t.status === "pendente").length;

    const ciByEvent = (() => { const m = new Map<string, number>(); for (const c of ci) { const k = c.event_id || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([eventId, count]) => ({ eventId, count })).sort((a, b) => b.count - a.count).slice(0, 10); })();
    const checkInRate = tkPaid > 0 ? Math.round((ci.length / tkPaid) * 1000) / 10 : 0;

    return {
      days: data.days,
      events: { total: ev.length, upcoming: evUpcoming, past: evPast, draft: evDraft, byCity: evByCity },
      ticketTypes: { total: tt.length, capacity: ttCapacity, sold: ttSold, occupancyPct: occupancy },
      tickets: { total: tk.length, paid: tkPaid, canceled: tkCanceled, revenue: tkRevenue },
      transfers: { total: tr.length, done: trDone, pending: trPending },
      checkins: { total: ci.length, checkInRatePct: checkInRate, topEvents: ciByEvent },
    };
  });
