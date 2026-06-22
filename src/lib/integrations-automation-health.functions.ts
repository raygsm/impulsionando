import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Webhooks, Integrations & Automation Cockpit — Fase 77.
 * Webhooks (genérico + Mercado Pago), integrações cadastradas, logs,
 * runs de N8N, eventos WhatsApp e eventos de catálogo/runtime.
 */
export const getIntegrationsAutomationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [intRes, intLogRes, whRunRes, whEvtRes, mpWhRes, mpagoWhRes, n8nRes, waRes, runRes] = await Promise.all([
      supabaseAdmin.from("core_integrations").select("id, slug, environment, status, is_active, last_test_at, last_error").limit(2000),
      supabaseAdmin.from("core_integration_logs").select("id, integration_slug, event_type, status, duration_ms, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_runs").select("id, workflow, event, status, response_status, attempts, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_event_log").select("id, source, target_kind, status, replay_count, processed_at").gte("processed_at", sinceIso).limit(50000),
      supabaseAdmin.from("mp_webhook_log").select("id, topic, processed, error, received_at").gte("received_at", sinceIso).limit(50000),
      supabaseAdmin.from("mpago_webhook_events").select("id, event_type, signature_valid, processed, processing_error, received_at").gte("received_at", sinceIso).limit(50000),
      supabaseAdmin.from("n8n_workflow_runs").select("id, workflow_name, regua, status, channel, http_status, latency_ms, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("whatsapp_message_events").select("id, status, error_code, received_at").gte("received_at", sinceIso).limit(50000),
      supabaseAdmin.from("runtime_events").select("id, level, scope, occurred_at").gte("occurred_at", sinceIso).limit(50000),
    ]);

    const err = intRes.error || intLogRes.error || whRunRes.error || whEvtRes.error || mpWhRes.error || mpagoWhRes.error || n8nRes.error || waRes.error || runRes.error;
    if (err) throw new Error(err.message);

    const integrations = intRes.data ?? [];
    const intLogs = intLogRes.data ?? [];
    const whRuns = whRunRes.data ?? [];
    const whEvents = whEvtRes.data ?? [];
    const mpWh = mpWhRes.data ?? [];
    const mpagoWh = mpagoWhRes.data ?? [];
    const n8n = n8nRes.data ?? [];
    const wa = waRes.data ?? [];
    const runtime = runRes.data ?? [];

    // Integrations
    const intActive = integrations.filter((i) => i.is_active).length;
    const intWithError = integrations.filter((i) => i.last_error).length;
    const envMap = new Map<string, number>();
    for (const i of integrations) { const k = i.environment || "—"; envMap.set(k, (envMap.get(k) ?? 0) + 1); }
    const envBreakdown = Array.from(envMap, ([env, count]) => ({ env, count })).sort((a, b) => b.count - a.count);

    // Integration logs
    const intLogSuccess = intLogs.filter((l) => l.status === "success" || l.status === "ok").length;
    const intLogFailed = intLogs.filter((l) => l.status === "failed" || l.status === "error").length;
    const intLogAvgMs = intLogs.length ? intLogs.reduce((s, l) => s + Number(l.duration_ms || 0), 0) / intLogs.length : 0;
    const intSlugMap = new Map<string, { total: number; failed: number }>();
    for (const l of intLogs) {
      const k = l.integration_slug || "—";
      const cur = intSlugMap.get(k) ?? { total: 0, failed: 0 };
      cur.total++;
      if (l.status === "failed" || l.status === "error") cur.failed++;
      intSlugMap.set(k, cur);
    }
    const topIntegrations = Array.from(intSlugMap, ([slug, v]) => ({ slug, ...v })).sort((a, b) => b.total - a.total).slice(0, 12);

    // Webhook runs
    const whSuccess = whRuns.filter((w) => w.status === "success" || w.status === "completed" || (w.response_status && w.response_status < 400)).length;
    const whFailed = whRuns.filter((w) => w.status === "failed" || w.status === "error" || (w.response_status && w.response_status >= 400)).length;
    const whRetried = whRuns.filter((w) => Number(w.attempts || 0) > 1).length;
    const whWorkflowMap = new Map<string, { total: number; failed: number }>();
    for (const w of whRuns) {
      const k = w.workflow || "—";
      const cur = whWorkflowMap.get(k) ?? { total: 0, failed: 0 };
      cur.total++;
      if (w.status === "failed" || w.status === "error") cur.failed++;
      whWorkflowMap.set(k, cur);
    }
    const topWorkflows = Array.from(whWorkflowMap, ([workflow, v]) => ({ workflow, ...v })).sort((a, b) => b.total - a.total).slice(0, 10);

    // Webhook event log
    const whEvtProcessed = whEvents.filter((e) => e.status === "processed" || e.status === "completed").length;
    const whEvtReplayed = whEvents.filter((e) => Number(e.replay_count || 0) > 0).length;
    const sourceMap = new Map<string, number>();
    for (const e of whEvents) { const k = e.source || "—"; sourceMap.set(k, (sourceMap.get(k) ?? 0) + 1); }
    const sources = Array.from(sourceMap, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // Mercado Pago webhooks (legacy mp_webhook_log + mpago_webhook_events)
    const mpProcessed = mpWh.filter((m) => m.processed).length;
    const mpErrors = mpWh.filter((m) => m.error).length;
    const mpagoProcessed = mpagoWh.filter((m) => m.processed).length;
    const mpagoBadSig = mpagoWh.filter((m) => m.signature_valid === false).length;
    const mpagoErrors = mpagoWh.filter((m) => m.processing_error).length;
    const mpagoTypeMap = new Map<string, number>();
    for (const m of mpagoWh) { const k = m.event_type || "—"; mpagoTypeMap.set(k, (mpagoTypeMap.get(k) ?? 0) + 1); }
    const mpagoTypes = Array.from(mpagoTypeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // N8N
    const n8nSuccess = n8n.filter((r) => r.status === "success" || r.status === "completed" || (r.http_status && r.http_status < 400)).length;
    const n8nFailed = n8n.filter((r) => r.status === "failed" || r.status === "error" || (r.http_status && r.http_status >= 400)).length;
    const n8nAvgLatency = n8n.length ? n8n.reduce((s, r) => s + Number(r.latency_ms || 0), 0) / n8n.length : 0;
    const reguaMap = new Map<string, { total: number; failed: number }>();
    for (const r of n8n) {
      const k = r.regua || "—";
      const cur = reguaMap.get(k) ?? { total: 0, failed: 0 };
      cur.total++;
      if (r.status === "failed" || r.status === "error") cur.failed++;
      reguaMap.set(k, cur);
    }
    const topReguas = Array.from(reguaMap, ([regua, v]) => ({ regua, ...v })).sort((a, b) => b.total - a.total).slice(0, 12);
    const channelMap = new Map<string, number>();
    for (const r of n8n) {
      const ch = r.channel;
      const list = Array.isArray(ch) ? ch : ch ? [ch] : ["—"];
      for (const c of list) {
        const k = String(c);
        channelMap.set(k, (channelMap.get(k) ?? 0) + 1);
      }
    }
    const channels = Array.from(channelMap, ([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count);

    // WhatsApp events
    const waStatusMap = new Map<string, number>();
    for (const w of wa) { const k = w.status || "—"; waStatusMap.set(k, (waStatusMap.get(k) ?? 0) + 1); }
    const waStatuses = Array.from(waStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const waErrors = wa.filter((w) => w.error_code).length;

    // Runtime events
    const rtLevelMap = new Map<string, number>();
    for (const r of runtime) { const k = r.level || "info"; rtLevelMap.set(k, (rtLevelMap.get(k) ?? 0) + 1); }
    const rtLevels = Array.from(rtLevelMap, ([level, count]) => ({ level, count })).sort((a, b) => b.count - a.count);
    const rtErrors = runtime.filter((r) => r.level === "error" || r.level === "fatal").length;

    return {
      window: { days: data.days },
      integrations: {
        total: integrations.length,
        active: intActive,
        withError: intWithError,
        environments: envBreakdown,
      },
      integrationLogs: {
        total: intLogs.length,
        success: intLogSuccess,
        failed: intLogFailed,
        avgMs: intLogAvgMs,
        topIntegrations,
      },
      webhooks: {
        runs: whRuns.length,
        success: whSuccess,
        failed: whFailed,
        retried: whRetried,
        topWorkflows,
        events: whEvents.length,
        eventsProcessed: whEvtProcessed,
        eventsReplayed: whEvtReplayed,
        sources,
      },
      mercadoPago: {
        legacyTotal: mpWh.length,
        legacyProcessed: mpProcessed,
        legacyErrors: mpErrors,
        total: mpagoWh.length,
        processed: mpagoProcessed,
        invalidSignatures: mpagoBadSig,
        errors: mpagoErrors,
        eventTypes: mpagoTypes,
      },
      n8n: {
        runs: n8n.length,
        success: n8nSuccess,
        failed: n8nFailed,
        avgLatencyMs: n8nAvgLatency,
        topReguas,
        channels,
      },
      whatsapp: {
        events: wa.length,
        errors: waErrors,
        statuses: waStatuses,
      },
      runtime: {
        events: runtime.length,
        errors: rtErrors,
        levels: rtLevels,
      },
      generatedAt: new Date().toISOString(),
    };
  });
