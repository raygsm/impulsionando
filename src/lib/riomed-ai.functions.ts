import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getRiomedCompanyId(supabase: any) {
  const { data } = await supabase.from("companies").select("id").ilike("name", "%riomed%").limit(1).maybeSingle();
  return data?.id ?? null;
}

export const listRiomedAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) return { agents: [] };
    const { data } = await context.supabase
      .from("riomed_ai_agents")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return { agents: data ?? [] };
  });

const agentSchema = z.object({
  id: z.string().uuid().optional(),
  agent_key: z.string().min(2).max(60),
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
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) throw new Error("RioMed company not configured");
    const row = { ...data, company_id: companyId, tools: [] as any };
    const q = data.id
      ? context.supabase.from("riomed_ai_agents").update(row).eq("id", data.id).select().single()
      : context.supabase.from("riomed_ai_agents").insert(row).select().single();
    const { data: out, error } = await q;
    if (error) throw error;
    return { agent: out };
  });

export const deleteRiomedAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await context.supabase.from("riomed_ai_agents").delete().eq("id", data.id);
    return { ok: true };
  });

export const listRiomedAgentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { agentId?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) return { runs: [] };
    let q = context.supabase
      .from("riomed_ai_runs")
      .select("id,agent_id,status,input,output,tokens_input,tokens_output,error_message,created_at,finished_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.agentId) q = q.eq("agent_id", data.agentId);
    const { data: runs } = await q;
    return { runs: runs ?? [] };
  });

const runAgentSchema = z.object({
  agentId: z.string().uuid(),
  userMessage: z.string().min(1).max(4000),
  contextHint: z.string().max(2000).optional(),
  relatedEntityType: z.string().max(40).optional(),
  relatedEntityId: z.string().max(80).optional(),
});

export const runRiomedAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => runAgentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) throw new Error("RioMed company not configured");

    const { data: agent, error: agentErr } = await context.supabase
      .from("riomed_ai_agents")
      .select("*")
      .eq("id", data.agentId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (agentErr || !agent) throw new Error("Agente não encontrado");
    if (!agent.is_active) throw new Error("Agente inativo");

    const { data: run, error: runErr } = await context.supabase
      .from("riomed_ai_runs")
      .insert({
        agent_id: agent.id,
        company_id: companyId,
        input: { userMessage: data.userMessage, contextHint: data.contextHint ?? null },
        status: "running",
        triggered_by: context.userId,
        related_entity_type: data.relatedEntityType ?? null,
        related_entity_id: data.relatedEntityId ?? null,
      })
      .select("id")
      .single();
    if (runErr) throw runErr;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      await context.supabase.from("riomed_ai_runs").update({
        status: "error", error_message: "LOVABLE_API_KEY ausente", finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      throw new Error("LOVABLE_API_KEY ausente");
    }

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            { role: "system", content: agent.system_prompt },
            ...(data.contextHint ? [{ role: "system", content: `Contexto adicional: ${data.contextHint}` }] : []),
            { role: "user", content: data.userMessage },
          ],
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        await context.supabase.from("riomed_ai_runs").update({
          status: "error", error_message: `HTTP ${resp.status}: ${errText.slice(0, 500)}`, finished_at: new Date().toISOString(),
        }).eq("id", run.id);
        throw new Error(`AI Gateway HTTP ${resp.status}`);
      }
      const j: any = await resp.json();
      const reply = j?.choices?.[0]?.message?.content ?? "";
      const usage = j?.usage ?? {};
      await context.supabase.from("riomed_ai_runs").update({
        status: "success",
        output: { reply, raw: j },
        tokens_input: usage.prompt_tokens ?? 0,
        tokens_output: usage.completion_tokens ?? 0,
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      return { runId: run.id, reply, usage };
    } catch (e: any) {
      await context.supabase.from("riomed_ai_runs").update({
        status: "error", error_message: String(e?.message ?? e).slice(0, 500), finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      throw e;
    }
  });
