import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Notifications Cockpit — Fase 61.
 * Visão consolidada de notificações in-app, preferências, tentativas, retenção,
 * templates, email_send_log/state, suppressed_emails e whatsapp_message_events.
 */
export const getNotificationsCockpit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [notifsRes, prefsRes, attemptsRes, retentionRes, tplRes, emailLogRes, emailStateRes, supRes, waEvtRes, webhookRunsRes] = await Promise.all([
      supabaseAdmin.from("notifications").select("id, type, status, read_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("notification_preferences").select("user_id, channel, enabled").limit(50000),
      supabaseAdmin.from("notification_attempt_log").select("id, channel, status, attempt, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("notification_retention_audit").select("id, deleted_count, ran_at, status").gte("ran_at", sinceIso).limit(5000),
      supabaseAdmin.from("message_templates").select("id, name, channel, is_active").limit(5000),
      supabaseAdmin.from("email_send_log").select("id, status, template, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("email_send_state").select("recipient, last_status, last_sent_at").limit(50000),
      supabaseAdmin.from("suppressed_emails").select("email, reason, created_at").limit(50000),
      supabaseAdmin.from("whatsapp_message_events").select("id, event_type, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_runs").select("id, source, status, http_status, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = notifsRes.error || prefsRes.error || attemptsRes.error || retentionRes.error || tplRes.error || emailLogRes.error || emailStateRes.error || supRes.error || waEvtRes.error || webhookRunsRes.error;
    if (err) throw new Error(err.message);

    const notifs = notifsRes.data ?? [];
    const prefs = prefsRes.data ?? [];
    const attempts = attemptsRes.data ?? [];
    const retention = retentionRes.data ?? [];
    const templates = tplRes.data ?? [];
    const emailLog = emailLogRes.data ?? [];
    const emailState = emailStateRes.data ?? [];
    const suppressed = supRes.data ?? [];
    const waEvts = waEvtRes.data ?? [];
    const webhookRuns = webhookRunsRes.data ?? [];

    const notifsRead = notifs.filter((n) => n.read_at).length;
    const typeMap = new Map<string, number>();
    for (const n of notifs) { const k = n.type || "—"; typeMap.set(k, (typeMap.get(k) ?? 0) + 1); }
    const topTypes = Array.from(typeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    const prefsEnabled = prefs.filter((p) => p.enabled).length;
    const channelPrefMap = new Map<string, { on: number; off: number }>();
    for (const p of prefs) {
      const k = p.channel || "—";
      const cur = channelPrefMap.get(k) ?? { on: 0, off: 0 };
      if (p.enabled) cur.on++; else cur.off++;
      channelPrefMap.set(k, cur);
    }
    const channelPrefs = Array.from(channelPrefMap, ([channel, v]) => ({ channel, ...v }));

    const attemptOk = attempts.filter((a) => a.status === "delivered" || a.status === "success" || a.status === "sent").length;
    const attemptFail = attempts.filter((a) => a.status === "failed" || a.status === "error").length;
    const attemptRetries = attempts.filter((a) => Number(a.attempt || 0) > 1).length;
    const channelAttemptMap = new Map<string, { total: number; ok: number; fail: number }>();
    for (const a of attempts) {
      const k = a.channel || "—";
      const cur = channelAttemptMap.get(k) ?? { total: 0, ok: 0, fail: 0 };
      cur.total++;
      if (a.status === "delivered" || a.status === "success" || a.status === "sent") cur.ok++;
      if (a.status === "failed" || a.status === "error") cur.fail++;
      channelAttemptMap.set(k, cur);
    }
    const channelAttempts = Array.from(channelAttemptMap, ([channel, v]) => ({ channel, ...v, successRate: v.total ? Math.round((v.ok / v.total) * 1000) / 10 : 0 })).sort((a, b) => b.total - a.total);

    const retentionRows = retention.reduce((s, r) => s + Number(r.deleted_count || 0), 0);

    const tplActive = templates.filter((t) => t.is_active).length;

    const emailSent = emailLog.filter((e) => e.status === "sent" || e.status === "delivered").length;
    const emailBounced = emailLog.filter((e) => e.status === "bounced" || e.status === "failed").length;
    const emailTplMap = new Map<string, number>();
    for (const e of emailLog) { const k = e.template || "—"; emailTplMap.set(k, (emailTplMap.get(k) ?? 0) + 1); }
    const topEmailTpls = Array.from(emailTplMap, ([template, count]) => ({ template, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const waDelivered = waEvts.filter((w) => w.status === "delivered" || w.event_type === "delivered").length;
    const waFailed = waEvts.filter((w) => w.status === "failed" || w.event_type === "failed").length;
    const waEvtMap = new Map<string, number>();
    for (const w of waEvts) { const k = w.event_type || "—"; waEvtMap.set(k, (waEvtMap.get(k) ?? 0) + 1); }
    const topWaEvts = Array.from(waEvtMap, ([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const whRunsOk = webhookRuns.filter((r) => r.status === "success" || (Number(r.http_status || 0) >= 200 && Number(r.http_status || 0) < 300)).length;
    const whRunsFail = webhookRuns.filter((r) => r.status === "failed" || r.status === "error").length;
    const whSourceMap = new Map<string, number>();
    for (const r of webhookRuns) { const k = r.source || "—"; whSourceMap.set(k, (whSourceMap.get(k) ?? 0) + 1); }
    const topWhSources = Array.from(whSourceMap, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    return {
      days: data.days,
      notifications: { total: notifs.length, read: notifsRead, unread: notifs.length - notifsRead, topTypes },
      preferences: { total: prefs.length, enabled: prefsEnabled, channelPrefs },
      attempts: { total: attempts.length, ok: attemptOk, fail: attemptFail, retries: attemptRetries, byChannel: channelAttempts },
      retention: { runs: retention.length, totalDeleted: retentionRows },
      templates: { total: templates.length, active: tplActive },
      email: { total: emailLog.length, sent: emailSent, bounced: emailBounced, suppressed: suppressed.length, stateRows: emailState.length, topTemplates: topEmailTpls },
      whatsapp: { total: waEvts.length, delivered: waDelivered, failed: waFailed, topEvents: topWaEvts },
      webhooks: { runs: webhookRuns.length, ok: whRunsOk, fail: whRunsFail, topSources: topWhSources },
    };
  });
