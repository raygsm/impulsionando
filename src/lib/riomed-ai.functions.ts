import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function riomedContext(supabase: any) {
  const { data, error } = await supabase.from("communication_tenants").select("id,company_id")
    .eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id || !data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return { tenantId: data.id as string, companyId: data.company_id as string };
}

async function impulsionitoRootId(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("communication_agent_runtime").select("agent_id")
    .eq("agent_key", "impulsionito-core").eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.agent_id) throw new Error("Impulsionito master não encontrado");
  return data.agent_id as string;
}

function mapAgent(agent: any, runtime: any) {
  const config = runtime?.config ?? {};
  return {
    id: agent.id,
    agent_key: runtime?.agent_key ?? "",
    name: agent.name,
    purpose: config.purpose ?? agent.role ?? "",
    funnel_stage: config.funnel_stage ?? "captar",
    model: runtime?.model_policy?.model ?? "core-managed",
    system_prompt: config.system_prompt ?? "",
    is_active: Boolean(agent.active && runtime?.active),
    runtime_ready: Boolean(runtime?.agent_key && runtime?.root_agent_id),
    execution_ready: Boolean(runtime?.config?.execution_ready),
  };
}

export const listRiomedAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId } = await riomedContext((context as any).supabase);
    const { data: agents, error } = await (context as any).supabase.from("communication_agents")
      .select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (agents ?? []).map((a: any) => a.id);
    if (!ids.length) return { agents: [] };
    const { data: runtimes, error: runtimeError } = await (context as any).supabase.from("communication_agent_runtime").select("*").in("agent_id", ids);
    if (runtimeError) throw new Error(runtimeError.message);
    const byId = new Map((runtimes ?? []).map((r: any) => [r.agent_id, r]));
    return { agents: (agents ?? []).map((a: any) => mapAgent(a, byId.get(a.id))) };
  });

const agentSchema = z.object({
  id: z.string().uuid().optional(),
  agent_key: z.string().min(2).max(60).regex(/^[a-z0-9][a-z0-9._-]+$/i),
  name: z.string().min(2).max(120),
  purpose: z.string().min(2).max(400),
  funnel_stage: z.enum(["captar", "converter", "relacionar", "reter", "expandir"]),
  model: z.string().min(2).max(120),
  system_prompt: z.string().min(10).max(8000),
  is_active: z.boolean().default(true),
});

export const upsertRiomedAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => agentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const rootId = await impulsionitoRootId(sb);
    const canonicalKey = data.agent_key.toLowerCase().startsWith("riomed-") ? data.agent_key.toLowerCase() : `riomed-${data.agent_key.toLowerCase()}`;
    let agentId = data.id;
    let created = false;

    if (agentId) {
      const { data: existing, error: existingError } = await sb.from("communication_agents").select("id").eq("id", agentId).eq("tenant_id", tenantId).maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (!existing) throw new Error("Agente Rio Med não encontrado");
      const { error } = await sb.from("communication_agents").update({
        name: data.name, role: data.purpose, signature: data.name, active: data.is_active,
      }).eq("id", agentId).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    } else {
      const { data: agent, error } = await sb.from("communication_agents").insert({
        tenant_id: tenantId, name: data.name, role: data.purpose, signature: data.name,
        reply_route: "core_agent_runtime", active: data.is_active,
      }).select("id").single();
      if (error || !agent) throw new Error(error?.message ?? "Falha ao criar agente");
      agentId = agent.id;
      created = true;
    }

    const runtimePayload = {
      agent_id: agentId,
      agent_key: canonicalKey,
      root_agent_id: rootId,
      instance_type: "CLIENT_INSTANCE",
      system_prompt_ref: `runtime:${canonicalKey}`,
      knowledge_scope: "RIO_MED",
      model_policy: { model: data.model, provider: "core-managed", selection: "managed" },
      privacy_policy: { tenant_isolation: true, pii_minimization: true },
      handoff_policy: { human_handoff: true, preserve_context: true },
      capabilities: { sales: true, support: true, qualification: true, omnichannel: true },
      config: { purpose: data.purpose, funnel_stage: data.funnel_stage, system_prompt: data.system_prompt, execution_ready: false },
      active: data.is_active,
    };
    const { data: runtime, error: runtimeError } = await sb.from("communication_agent_runtime")
      .upsert(runtimePayload, { onConflict: "agent_id" }).select("*").single();
    if (runtimeError) {
      if (created && agentId) await sb.from("communication_agents").delete().eq("id", agentId).eq("tenant_id", tenantId);
      throw new Error(runtimeError.message);
    }
    const { data: agentRow } = await sb.from("communication_agents").select("*").eq("id", agentId).single();
    return { agent: mapAgent(agentRow, runtime), executionReady: false };
  });

// Preserva auditoria: "remover" desativa agente e runtime em vez de apagar histórico.
export const deleteRiomedAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const { data: agent, error } = await sb.from("communication_agents").update({ active: false }).eq("id", data.id).eq("tenant_id", tenantId).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!agent) throw new Error("Agente não encontrado");
    const { error: runtimeError } = await sb.from("communication_agent_runtime").update({ active: false }).eq("agent_id", data.id);
    if (runtimeError) throw new Error(runtimeError.message);
    return { ok: true, deactivated: true };
  });

export const listRiomedAgentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { agentId?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    let q = sb.from("communication_conversations").select("id,agent_id,status,channel,last_message_at,created_at,closed_at")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100);
    if (data.agentId) q = q.eq("agent_id", data.agentId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { runs: (rows ?? []).map((r: any) => ({ id: r.id, agent_id: r.agent_id, status: r.status, created_at: r.created_at, finished_at: r.closed_at, tokens_input: null, tokens_output: null, channel: r.channel })) };
  });

export const runRiomedAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ agentId: z.string().uuid(), userMessage: z.string().min(1).max(4000), contextHint: z.string().max(2000).optional(), relatedEntityType: z.string().max(40).optional(), relatedEntityId: z.string().max(80).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const { data: runtime, error } = await sb.from("communication_agent_runtime").select("agent_id,agent_key,active,config").eq("agent_id", data.agentId).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: agent } = await sb.from("communication_agents").select("id,active").eq("id", data.agentId).eq("tenant_id", tenantId).maybeSingle();
    if (!agent || !runtime || !agent.active || !runtime.active) throw new Error("Agente Rio Med não encontrado ou inativo");
    if (!runtime.config?.execution_ready) {
      throw new Error("A instância está configurada no Core, mas a inferência universal ainda não foi homologada para este agente. Nenhuma resposta artificial será simulada.");
    }
    throw new Error("Executor universal de teste não exposto por esta tela. Utilize um canal omnichannel homologado para validar a instância.");
  });