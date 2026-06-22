import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Support & Ticketing Cockpit — Fase 65.
 * Tickets, mensagens, sessões de suporte, inbox de e-mail e SLOs.
 */
export const getSupportTicketingHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [tkRes, msgRes, sesRes, inbRes, sloRes] = await Promise.all([
      supabaseAdmin.from("support_tickets").select("id, status, priority, category, assigned_to, opened_at, first_response_at, resolved_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("support_ticket_messages").select("id, ticket_id, sender_type, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("support_sessions").select("id, status, started_at, ended_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("support_email_inbox").select("id, status, subject, from_email, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_slo_targets").select("id, name, target_minutes, status").limit(2000),
    ]);

    const err = tkRes.error || msgRes.error || sesRes.error || inbRes.error || sloRes.error;
    if (err) throw new Error(err.message);

    const tks = tkRes.data ?? [];
    const msgs = msgRes.data ?? [];
    const ses = sesRes.data ?? [];
    const inb = inbRes.data ?? [];
    const slo = sloRes.data ?? [];

    const tkOpen = tks.filter((t) => t.status === "open" || t.status === "pending" || t.status === "in_progress").length;
    const tkResolved = tks.filter((t) => t.status === "resolved" || t.status === "closed" || t.resolved_at).length;
    const tkHigh = tks.filter((t) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical").length;
    const tkUnassigned = tks.filter((t) => !t.assigned_to && (t.status === "open" || t.status === "pending")).length;

    const respTimes = tks.filter((t) => t.first_response_at && t.opened_at).map((t) => (new Date(t.first_response_at as string).getTime() - new Date(t.opened_at as string).getTime()) / 60000);
    const avgFirstResp = respTimes.length ? Math.round(respTimes.reduce((a, b) => a + b, 0) / respTimes.length) : 0;

    const resTimes = tks.filter((t) => t.resolved_at && t.opened_at).map((t) => (new Date(t.resolved_at as string).getTime() - new Date(t.opened_at as string).getTime()) / 3600000);
    const avgResolution = resTimes.length ? Math.round(resTimes.reduce((a, b) => a + b, 0) / resTimes.length * 10) / 10 : 0;

    const catMap = new Map<string, number>();
    for (const t of tks) { const k = t.category || "—"; catMap.set(k, (catMap.get(k) ?? 0) + 1); }
    const topCategories = Array.from(catMap, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const senderMap = new Map<string, number>();
    for (const m of msgs) { const k = m.sender_type || "—"; senderMap.set(k, (senderMap.get(k) ?? 0) + 1); }
    const bySender = Array.from(senderMap, ([sender, count]) => ({ sender, count }));

    const sesEnded = ses.filter((s) => s.ended_at).length;
    const sesAvgMin = (() => {
      const v = ses.filter((s) => s.started_at && s.ended_at).map((s) => (new Date(s.ended_at as string).getTime() - new Date(s.started_at as string).getTime()) / 60000);
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
    })();

    const inbNew = inb.filter((i) => i.status === "new" || i.status === "unread").length;
    const inbProcessed = inb.filter((i) => i.status === "processed" || i.status === "done").length;

    const slosActive = slo.filter((s) => s.status === "active").length;

    return {
      days: data.days,
      tickets: { total: tks.length, open: tkOpen, resolved: tkResolved, high: tkHigh, unassigned: tkUnassigned, avgFirstResponseMin: avgFirstResp, avgResolutionHours: avgResolution, topCategories },
      messages: { total: msgs.length, bySender },
      sessions: { total: ses.length, ended: sesEnded, avgDurationMin: sesAvgMin },
      inbox: { total: inb.length, new: inbNew, processed: inbProcessed },
      slo: { total: slo.length, active: slosActive },
    };
  });
