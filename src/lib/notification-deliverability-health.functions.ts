import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Notification Center & Deliverability Cockpit — Fase 87.
 * Notificações in-app, preferências, tentativas de despacho multicanal,
 * estado/throttle do email, supressões, unsubscribes, support inbox e
 * roteamento WhatsApp por credencial.
 */
export const getNotificationDeliverabilityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [nRes, naRes, npRes, nrRes, esRes, euRes, suRes, siRes, wcRes, wfRes, wrRes] = await Promise.all([
      supabaseAdmin.from("notifications").select("id, user_id, company_id, category, severity, is_read, read_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("notification_attempt_log").select("id, request_id, company_id, channel, event, niche, status, reason, idempotency_key, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("notification_preferences").select("id, user_id, company_id, category, channel, enabled, updated_at").limit(100000),
      supabaseAdmin.from("notification_retention_audit").select("id, changed_by_email, previous_days, new_days, reason, created_at").gte("created_at", sinceIso).limit(5000),
      supabaseAdmin.from("email_send_state").select("id, retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes, updated_at").limit(100),
      supabaseAdmin.from("email_unsubscribe_tokens").select("id, email, created_at, used_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("suppressed_emails").select("id, email, reason, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("support_email_inbox").select("id, mailbox, from_email, subject, ticket_id, processed, error, received_at").gte("received_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_whatsapp_credentials").select("id, label, provider, purpose, is_active, is_verified, verified_at, last_health_check_at, health_status, daily_quota, monthly_quota").limit(2000),
      supabaseAdmin.from("core_whatsapp_fallback_config").select("id, scope, niche_slug, credential_id, is_active, updated_at").limit(2000),
      supabaseAdmin.from("core_whatsapp_routing_rules").select("id, company_id, event_code_pattern, purpose, credential_id, priority, is_active, updated_at").limit(5000),
    ]);

    const err = nRes.error || naRes.error || npRes.error || nrRes.error || esRes.error || euRes.error || suRes.error || siRes.error || wcRes.error || wfRes.error || wrRes.error;
    if (err) throw new Error(err.message);

    const n = nRes.data ?? [];
    const na = naRes.data ?? [];
    const np = npRes.data ?? [];
    const nr = nrRes.data ?? [];
    const es = esRes.data ?? [];
    const eu = euRes.data ?? [];
    const su = suRes.data ?? [];
    const si = siRes.data ?? [];
    const wc = wcRes.data ?? [];
    const wf = wfRes.data ?? [];
    const wr = wrRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Notifications
    const nRead = n.filter((r: any) => r.is_read).length;
    const nUnread = n.length - nRead;
    const nByCategory = countBy(n, (r: any) => r.category);
    const nBySeverity = countBy(n, (r: any) => r.severity);
    const nUniqueUsers = new Set(n.map((r: any) => r.user_id).filter(Boolean)).size;
    const nReadTimes = n
      .filter((r: any) => r.is_read && r.read_at && r.created_at)
      .map((r: any) => (new Date(r.read_at).getTime() - new Date(r.created_at).getTime()) / 60000)
      .filter((x) => Number.isFinite(x) && x >= 0);
    const nAvgReadMin = nReadTimes.length ? nReadTimes.reduce((a, b) => a + b, 0) / nReadTimes.length : 0;

    // Attempt log
    const naByChannel = countBy(na, (r: any) => r.channel);
    const naByStatus = countBy(na, (r: any) => r.status);
    const naByEvent = countBy(na, (r: any) => r.event).slice(0, 12);
    const naByNiche = countBy(na, (r: any) => r.niche).slice(0, 12);
    const naSent = na.filter((r: any) => ["sent", "delivered", "ok", "success"].includes(String(r.status).toLowerCase())).length;
    const naFailed = na.filter((r: any) => ["failed", "error", "bounced"].includes(String(r.status).toLowerCase())).length;
    const naIdemUnique = new Set(na.map((r: any) => r.idempotency_key).filter(Boolean)).size;

    // Preferences
    const npEnabled = np.filter((r: any) => r.enabled).length;
    const npByChannel = countBy(np, (r: any) => r.channel);
    const npByCategory = countBy(np, (r: any) => r.category).slice(0, 12);
    const npUniqueUsers = new Set(np.map((r: any) => r.user_id).filter(Boolean)).size;

    // Email throttle
    const esCurrent = es[0] ?? null;
    const esThrottled = esCurrent?.retry_after_until ? new Date(esCurrent.retry_after_until).getTime() > Date.now() : false;

    // Unsubscribes
    const euUsed = eu.filter((r: any) => r.used_at).length;

    // Suppression
    const suByReason = countBy(su, (r: any) => r.reason);

    // Support inbox
    const siProcessed = si.filter((r: any) => r.processed).length;
    const siErrors = si.filter((r: any) => r.error).length;
    const siByMailbox = countBy(si, (r: any) => r.mailbox);
    const siWithTicket = si.filter((r: any) => r.ticket_id).length;

    // WhatsApp credentials/routing
    const wcActive = wc.filter((r: any) => r.is_active).length;
    const wcVerified = wc.filter((r: any) => r.is_verified).length;
    const wcUnhealthy = wc.filter((r: any) => r.health_status && String(r.health_status).toLowerCase() !== "healthy" && String(r.health_status).toLowerCase() !== "ok").length;
    const wcByPurpose = countBy(wc, (r: any) => r.purpose);
    const wrActive = wr.filter((r: any) => r.is_active).length;
    const wfActive = wf.filter((r: any) => r.is_active).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      notifications: {
        total: n.length, read: nRead, unread: nUnread,
        uniqueUsers: nUniqueUsers, avgReadMinutes: nAvgReadMin,
        byCategory: nByCategory, bySeverity: nBySeverity,
      },
      attempts: {
        total: na.length, sent: naSent, failed: naFailed,
        idempotencyKeys: naIdemUnique,
        byChannel: naByChannel, byStatus: naByStatus,
        byEvent: naByEvent, byNiche: naByNiche,
      },
      preferences: {
        total: np.length, enabled: npEnabled, uniqueUsers: npUniqueUsers,
        byChannel: npByChannel, byCategory: npByCategory,
      },
      retention: {
        changes: nr.length,
        latest: nr.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
          .map((r: any) => ({ id: r.id, by: r.changed_by_email, prev: r.previous_days, next: r.new_days, reason: r.reason, at: r.created_at })),
      },
      email: {
        throttled: esThrottled,
        state: esCurrent,
        unsubscribes: eu.length, unsubscribesUsed: euUsed,
        suppressions: su.length, suppressionByReason: suByReason,
      },
      supportInbox: {
        total: si.length, processed: siProcessed, errors: siErrors, withTicket: siWithTicket,
        byMailbox: siByMailbox,
      },
      whatsapp: {
        credentials: wc.length, active: wcActive, verified: wcVerified, unhealthy: wcUnhealthy,
        byPurpose: wcByPurpose,
        routingRules: wr.length, routingActive: wrActive,
        fallbackConfigs: wf.length, fallbackActive: wfActive,
        list: wc.slice(0, 30).map((r: any) => ({ id: r.id, label: r.label, provider: r.provider, purpose: r.purpose, active: r.is_active, verified: r.is_verified, health: r.health_status, lastCheck: r.last_health_check_at, daily: r.daily_quota, monthly: r.monthly_quota })),
      },
    };
  });
