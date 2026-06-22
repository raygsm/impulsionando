import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marketing & Outbox Cockpit — Fase 56.
 * Leads de marketing (UTM), templates, outbox por canal, supressões e eventos WhatsApp.
 */
export const getMarketingHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [leadsRes, tplRes, outRes, emailRes, supRes, wppRes] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("id, source, status, utm_source, utm_medium, utm_campaign, recommended_plan, assigned_to, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("message_templates").select("id, event_code, channel, locale, is_active").limit(5000),
      supabaseAdmin.from("message_outbox").select("id, event_code, channel, status, attempts, scheduled_at, sent_at, last_error, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("email_send_log").select("id, template_name, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("suppressed_emails").select("id, reason, created_at").limit(20000),
      supabaseAdmin.from("whatsapp_message_events").select("id, status, error_code, received_at").gte("received_at", sinceIso).limit(50000),
    ]);

    const err = leadsRes.error || tplRes.error || outRes.error || emailRes.error || supRes.error || wppRes.error;
    if (err) throw new Error(err.message);

    const leads = leadsRes.data ?? [];
    const templates = tplRes.data ?? [];
    const outbox = outRes.data ?? [];
    const emails = emailRes.data ?? [];
    const suppressed = supRes.data ?? [];
    const wppEvents = wppRes.data ?? [];

    const assigned = leads.filter((l) => !!l.assigned_to).length;

    const utmMap = new Map<string, number>();
    for (const l of leads) {
      const k = `${l.utm_source || "direct"} · ${l.utm_medium || "—"}`;
      utmMap.set(k, (utmMap.get(k) ?? 0) + 1);
    }
    const topUtm = Array.from(utmMap, ([utm, count]) => ({ utm, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const campMap = new Map<string, number>();
    for (const l of leads) { if (l.utm_campaign) campMap.set(l.utm_campaign, (campMap.get(l.utm_campaign) ?? 0) + 1); }
    const topCampaigns = Array.from(campMap, ([campaign, count]) => ({ campaign, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const sourceMap = new Map<string, number>();
    for (const l of leads) { const k = l.source || "—"; sourceMap.set(k, (sourceMap.get(k) ?? 0) + 1); }
    const sources = Array.from(sourceMap, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

    // Outbox per channel
    const chanMap = new Map<string, { total: number; sent: number; failed: number; pending: number }>();
    for (const o of outbox) {
      const k = o.channel || "—";
      const cur = chanMap.get(k) ?? { total: 0, sent: 0, failed: 0, pending: 0 };
      cur.total++;
      if (o.sent_at || o.status === "sent" || o.status === "delivered") cur.sent++;
      else if (o.status === "failed" || o.status === "error") cur.failed++;
      else cur.pending++;
      chanMap.set(k, cur);
    }
    const channels = Array.from(chanMap, ([channel, v]) => ({ channel, ...v, deliveryRate: v.total ? (v.sent / v.total) * 100 : 0 })).sort((a, b) => b.total - a.total);

    const eventMap = new Map<string, number>();
    for (const o of outbox) { const k = o.event_code || "—"; eventMap.set(k, (eventMap.get(k) ?? 0) + 1); }
    const topEvents = Array.from(eventMap, ([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const wppSent = wppEvents.filter((w) => w.status === "sent" || w.status === "delivered" || w.status === "read").length;
    const wppFailed = wppEvents.filter((w) => w.status === "failed" || w.error_code).length;
    const wppRead = wppEvents.filter((w) => w.status === "read").length;

    const emailSent = emails.filter((e) => e.status === "sent" || e.status === "delivered").length;
    const emailFailed = emails.filter((e) => e.status === "failed" || e.status === "bounced").length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      leads: { total: leads.length, assigned, unassigned: leads.length - assigned, topUtm, topCampaigns, sources },
      templates: { total: templates.length, active: templates.filter((t) => t.is_active).length },
      outbox: { total: outbox.length, channels, topEvents },
      email: { total: emails.length, sent: emailSent, failed: emailFailed, suppressed: suppressed.length },
      whatsapp: { total: wppEvents.length, sent: wppSent, failed: wppFailed, read: wppRead },
    };
  });
