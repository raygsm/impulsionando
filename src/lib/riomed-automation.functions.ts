import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function coreContext(supabase: any) {
  const { data, error } = await supabase.from("communication_tenants").select("id,company_id")
    .eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id || !data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return { tenantId: data.id as string, companyId: data.company_id as string };
}
async function rootAgentId(supabase: any) {
  const { data, error } = await supabase.from("communication_agent_runtime").select("agent_id").eq("agent_key", "impulsionito-core").eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.agent_id) throw new Error("Impulsionito master não encontrado");
  return data.agent_id as string;
}
const FUNNEL_STAGES = ["captar", "converter", "relacionar", "reter", "expandir"] as const;

function automationView(row: any) {
  const c = row.config ?? {};
  return {
    id: row.id,
    name: c.name ?? row.automation_key,
    description: c.description ?? "",
    funnel_stage: c.funnel_stage ?? "captar",
    trigger_event: c.trigger_event ?? row.automation_key,
    webhook_url: null,
    is_active: row.status === "ACTIVE",
    priority: Number(c.priority ?? 100),
    conditions: c.conditions ?? {},
    actions: c.actions ?? c.steps ?? [],
    agent_id: c.agent_id ?? null,
    workflow_id: c.workflow_id ?? null,
    n8n_workflow_id: row.n8n_workflow_id ?? null,
    status: row.status,
    kind: c.kind ?? "funnel",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const getAutomationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [automations, runs, agents, conversations] = await Promise.all([
      sb.from("communication_automations").select("*").eq("tenant_id", tenantId),
      sb.from("communication_workflow_runs").select("id,status,automation_id,created_at").eq("tenant_id", tenantId).gte("created_at", since),
      sb.from("communication_agents").select("id,active").eq("tenant_id", tenantId),
      sb.from("communication_conversations").select("id,status,agent_id,created_at").eq("tenant_id", tenantId).gte("created_at", since),
    ]);
    for (const r of [automations, runs, agents, conversations]) if (r.error) throw new Error(r.error.message);
    const views = (automations.data ?? []).map(automationView);
    const workflowViews = views.filter((a: any) => a.kind === "n8n_workflow" || a.n8n_workflow_id);
    const funnelViews = views.filter((a: any) => a.kind !== "n8n_workflow");
    const byStage: Record<string, number> = Object.fromEntries(FUNNEL_STAGES.map(s => [s, 0]));
    funnelViews.forEach((a: any) => { byStage[a.funnel_stage] = (byStage[a.funnel_stage] ?? 0) + 1; });
    const runRows = runs.data ?? [];
    return {
      workflowsTotal: workflowViews.length,
      workflowsActive: workflowViews.filter((w: any) => w.is_active).length,
      agentsTotal: (agents.data ?? []).length,
      agentsActive: (agents.data ?? []).filter((a: any) => a.active).length,
      automationsTotal: funnelViews.length,
      automationsByStage: byStage,
      runs7d: runRows.length,
      runsSuccess7d: runRows.filter((r: any) => ["SUCCESS", "COMPLETED", "SUCCEEDED"].includes(String(r.status).toUpperCase())).length,
      runsError7d: runRows.filter((r: any) => ["ERROR", "FAILED"].includes(String(r.status).toUpperCase())).length,
      aiRuns7d: (conversations.data ?? []).length,
      aiCredits7d: 0,
    };
  });

export const listN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data, error } = await sb.from("communication_automations").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []).map(automationView).filter((w: any) => w.kind === "n8n_workflow" || w.n8n_workflow_id) };
  });

export const upsertN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), name: z.string().min(2).max(120), description: z.string().max(1000).optional(), webhookUrl: z.string().optional(), triggerEvent: z.string().max(120).optional(), funnelStage: z.string().max(40).optional(), isActive: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    if (data.webhookUrl?.trim()) throw new Error("Webhooks arbitrários não podem ser cadastrados. Vincule o workflow pelo registry n8n do Core.");
    const config = { kind: "n8n_workflow", name: data.name, description: data.description ?? "", trigger_event: data.triggerEvent ?? "", funnel_stage: data.funnelStage ?? "captar", requested_active: Boolean(data.isActive) };
    if (data.id) {
      const { data: current, error: readError } = await sb.from("communication_automations").select("id,version,n8n_workflow_id").eq("id", data.id).eq("tenant_id", tenantId).maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!current) throw new Error("Workflow não encontrado");
      const active = Boolean(data.isActive && current.n8n_workflow_id);
      const { data: row, error } = await sb.from("communication_automations").update({ config, version: Number(current.version ?? 1) + 1, status: active ? "ACTIVE" : "DRAFT" }).eq("id", data.id).eq("tenant_id", tenantId).select("*").single();
      if (error) throw new Error(error.message);
      return { item: automationView(row), needsRegistryBinding: Boolean(data.isActive && !current.n8n_workflow_id) };
    }
    const key = `riomed.workflow.${data.name}`.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 180);
    const { data: row, error } = await sb.from("communication_automations").insert({ tenant_id: tenantId, automation_key: key, version: 1, status: "DRAFT", config }).select("*").single();
    if (error) throw new Error(error.message);
    return { item: automationView(row), needsRegistryBinding: Boolean(data.isActive) };
  });

export const triggerN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workflowId: z.string().uuid(), payload: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: wf, error } = await sb.from("communication_automations").select("id,status,n8n_workflow_id").eq("id", data.workflowId).eq("tenant_id", tenantId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!wf) throw new Error("Workflow não encontrado");
    if (wf.status !== "ACTIVE" || !wf.n8n_workflow_id) throw new Error("Workflow ainda não está ativo e vinculado ao registry n8n do Core.");
    throw new Error("Disparo manual direto foi desabilitado nesta tela. Execute pelo orquestrador n8n homologado para preservar autenticação, auditoria e idempotência.");
  });

export const listN8nExecutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: rows, error } = await sb.from("communication_workflow_runs").select("id,automation_id,status,n8n_execution_id,started_at,finished_at,error,created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(Math.min(data.limit ?? 100, 500));
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r: any) => r.automation_id).filter(Boolean))];
    let names = new Map<string, string>();
    if (ids.length) {
      const { data: autos } = await sb.from("communication_automations").select("id,config,automation_key").in("id", ids);
      names = new Map((autos ?? []).map((a: any) => [a.id, a.config?.name ?? a.automation_key]));
    }
    return { items: (rows ?? []).map((r: any) => ({ ...r, duration_ms: r.started_at && r.finished_at ? new Date(r.finished_at).getTime() - new Date(r.started_at).getTime() : null, riomed_n8n_workflows: { name: names.get(r.automation_id) ?? "—" } })) };
  });

export const listAiAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: agents, error } = await sb.from("communication_agents").select("*").eq("tenant_id", tenantId).order("name");
    if (error) throw new Error(error.message);
    const ids = (agents ?? []).map((a: any) => a.id);
    const { data: runtimes } = ids.length ? await sb.from("communication_agent_runtime").select("*").in("agent_id", ids) : { data: [] };
    const byId = new Map((runtimes ?? []).map((r: any) => [r.agent_id, r]));
    return { items: (agents ?? []).map((a: any) => { const r: any = byId.get(a.id) ?? {}; return { id: a.id, agent_key: r.agent_key ?? "", name: a.name, purpose: r.config?.purpose ?? a.role ?? "", funnel_stage: r.config?.funnel_stage ?? "captar", model: r.model_policy?.model ?? "core-managed", system_prompt: r.config?.system_prompt ?? "", is_active: Boolean(a.active && r.active), execution_ready: Boolean(r.config?.execution_ready) }; }) };
  });

export const upsertAiAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), agentKey: z.string().min(2).max(60), name: z.string().min(2).max(120), purpose: z.string().min(2).max(400), funnelStage: z.string().max(40), model: z.string().max(120).optional(), systemPrompt: z.string().min(10).max(8000), isActive: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const root = await rootAgentId(sb);
    const key = data.agentKey.toLowerCase().startsWith("riomed-") ? data.agentKey.toLowerCase() : `riomed-${data.agentKey.toLowerCase()}`;
    let id = data.id;
    if (id) {
      const { data: existing } = await sb.from("communication_agents").select("id").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
      if (!existing) throw new Error("Agente não encontrado");
      const { error } = await sb.from("communication_agents").update({ name: data.name, role: data.purpose, signature: data.name, active: data.isActive ?? true }).eq("id", id).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await sb.from("communication_agents").insert({ tenant_id: tenantId, name: data.name, role: data.purpose, signature: data.name, reply_route: "core_agent_runtime", active: data.isActive ?? true }).select("id").single();
      if (error || !row) throw new Error(error?.message ?? "Falha ao criar agente");
      id = row.id;
    }
    const { error: runtimeError } = await sb.from("communication_agent_runtime").upsert({ agent_id: id, agent_key: key, root_agent_id: root, instance_type: "CLIENT_INSTANCE", system_prompt_ref: `runtime:${key}`, knowledge_scope: "RIO_MED", model_policy: { model: data.model ?? "core-managed", provider: "core-managed" }, privacy_policy: { tenant_isolation: true, pii_minimization: true }, handoff_policy: { human_handoff: true, preserve_context: true }, capabilities: { omnichannel: true, sales: true, support: true }, config: { purpose: data.purpose, funnel_stage: data.funnelStage, system_prompt: data.systemPrompt, execution_ready: false }, active: data.isActive ?? true }, { onConflict: "agent_id" });
    if (runtimeError) throw new Error(runtimeError.message);
    return { item: { id, agent_key: key, name: data.name, purpose: data.purpose, funnel_stage: data.funnelStage, model: data.model ?? "core-managed", system_prompt: data.systemPrompt, is_active: data.isActive ?? true, execution_ready: false } };
  });

export const runAiAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ agentId: z.string().uuid(), input: z.any(), relatedEntityType: z.string().optional(), relatedEntityId: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: agent } = await sb.from("communication_agents").select("id,active").eq("id", data.agentId).eq("tenant_id", tenantId).maybeSingle();
    const { data: runtime } = await sb.from("communication_agent_runtime").select("active,config").eq("agent_id", data.agentId).maybeSingle();
    if (!agent || !runtime || !agent.active || !runtime.active) throw new Error("Agente não encontrado ou inativo");
    if (!runtime.config?.execution_ready) throw new Error("Instância configurada, mas a inferência universal ainda não foi homologada. Nenhuma resposta será simulada.");
    throw new Error("Use um canal omnichannel homologado para executar a instância e preservar o ledger da conversa.");
  });

export const listAiRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: rows, error } = await sb.from("communication_conversations").select("id,agent_id,status,channel,created_at,closed_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(Math.min(data.limit ?? 100, 500));
    if (error) throw new Error(error.message);
    return { items: (rows ?? []).map((r: any) => ({ ...r, tokens_input: null, tokens_output: null, riomed_ai_agents: { name: "Instância Core" } })) };
  });

export const listFunnelAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data, error } = await sb.from("communication_automations").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const items = (data ?? []).map(automationView).filter((a: any) => a.kind === "funnel" || a.kind === "journey");
    return { items: items.map((a: any) => ({ ...a, riomed_ai_agents: { name: a.agent_id ? "Instância Core" : null }, riomed_n8n_workflows: { name: a.workflow_id ? "Workflow Core" : null } })) };
  });

export const upsertFunnelAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), name: z.string().min(2), description: z.string().optional(), funnelStage: z.string(), triggerEvent: z.string().min(2), conditions: z.any().optional(), actions: z.any().optional(), agentId: z.string().uuid().nullable().optional(), workflowId: z.string().uuid().nullable().optional(), isActive: z.boolean().optional(), priority: z.number().int().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    let workflowBound = false;
    if (data.workflowId) {
      const { data: workflow } = await sb.from("communication_automations").select("id,n8n_workflow_id,status").eq("id", data.workflowId).eq("tenant_id", tenantId).maybeSingle();
      workflowBound = Boolean(workflow?.n8n_workflow_id && workflow?.status === "ACTIVE");
    }
    const active = Boolean(data.isActive && (!data.workflowId || workflowBound));
    const config = { kind: "funnel", name: data.name, description: data.description ?? "", funnel_stage: data.funnelStage, trigger_event: data.triggerEvent, conditions: data.conditions ?? {}, actions: data.actions ?? [], agent_id: data.agentId ?? null, workflow_id: data.workflowId ?? null, priority: data.priority ?? 100, requested_active: Boolean(data.isActive) };
    if (data.id) {
      const { data: current } = await sb.from("communication_automations").select("id,version").eq("id", data.id).eq("tenant_id", tenantId).maybeSingle();
      if (!current) throw new Error("Régua não encontrada");
      const { data: row, error } = await sb.from("communication_automations").update({ config, version: Number(current.version ?? 1) + 1, status: active ? "ACTIVE" : "DRAFT" }).eq("id", data.id).eq("tenant_id", tenantId).select("*").single();
      if (error) throw new Error(error.message);
      return { item: automationView(row), needsWorkflowBinding: Boolean(data.isActive && data.workflowId && !workflowBound) };
    }
    const key = `riomed.funnel.${data.funnelStage}.${data.triggerEvent}`.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 180);
    const { data: row, error } = await sb.from("communication_automations").insert({ tenant_id: tenantId, automation_key: key, version: 1, status: active ? "ACTIVE" : "DRAFT", config }).select("*").single();
    if (error) throw new Error(error.message);
    return { item: automationView(row), needsWorkflowBinding: Boolean(data.isActive && data.workflowId && !workflowBound) };
  });

export const listAutomationRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await coreContext(sb);
    const { data: rows, error } = await sb.from("communication_workflow_runs").select("id,automation_id,status,created_at,started_at,finished_at,error").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(Math.min(data.limit ?? 100, 500));
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r: any) => r.automation_id).filter(Boolean))];
    let map = new Map<string, any>();
    if (ids.length) {
      const { data: autos } = await sb.from("communication_automations").select("id,config,automation_key").in("id", ids);
      map = new Map((autos ?? []).map((a: any) => [a.id, automationView(a)]));
    }
    return { items: (rows ?? []).map((r: any) => { const a = map.get(r.automation_id); return { ...r, trigger_event: a?.trigger_event ?? "", riomed_funnel_automations: { name: a?.name ?? "—", funnel_stage: a?.funnel_stage ?? "—" } }; }) };
  });