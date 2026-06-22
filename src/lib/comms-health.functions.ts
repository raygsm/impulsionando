import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Comunicação & Mensageria — Fase 101.
 * Consolida message_outbox, message_templates, notification_attempt_log,
 * notifications, whatsapp_message_events, email_send_log, suppressed_emails,
 * webhook_runs, webhook_event_log.
 */
export const getCommsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [moRes, mtRes, nalRes, nRes, wmeRes, eslRes, seRes, wrRes, welRes] = await Promise.all([
      supabaseAdmin.from("message_outbox").select("id, channel, status, attempts, event_code, scheduled_at, sent_at, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("message_templates").select("id, channel, event_code, is_active").limit(50000),
      supabaseAdmin.from("notification_attempt_log").select("id, channel, status, event, reason, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("notifications").select("id, category, severity, is_read, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("whatsapp_message_events").select("id, status, error_code, momment, received_at").gte("received_at", sinceIso).limit(300000),
      supabaseAdmin.from("email_send_log").select("id, template_name, status, recipient_email, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("suppressed_emails").select("id, reason, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("webhook_runs").select("id, workflow, event, status, attempts, response_status, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("webhook_event_log").select("id, source, status, processed_at").limit(200000),
    ]);

    const err = moRes.error || mtRes.error || nalRes.error || nRes.error || wmeRes.error || eslRes.error || seRes.error || wrRes.error || welRes.error;
    if (err) throw new Error(err.message);

    const mo = moRes.data ?? [];
    const mt = mtRes.data ?? [];
    const nal = nalRes.data ?? [];
    const nn = nRes.data ?? [];
    const wme = wmeRes.data ?? [];
    const esl = eslRes.data ?? [];
    const se = seRes.data ?? [];
    const wr = wrRes.data ?? [];
    const wel = welRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Outbox
    const moSent = mo.filter((x: any) => x.sent_at || String(x.status) === "sent").length;
    const moFailed = mo.filter((x: any) => String(x.status) === "failed").length;
    const moPending = mo.filter((x: any) => ["pending","queued","scheduled","retry"].includes(String(x.status))).length;
    const moDeliveryRate = mo.length ? (moSent / mo.length) * 100 : 0;
    const moByChannel = countBy(mo, (x: any) => x.channel);
    const moByStatus = countBy(mo, (x: any) => x.status);
    const moByEvent = countBy(mo, (x: any) => x.event_code).slice(0, 15);

    // Templates
    const mtActive = mt.filter((x: any) => x.is_active).length;
    const mtByChannel = countBy(mt, (x: any) => x.channel);

    // Notification attempts
    const nalSuccess = nal.filter((x: any) => ["sent","delivered","ok","success"].includes(String(x.status))).length;
    const nalFailed = nal.filter((x: any) => ["failed","error","bounced"].includes(String(x.status))).length;
    const nalSuccessRate = nal.length ? (nalSuccess / nal.length) * 100 : 0;
    const nalByChannel = countBy(nal, (x: any) => x.channel);
    const nalByStatus = countBy(nal, (x: any) => x.status);
    const nalByReason = countBy(nal.filter((x: any) => x.reason), (x: any) => x.reason).slice(0, 15);

    // In-app notifications
    const nRead = nn.filter((x: any) => x.is_read).length;
    const nReadRate = nn.length ? (nRead / nn.length) * 100 : 0;
    const nByCategory = countBy(nn, (x: any) => x.category);
    const nBySeverity = countBy(nn, (x: any) => x.severity);

    // WhatsApp
    const wmeDelivered = wme.filter((x: any) => ["delivered","read","sent"].includes(String(x.status))).length;
    const wmeFailed = wme.filter((x: any) => ["failed","error","undelivered"].includes(String(x.status))).length;
    const wmeRate = wme.length ? (wmeDelivered / wme.length) * 100 : 0;
    const wmeByStatus = countBy(wme, (x: any) => x.status);
    const wmeByError = countBy(wme.filter((x: any) => x.error_code), (x: any) => x.error_code).slice(0, 15);

    // Email
    const eslSent = esl.filter((x: any) => ["sent","delivered","ok"].includes(String(x.status))).length;
    const eslFailed = esl.filter((x: any) => ["failed","error","bounced"].includes(String(x.status))).length;
    const eslRate = esl.length ? (eslSent / esl.length) * 100 : 0;
    const eslByStatus = countBy(esl, (x: any) => x.status);
    const eslByTemplate = countBy(esl, (x: any) => x.template_name).slice(0, 15);

    // Suppressed
    const seByReason = countBy(se, (x: any) => x.reason);

    // Webhooks
    const wrOk = wr.filter((x: any) => ["ok","success","delivered"].includes(String(x.status)) || (x.response_status >= 200 && x.response_status < 300)).length;
    const wrFailed = wr.filter((x: any) => ["failed","error"].includes(String(x.status)) || (x.response_status && (x.response_status >= 400))).length;
    const wrRate = wr.length ? (wrOk / wr.length) * 100 : 0;
    const wrByStatus = countBy(wr, (x: any) => x.status);
    const wrByWorkflow = countBy(wr, (x: any) => x.workflow).slice(0, 15);

    // Webhook inbound
    const welProcessed = wel.filter((x: any) => x.processed_at).length;
    const welBySource = countBy(wel, (x: any) => x.source).slice(0, 15);
    const welByStatus = countBy(wel, (x: any) => x.status);

    return {
      windowDays: data.days,
      outbox: { total: mo.length, sent: moSent, failed: moFailed, pending: moPending, deliveryRate: moDeliveryRate, byChannel: moByChannel, byStatus: moByStatus, byEvent: moByEvent },
      templates: { total: mt.length, active: mtActive, byChannel: mtByChannel },
      notifAttempts: { total: nal.length, success: nalSuccess, failed: nalFailed, successRate: nalSuccessRate, byChannel: nalByChannel, byStatus: nalByStatus, byReason: nalByReason },
      notifications: { total: nn.length, read: nRead, readRate: nReadRate, byCategory: nByCategory, bySeverity: nBySeverity },
      whatsapp: { total: wme.length, delivered: wmeDelivered, failed: wmeFailed, deliveryRate: wmeRate, byStatus: wmeByStatus, byError: wmeByError },
      email: { total: esl.length, sent: eslSent, failed: eslFailed, sentRate: eslRate, byStatus: eslByStatus, byTemplate: eslByTemplate },
      suppressed: { total: se.length, byReason: seByReason },
      webhooksOut: { total: wr.length, ok: wrOk, failed: wrFailed, okRate: wrRate, byStatus: wrByStatus, byWorkflow: wrByWorkflow },
      webhooksIn: { total: wel.length, processed: welProcessed, bySource: welBySource, byStatus: welByStatus },
    };
  });
