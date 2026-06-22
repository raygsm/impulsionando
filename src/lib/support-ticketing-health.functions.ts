import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Support & Ticketing Cockpit — Fase 65.
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
      supabaseAdmin.from("support_tickets").select("id, status, priority, type, assigned_to, first_response_at, resolved_at, created_at, sla_due_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("support_ticket_messages").select("id, ticket_id, author_role, is_internal, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("support_sessions").select("id, started_at, ended_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("support_email_inbox").select("id, processed, subject, from_email, received_at").gte("received_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_slo_targets").select("id, name, latency_p95_target_ms, active").limit(2000),
    ]);

    const err = tkRes.error || msgRes.error || sesRes.error || inbRes.error || sloRes.error;
    if (err) throw new Error(err.message);

    const tks = (tkRes.data ?? []) as any[];
    const msgs = (msgRes.data ?? []) as any[];
    const ses = (sesRes.data ?? []) as any[];
    const inb = (inbRes.data ?? []) as any[];
    const slo = (sloRes.data ?? []) as any[];

    const tkOpen = tks.filter((t) => t.status === "open" || t.status === "pending" || t.status === "in_progress").length;
    const tkResolved = tks.filter((t) => t.status === "resolved" || t.status === "closed" || t.resolved_at).length;
    const tkHigh = tks.filter((t) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical" || t.priority === "alta" || t.priority === "urgente").length;
    const tkUnassigned = tks.filter((t) => !t.assigned_to && (t.status === "open" || t.status === "pending")).length;
    const tkSlaOverdue = tks.filter((t) => t.sla_due_at && new Date(t.sla_due_at) < new Date() && !t.resolved_at).length;

    const respTimes = tks.filter((t) => t.first_response_at && t.created_at).map((t) => (new Date(t.first_response_at as string).getTime() - new Date(t.created_at as string).getTime()) / 60000);
    const avgFirstResp = respTimes.length ? Math.round(respTimes.reduce((a, b) => a + b, 0) / respTimes.length) : 0;

    const resTimes = tks.filter((t) => t.resolved_at && t.created_at).map((t) => (new Date(t.resolved_at as string).getTime() - new Date(t.created_at as string).getTime()) / 3600000);
    const avgResolution = resTimes.length ? Math.round(resTimes.reduce((a, b) => a + b, 0) / resTimes.length * 10) / 10 : 0;

    const typeMap = new Map<string, number>();
    for (const t of tks) { const k = t.type || "—"; typeMap.set(k, (typeMap.get(k) ?? 0) + 1); }
    const topTypes = Array.from(typeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const senderMap = new Map<string, number>();
    for (const m of msgs) { const k = m.author_role || "—"; senderMap.set(k, (senderMap.get(k) ?? 0) + 1); }
    const bySender = Array.from(senderMap, ([sender, count]) => ({ sender, count }));
    const msgsInternal = msgs.filter((m) => m.is_internal).length;

    const sesEnded = ses.filter((s) => s.ended_at).length;
    const sesAvgMin = (() => {
      const v = ses.filter((s) => s.started_at && s.ended_at).map((s) => (new Date(s.ended_at as string).getTime() - new Date(s.started_at as string).getTime()) / 60000);
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
    })();

    const inbNew = inb.filter((i) => !i.processed).length;
    const inbProcessed = inb.filter((i) => i.processed).length;

    const slosActive = slo.filter((s) => s.active).length;

    return {
      days: data.days,
      tickets: { total: tks.length, open: tkOpen, resolved: tkResolved, high: tkHigh, unassigned: tkUnassigned, slaOverdue: tkSlaOverdue, avgFirstResponseMin: avgFirstResp, avgResolutionHours: avgResolution, topTypes },
      messages: { total: msgs.length, internal: msgsInternal, bySender },
      sessions: { total: ses.length, ended: sesEnded, avgDurationMin: sesAvgMin },
      inbox: { total: inb.length, new: inbNew, processed: inbProcessed },
      slo: { total: slo.length, active: slosActive },
    };
  });
