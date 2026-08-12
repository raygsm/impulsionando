import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Operational automation health using only production-backed sources.
 * No metric below depends on legacy/demo tables.
 */
export const getIntegrationsAutomationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (staffError || !staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("communication_tenants")
      .select("id")
      .eq("slug", "impulsionando")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (tenantError) throw new Error(tenantError.message);
    if (!tenant) throw new Error("Cliente Core Impulsionando não encontrado.");

    const [registryRes, stateRes, n8nRes, mpagoRes, waRes, endpointRes, providerRes] = await Promise.all([
      supabaseAdmin
        .from("n8n_workflow_registry")
        .select("id,workflow_slug,category,n8n_workflow_id,status,config")
        .like("workflow_slug", "impulsionando.%")
        .limit(5000),
      supabaseAdmin
        .from("tenant_workflow_state")
        .select("registry_id,status,last_execution_at,last_error")
        .eq("tenant_id", tenant.id)
        .limit(5000),
      supabaseAdmin
        .from("communication_workflow_runs")
        .select("id,registry_id,automation_id,n8n_execution_id,correlation_id,status,started_at,finished_at,duration_ms,error,created_at")
        .eq("tenant_id", tenant.id)
        .gte("created_at", sinceIso)
        .limit(50_000),
      supabaseAdmin
        .from("mpago_webhook_events")
        .select("id,event_type,signature_valid,processed,processing_error,received_at")
        .gte("received_at", sinceIso)
        .limit(50_000),
      supabaseAdmin
        .from("whatsapp_message_events")
        .select("id,status,error_code,created_at")
        .gte("created_at", sinceIso)
        .limit(50_000),
      supabaseAdmin
        .from("communication_channel_endpoints")
        .select("id,channel,provider,status,last_error,last_healthcheck_at,address,display_address")
        .eq("tenant_id", tenant.id)
        .limit(5000),
      supabaseAdmin
        .from("communication_provider_accounts")
        .select("id,provider,active,config")
        .eq("tenant_id", tenant.id)
        .limit(5000),
    ]);

    const firstError = registryRes.error || stateRes.error || n8nRes.error || mpagoRes.error || waRes.error || endpointRes.error || providerRes.error;
    if (firstError) throw new Error(firstError.message);

    const registry = (registryRes.data ?? []) as any[];
    const states = (stateRes.data ?? []) as any[];
    const n8n = (n8nRes.data ?? []) as any[];
    const mpago = (mpagoRes.data ?? []) as any[];
    const wa = (waRes.data ?? []) as any[];
    const endpoints = (endpointRes.data ?? []) as any[];
    const providers = (providerRes.data ?? []) as any[];

    const stateByRegistry = new Map(states.map((row) => [row.registry_id, row]));
    const registryById = new Map(registry.map((row) => [row.id, row]));

    const activeRegistry = registry.filter((row) => row.status === "ACTIVE" && row.n8n_workflow_id).length;
    const runtimeErrors = states.filter((row) => row.status === "ERROR" || row.last_error).length;
    const registryWithoutId = registry.filter((row) => !row.n8n_workflow_id).length;

    const n8nSuccess = n8n.filter((run) => run.status === "SUCCEEDED").length;
    const n8nFailed = n8n.filter((run) => run.status === "FAILED").length;
    const n8nAvgLatency = n8n.length
      ? n8n.reduce((sum, run) => sum + Number(run.duration_ms || 0), 0) / n8n.length
      : 0;

    const categoryMap = new Map<string, { total: number; failed: number }>();
    for (const run of n8n) {
      const workflow = run.registry_id ? registryById.get(run.registry_id) : null;
      const key = workflow?.category || "automacao";
      const current = categoryMap.get(key) ?? { total: 0, failed: 0 };
      current.total += 1;
      if (run.status === "FAILED") current.failed += 1;
      categoryMap.set(key, current);
    }
    const topReguas = Array.from(categoryMap, ([regua, values]) => ({ regua, ...values }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);

    const channelMap = new Map<string, number>();
    for (const endpoint of endpoints) {
      const key = endpoint.channel || "outro";
      channelMap.set(key, (channelMap.get(key) ?? 0) + 1);
    }
    const channels = Array.from(channelMap, ([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);

    const waStatusMap = new Map<string, number>();
    for (const event of wa) {
      const key = event.status || "UNKNOWN";
      waStatusMap.set(key, (waStatusMap.get(key) ?? 0) + 1);
    }
    const waStatuses = Array.from(waStatusMap, ([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
    const waErrors = wa.filter((event) => event.error_code).length;

    const mpagoProcessed = mpago.filter((event) => event.processed).length;
    const mpagoBadSig = mpago.filter((event) => event.signature_valid === false).length;
    const mpagoErrors = mpago.filter((event) => event.processing_error).length;
    const mpagoTypeMap = new Map<string, number>();
    for (const event of mpago) {
      const key = event.event_type || "—";
      mpagoTypeMap.set(key, (mpagoTypeMap.get(key) ?? 0) + 1);
    }
    const mpagoTypes = Array.from(mpagoTypeMap, ([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const endpointErrors = endpoints.filter((endpoint) => endpoint.last_error || endpoint.status === "ERROR").length;
    const endpointActive = endpoints.filter((endpoint) => endpoint.status === "ACTIVE").length;
    const providerActive = providers.filter((provider) => provider.active).length;
    const pendingEndpoints = endpoints.filter((endpoint) => endpoint.status !== "ACTIVE").map((endpoint) => ({
      id: endpoint.id,
      slug: `${endpoint.channel}:${endpoint.provider}`,
      environment: endpoint.display_address || endpoint.address || "—",
      status: endpoint.status,
      is_active: false,
      last_error: endpoint.last_error ?? null,
    }));

    const topWorkflowMap = new Map<string, { total: number; failed: number }>();
    for (const run of n8n) {
      const workflow = run.registry_id ? registryById.get(run.registry_id) : null;
      const key = workflow?.workflow_slug || "automacao-sem-registry";
      const current = topWorkflowMap.get(key) ?? { total: 0, failed: 0 };
      current.total += 1;
      if (run.status === "FAILED") current.failed += 1;
      topWorkflowMap.set(key, current);
    }
    const topWorkflows = Array.from(topWorkflowMap, ([workflow, values]) => ({ workflow, ...values }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const webhooksReceived = mpago.length + wa.length;
    const webhooksFailed = mpagoErrors + mpagoBadSig + waErrors;

    return {
      window: { days: data.days },
      integrations: {
        total: endpoints.length + providers.length,
        active: endpointActive + providerActive,
        withError: endpointErrors,
        environments: channels.map((item) => ({ env: item.channel, count: item.count })),
        pending: pendingEndpoints,
      },
      integrationLogs: {
        total: n8n.length,
        success: n8nSuccess,
        failed: n8nFailed,
        avgMs: n8nAvgLatency,
        topIntegrations: topWorkflows.map((item) => ({ slug: item.workflow, total: item.total, failed: item.failed })),
      },
      webhooks: {
        runs: n8n.length,
        success: n8nSuccess,
        failed: n8nFailed,
        retried: 0,
        topWorkflows,
        events: webhooksReceived,
        eventsProcessed: mpagoProcessed + Math.max(0, wa.length - waErrors),
        eventsReplayed: 0,
        sources: [
          { source: "mercado_pago", count: mpago.length },
          { source: "whatsapp", count: wa.length },
        ].filter((item) => item.count > 0),
      },
      mercadoPago: {
        legacyTotal: 0,
        legacyProcessed: 0,
        legacyErrors: 0,
        total: mpago.length,
        processed: mpagoProcessed,
        invalidSignatures: mpagoBadSig,
        errors: mpagoErrors,
        eventTypes: mpagoTypes,
      },
      n8n: {
        registry: registry.length,
        activeRegistry,
        registryWithoutId,
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
        events: states.length,
        errors: runtimeErrors,
        levels: [
          { level: "active", count: states.filter((row) => row.status === "ACTIVE").length },
          { level: "ready", count: states.filter((row) => row.status === "READY").length },
          { level: "error", count: runtimeErrors },
        ].filter((item) => item.count > 0),
      },
      generatedAt: new Date().toISOString(),
    };
  });
