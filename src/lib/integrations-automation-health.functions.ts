import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Saúde operacional de integrações e automações.
 * Consulta apenas contratos presentes no schema de produção. Uma fonte sem
 * eventos retorna zero; ela não derruba o cockpit e nunca gera telemetria falsa.
 */
export const getIntegrationsAutomationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (staffError || !staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [runsRes, registryRes, endpointsRes, providerRes, mpagoRes, waRes] = await Promise.all([
      supabaseAdmin
        .from("communication_workflow_runs" as never)
        .select("id,registry_id,status,started_at,finished_at,error,created_at" as never)
        .gte("created_at" as never, sinceIso)
        .order("created_at" as never, { ascending: false })
        .limit(50000),
      supabaseAdmin
        .from("n8n_workflow_registry" as never)
        .select("id,workflow_slug,category,status,n8n_workflow_id" as never)
        .like("workflow_slug" as never, "impulsionando.%")
        .limit(2000),
      supabaseAdmin
        .from("communication_channel_endpoints" as never)
        .select("id,tenant_id,channel,provider,address,display_address,status,last_healthcheck_at,last_error" as never)
        .limit(2000),
      supabaseAdmin
        .from("communication_provider_accounts" as never)
        .select("id,tenant_id,provider,secret_reference,active" as never)
        .limit(2000),
      supabaseAdmin
        .from("mpago_webhook_events" as never)
        .select("id,event_type,signature_valid,processed,processing_error,received_at" as never)
        .gte("received_at" as never, sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("whatsapp_message_events" as never)
        .select("id,status,error_code,created_at" as never)
        .gte("created_at" as never, sinceIso)
        .limit(50000),
    ]);

    const firstError = runsRes.error || registryRes.error || endpointsRes.error || providerRes.error || mpagoRes.error || waRes.error;
    if (firstError) throw new Error(firstError.message);

    const runs = (runsRes.data ?? []) as any[];
    const registry = (registryRes.data ?? []) as any[];
    const endpoints = (endpointsRes.data ?? []) as any[];
    const providers = (providerRes.data ?? []) as any[];
    const mpago = (mpagoRes.data ?? []) as any[];
    const wa = (waRes.data ?? []) as any[];

    const registryById = new Map<string, any>(registry.map((r) => [r.id, r]));
    const n8nSuccess = runs.filter((r) => r.status === "SUCCEEDED").length;
    const n8nFailed = runs.filter((r) => r.status === "FAILED").length;
    const reguaMap = new Map<string, { total: number; failed: number }>();
    const workflowMap = new Map<string, { total: number; failed: number }>();
    for (const run of runs) {
      const reg = run.registry_id ? registryById.get(run.registry_id) : null;
      const category = reg?.category ?? "automacao-moderna";
      const workflow = reg?.workflow_slug ?? "automacao-moderna";
      const bucket = reguaMap.get(category) ?? { total: 0, failed: 0 };
      bucket.total++;
      if (run.status === "FAILED") bucket.failed++;
      reguaMap.set(category, bucket);
      const wfBucket = workflowMap.get(workflow) ?? { total: 0, failed: 0 };
      wfBucket.total++;
      if (run.status === "FAILED") wfBucket.failed++;
      workflowMap.set(workflow, wfBucket);
    }
    const topReguas = Array.from(reguaMap, ([regua, value]) => ({ regua, ...value })).sort((a, b) => b.total - a.total).slice(0, 12);
    const topWorkflows = Array.from(workflowMap, ([workflow, value]) => ({ workflow, ...value })).sort((a, b) => b.total - a.total).slice(0, 10);

    const providerKey = new Set(providers.filter((p) => p.active).map((p) => `${p.tenant_id}:${p.provider}`));
    const integrationItems = endpoints.map((endpoint) => {
      const providerConfigured = endpoint.provider === "unbound" || providerKey.has(`${endpoint.tenant_id}:${endpoint.provider}`);
      const runtimeStatus = endpoint.status ?? "PENDING_CONNECTION";
      const active = runtimeStatus === "ACTIVE" && providerConfigured;
      return {
        id: endpoint.id,
        slug: `${endpoint.channel}:${endpoint.display_address || endpoint.address || endpoint.provider}`,
        environment: "production",
        status: active ? "connected" : runtimeStatus.toLowerCase(),
        is_active: active,
        last_test_at: endpoint.last_healthcheck_at ?? null,
        last_error: endpoint.last_error ?? (providerConfigured ? null : "Credencial/provedor ainda não conectado"),
      };
    });
    const activeIntegrations = integrationItems.filter((i) => i.is_active).length;
    const integrationErrors = integrationItems.filter((i) => Boolean(i.last_error)).length;

    const mpProcessed = mpago.filter((m) => m.processed).length;
    const mpBadSig = mpago.filter((m) => m.signature_valid === false).length;
    const mpErrors = mpago.filter((m) => Boolean(m.processing_error)).length;
    const mpTypeMap = new Map<string, number>();
    for (const item of mpago) {
      const key = item.event_type || "—";
      mpTypeMap.set(key, (mpTypeMap.get(key) ?? 0) + 1);
    }

    const waStatusMap = new Map<string, number>();
    for (const item of wa) {
      const key = item.status || "—";
      waStatusMap.set(key, (waStatusMap.get(key) ?? 0) + 1);
    }
    const waErrors = wa.filter((w) => Boolean(w.error_code)).length;

    return {
      window: { days: data.days },
      integrationItems,
      integrations: {
        total: integrationItems.length,
        active: activeIntegrations,
        withError: integrationErrors,
        environments: [{ env: "production", count: integrationItems.length }],
      },
      integrationLogs: { total: 0, success: 0, failed: 0, avgMs: 0, topIntegrations: [] as any[] },
      webhooks: {
        runs: runs.length,
        success: n8nSuccess,
        failed: n8nFailed,
        retried: 0,
        topWorkflows,
        events: mpago.length + wa.length,
        eventsProcessed: mpProcessed,
        eventsReplayed: 0,
        sources: [
          { source: "mercado-pago", count: mpago.length },
          { source: "whatsapp", count: wa.length },
        ].filter((x) => x.count > 0),
      },
      mercadoPago: {
        legacyTotal: 0,
        legacyProcessed: 0,
        legacyErrors: 0,
        total: mpago.length,
        processed: mpProcessed,
        invalidSignatures: mpBadSig,
        errors: mpErrors,
        eventTypes: Array.from(mpTypeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      },
      n8n: {
        registered: registry.length,
        active: registry.filter((r) => r.status === "ACTIVE").length,
        runs: runs.length,
        success: n8nSuccess,
        failed: n8nFailed,
        avgLatencyMs: 0,
        topReguas,
        channels: [] as Array<{ channel: string; count: number }>,
      },
      whatsapp: {
        events: wa.length,
        errors: waErrors,
        statuses: Array.from(waStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      runtime: {
        events: runs.length,
        errors: n8nFailed,
        levels: [
          { level: "success", count: n8nSuccess },
          { level: "error", count: n8nFailed },
          { level: "running", count: runs.filter((r) => r.status === "RUNNING" || r.status === "PENDING").length },
        ].filter((x) => x.count > 0),
      },
      generatedAt: new Date().toISOString(),
    };
  });
