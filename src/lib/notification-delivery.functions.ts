import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Notification Delivery Health — Fase 38.
 * Saúde da entrega multi-canal (e-mail, WhatsApp, push/in-app).
 */
export const getNotificationDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(1, Math.min(90, d?.days ?? 7)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const stuckIso = new Date(Date.now() - 30 * 60000).toISOString(); // 30min

    const [outboxRes, emailLogsRes, attemptsRes, waEventsRes, suppressedRes, fallbackRes] = await Promise.all([
      supabaseAdmin
        .from("message_outbox")
        .select("id, channel, status, attempts, max_attempts, event_code, scheduled_at, sent_at, last_error, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("email_send_log")
        .select("message_id, template_name, status, error_message, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(20000),
      supabaseAdmin
        .from("notification_attempt_log")
        .select("channel, event, status, reason, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("whatsapp_message_events")
        .select("status, error_code, error_message, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("suppressed_emails")
        .select("email, reason, created_at")
        .gte("created_at", sinceIso)
        .limit(5000),
      supabaseAdmin
        .from("core_whatsapp_fallback_config")
        .select("scope, niche_slug, is_active, updated_at")
        .limit(200),
    ]);

    const outbox = outboxRes.data ?? [];
    const emailRows = emailLogsRes.data ?? [];
    const attempts = attemptsRes.data ?? [];
    const waEvents = waEventsRes.data ?? [];
    const suppressed = suppressedRes.data ?? [];
    const fallbacks = fallbackRes.data ?? [];

    // ---- Outbox por canal ----
    const channels = ["email", "whatsapp", "push", "sms"] as const;
    const outboxByChannel = channels.map((ch) => {
      const rows = outbox.filter((r) => (r.channel ?? "").toLowerCase() === ch);
      const sent = rows.filter((r) => r.status === "sent").length;
      const failed = rows.filter((r) => r.status === "failed" || r.status === "dlq").length;
      const pending = rows.filter((r) => r.status === "pending" || r.status === "queued").length;
      const total = rows.length;
      const deliveryRate = total ? (sent / total) * 100 : 0;
      const stuck = rows.filter(
        (r) => (r.status === "pending" || r.status === "queued") && r.created_at < stuckIso,
      ).length;
      return { channel: ch, total, sent, failed, pending, stuck, deliveryRate };
    });

    // ---- E-mail (dedup por message_id) ----
    const emailLatest = new Map<string, (typeof emailRows)[number]>();
    for (const r of emailRows) {
      if (!r.message_id) continue;
      if (!emailLatest.has(r.message_id)) emailLatest.set(r.message_id, r);
    }
    const emailDedup = Array.from(emailLatest.values());
    const emailStatus = emailDedup.reduce<Record<string, number>>((acc, r) => {
      const s = r.status ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    const emailSent = (emailStatus.sent ?? 0);
    const emailFailed = (emailStatus.dlq ?? 0) + (emailStatus.failed ?? 0) + (emailStatus.bounced ?? 0);
    const emailSuppressed = (emailStatus.suppressed ?? 0);
    const emailTotal = emailDedup.length;
    const emailDelivery = emailTotal ? (emailSent / emailTotal) * 100 : 0;

    // ---- Top templates e top erros e-mail ----
    const tplCount = new Map<string, { sent: number; failed: number }>();
    for (const r of emailDedup) {
      const t = r.template_name ?? "—";
      const cur = tplCount.get(t) ?? { sent: 0, failed: 0 };
      if (r.status === "sent") cur.sent++;
      else if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") cur.failed++;
      tplCount.set(t, cur);
    }
    const topTemplates = Array.from(tplCount.entries())
      .map(([template, v]) => ({ template, ...v, total: v.sent + v.failed }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const errCount = new Map<string, number>();
    for (const r of emailDedup) {
      if (!r.error_message) continue;
      const k = r.error_message.slice(0, 120);
      errCount.set(k, (errCount.get(k) ?? 0) + 1);
    }
    const topEmailErrors = Array.from(errCount.entries())
      .map(([msg, count]) => ({ msg, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ---- WhatsApp ----
    const waStatus = waEvents.reduce<Record<string, number>>((acc, r) => {
      const s = r.status ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    const waDelivered = (waStatus.delivered ?? 0) + (waStatus.read ?? 0);
    const waFailed = (waStatus.failed ?? 0) + (waStatus.error ?? 0);
    const waTotal = waEvents.length;
    const waDelivery = waTotal ? (waDelivered / waTotal) * 100 : 0;

    const waErr = new Map<string, number>();
    for (const r of waEvents) {
      if (!r.error_message && !r.error_code) continue;
      const k = `${r.error_code ?? "?"} · ${(r.error_message ?? "").slice(0, 100)}`;
      waErr.set(k, (waErr.get(k) ?? 0) + 1);
    }
    const topWaErrors = Array.from(waErr.entries())
      .map(([msg, count]) => ({ msg, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ---- Attempts breakdown ----
    const attemptsByChannel = attempts.reduce<Record<string, { ok: number; fail: number }>>((acc, r) => {
      const ch = r.channel ?? "—";
      const cur = acc[ch] ?? { ok: 0, fail: 0 };
      if (r.status === "sent" || r.status === "delivered" || r.status === "ok") cur.ok++;
      else cur.fail++;
      acc[ch] = cur;
      return acc;
    }, {});

    // ---- Suppressed reasons ----
    const suppReason = suppressed.reduce<Record<string, number>>((acc, r) => {
      const k = r.reason ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

    return {
      windowDays: data.days,
      outboxByChannel,
      email: {
        total: emailTotal,
        sent: emailSent,
        failed: emailFailed,
        suppressed: emailSuppressed,
        deliveryRate: emailDelivery,
        statusBreakdown: emailStatus,
        topTemplates,
        topErrors: topEmailErrors,
      },
      whatsapp: {
        total: waTotal,
        delivered: waDelivered,
        failed: waFailed,
        deliveryRate: waDelivery,
        statusBreakdown: waStatus,
        topErrors: topWaErrors,
        fallbacksActive: fallbacks.filter((f) => f.is_active).length,
        fallbacksTotal: fallbacks.length,
      },
      attempts: {
        total: attempts.length,
        byChannel: attemptsByChannel,
      },
      suppressedReasons: suppReason,
      suppressedTotal: suppressed.length,
    };
  });
