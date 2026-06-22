import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Comunicação Omnichannel Health — Fase 45.
 * Saúde da entrega multicanal (WhatsApp / Email / SMS / Push) usando outbox,
 * eventos do WhatsApp, log de e-mails e lista de supressão.
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
    const staleIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

    const [outboxRes, waRes, emailRes, suppRes, tmplRes, companiesRes] = await Promise.all([
      supabaseAdmin
        .from("message_outbox")
        .select("id, company_id, event_code, channel, status, attempts, max_attempts, scheduled_at, sent_at, last_error, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("whatsapp_message_events")
        .select("id, outbox_id, status, error_code, error_message, instance_id, received_at")
        .gte("received_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("email_send_log")
        .select("id, template_name, status, error_message, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("suppressed_emails")
        .select("id, email, reason, created_at")
        .gte("created_at", sinceIso)
        .limit(5000),
      supabaseAdmin.from("message_templates").select("id, channel, event_code, is_active").limit(2000),
      supabaseAdmin.from("companies").select("id, name").limit(5000),
    ]);

    const err = outboxRes.error || waRes.error || emailRes.error || suppRes.error;
    if (err) throw new Error(err.message);

    const outbox = outboxRes.data ?? [];
    const wa = waRes.data ?? [];
    const emails = emailRes.data ?? [];
    const supp = suppRes.data ?? [];
    const templates = tmplRes.data ?? [];
    const companyName = new Map((companiesRes.data ?? []).map((c) => [c.id, c.name]));

    const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();
    const SENT = new Set(["sent", "delivered", "entregue", "enviado", "ok", "read", "lida"]);
    const FAILED = new Set(["failed", "error", "erro", "falha", "rejected", "bounced"]);
    const PENDING = new Set(["pending", "queued", "fila", "scheduled", "agendado", "processing"]);

    // ===== Outbox por canal =====
    type ChannelStat = {
      channel: string;
      total: number;
      sent: number;
      failed: number;
      pending: number;
      stalePending: number;
      retriesHigh: number;
      deliveryRate: number;
    };
    const chMap = new Map<string, ChannelStat>();
    for (const o of outbox) {
      const ch = lower(o.channel) || "outros";
      let s = chMap.get(ch);
      if (!s) {
        s = { channel: ch, total: 0, sent: 0, failed: 0, pending: 0, stalePending: 0, retriesHigh: 0, deliveryRate: 0 };
        chMap.set(ch, s);
      }
      s.total++;
      const st = lower(o.status);
      if (SENT.has(st) || o.sent_at) s.sent++;
      else if (FAILED.has(st)) s.failed++;
      else if (PENDING.has(st)) s.pending++;
      if (PENDING.has(st) && o.created_at < staleIso) s.stalePending++;
      if ((o.attempts ?? 0) >= (o.max_attempts ?? 3) && !SENT.has(st) && !o.sent_at) s.retriesHigh++;
    }
    const channels = Array.from(chMap.values())
      .map((c) => ({ ...c, deliveryRate: c.total ? (c.sent / c.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    // ===== Totais globais =====
    const total = outbox.length;
    const sent = outbox.filter((o) => SENT.has(lower(o.status)) || o.sent_at).length;
    const failed = outbox.filter((o) => FAILED.has(lower(o.status))).length;
    const pending = outbox.filter((o) => PENDING.has(lower(o.status))).length;
    const stalePending = outbox.filter((o) => PENDING.has(lower(o.status)) && o.created_at < staleIso).length;
    const retriesHigh = outbox.filter((o) => (o.attempts ?? 0) >= (o.max_attempts ?? 3) && !SENT.has(lower(o.status)) && !o.sent_at).length;
    const deliveryRate = total ? (sent / total) * 100 : 0;

    // Tempo médio scheduled→sent
    const durations = outbox
      .filter((o) => o.sent_at && (o.scheduled_at ?? o.created_at))
      .map((o) => (new Date(o.sent_at!).getTime() - new Date(o.scheduled_at ?? o.created_at).getTime()) / 60000)
      .filter((m) => m >= 0 && m < 60 * 24 * 7);
    const avgDeliveryMinutes = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // ===== WhatsApp =====
    const waTotal = wa.length;
    const waDelivered = wa.filter((e) => ["delivered", "sent", "read"].includes(lower(e.status))).length;
    const waRead = wa.filter((e) => lower(e.status) === "read").length;
    const waFailed = wa.filter((e) => ["failed", "error"].includes(lower(e.status))).length;
    const waReadRate = waDelivered ? (waRead / waDelivered) * 100 : 0;
    const waErrorMap = new Map<string, number>();
    for (const e of wa) {
      if (["failed", "error"].includes(lower(e.status))) {
        const key = (e.error_code ? `${e.error_code} · ` : "") + (e.error_message ?? "sem mensagem").slice(0, 120);
        waErrorMap.set(key, (waErrorMap.get(key) ?? 0) + 1);
      }
    }
    const waTopErrors = Array.from(waErrorMap.entries()).map(([message, count]) => ({ message, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // ===== Email =====
    const emTotal = emails.length;
    const emSent = emails.filter((e) => SENT.has(lower(e.status))).length;
    const emFailed = emails.filter((e) => FAILED.has(lower(e.status))).length;
    const emDeliveryRate = emTotal ? (emSent / emTotal) * 100 : 0;
    const emTplMap = new Map<string, { total: number; sent: number; failed: number }>();
    for (const e of emails) {
      const k = e.template_name ?? "sem-template";
      const v = emTplMap.get(k) ?? { total: 0, sent: 0, failed: 0 };
      v.total++;
      if (SENT.has(lower(e.status))) v.sent++;
      else if (FAILED.has(lower(e.status))) v.failed++;
      emTplMap.set(k, v);
    }
    const emailByTemplate = Array.from(emTplMap.entries()).map(([template, v]) => ({ template, ...v, rate: v.total ? (v.sent / v.total) * 100 : 0 })).sort((a, b) => b.total - a.total).slice(0, 15);

    // ===== Supressão =====
    const suppByReason = new Map<string, number>();
    for (const s of supp) {
      const r = s.reason ?? "outros";
      suppByReason.set(r, (suppByReason.get(r) ?? 0) + 1);
    }
    const suppressionBreakdown = Array.from(suppByReason.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

    // ===== Por tenant =====
    type TenantRow = {
      companyId: string;
      name: string;
      total: number;
      sent: number;
      failed: number;
      pending: number;
      deliveryRate: number;
    };
    const tMap = new Map<string, TenantRow>();
    for (const o of outbox) {
      if (!o.company_id) continue;
      let t = tMap.get(o.company_id);
      if (!t) {
        t = { companyId: o.company_id, name: companyName.get(o.company_id) ?? o.company_id.slice(0, 8), total: 0, sent: 0, failed: 0, pending: 0, deliveryRate: 0 };
        tMap.set(o.company_id, t);
      }
      t.total++;
      const st = lower(o.status);
      if (SENT.has(st) || o.sent_at) t.sent++;
      else if (FAILED.has(st)) t.failed++;
      else if (PENDING.has(st)) t.pending++;
    }
    const tenants = Array.from(tMap.values())
      .map((t) => ({ ...t, deliveryRate: t.total ? (t.sent / t.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 25);

    // ===== Templates ativos =====
    const activeTemplates = templates.filter((t) => t.is_active).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      kpis: {
        total,
        sent,
        failed,
        pending,
        stalePending,
        retriesHigh,
        deliveryRate,
        avgDeliveryMinutes,
        waTotal,
        waDelivered,
        waRead,
        waFailed,
        waReadRate,
        emTotal,
        emSent,
        emFailed,
        emDeliveryRate,
        suppressedCount: supp.length,
        templatesActive: activeTemplates,
        templatesTotal: templates.length,
      },
      channels,
      waTopErrors,
      emailByTemplate,
      suppressionBreakdown,
      tenants,
    };
  });
