import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getCompanyId(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("Nenhuma empresa disponível");
  return any2.id;
}

const FUNNEL_STAGES = ["captar", "converter", "relacionar", "reter", "expandir"] as const;

export const getAutomationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [wf, ag, au, runs, aiRuns] = await Promise.all([
      supabase.from("riomed_n8n_workflows").select("id,is_active", { count: "exact" }).eq("company_id", companyId),
      supabase.from("riomed_ai_agents").select("id,is_active", { count: "exact" }).eq("company_id", companyId),
      supabase.from("riomed_funnel_automations").select("id,funnel_stage,is_active").eq("company_id", companyId),
      supabase.from("riomed_automation_runs").select("id,status").eq("company_id", companyId).gte("created_at", since),
      supabase.from("riomed_ai_runs").select("id,status,cost_credits").eq("company_id", companyId).gte("created_at", since),
    ]);
    const byStage: Record<string, number> = {};
    for (const s of FUNNEL_STAGES) byStage[s] = 0;
    for (const a of au.data ?? []) byStage[a.funnel_stage] = (byStage[a.funnel_stage] ?? 0) + 1;
    const runsData = runs.data ?? [];
    const aiData = aiRuns.data ?? [];
    return {
      workflowsTotal: wf.count ?? 0,
      workflowsActive: (wf.data ?? []).filter((w: any) => w.is_active).length,
      agentsTotal: ag.count ?? 0,
      agentsActive: (ag.data ?? []).filter((a: any) => a.is_active).length,
      automationsTotal: (au.data ?? []).length,
      automationsByStage: byStage,
      runs7d: runsData.length,
      runsSuccess7d: runsData.filter((r: any) => r.status === "success").length,
      runsError7d: runsData.filter((r: any) => r.status === "error").length,
      aiRuns7d: aiData.length,
      aiCredits7d: aiData.reduce((s: number, r: any) => s + Number(r.cost_credits ?? 0), 0),
    };
  });

export const listN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data, error } = await supabase.from("riomed_n8n_workflows").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (error) throw error;
    return { items: data ?? [] };
  });

export const upsertN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; description?: string; webhookUrl?: string; triggerEvent?: string; funnelStage?: string; isActive?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const payload: any = {
      company_id: companyId,
      name: data.name,
      description: data.description ?? "",
      webhook_url: data.webhookUrl ?? "",
      trigger_event: data.triggerEvent ?? "",
      funnel_stage: data.funnelStage ?? "captar",
      is_active: data.isActive ?? true,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await supabase.from("riomed_n8n_workflows").upsert(payload).select().single();
    if (error) throw error;
    return { item: row };
  });

export const triggerN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workflowId: string; payload?: any }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: wf, error } = await supabase.from("riomed_n8n_workflows").select("*").eq("id", data.workflowId).single();
    if (error || !wf) throw new Error("Workflow não encontrado");

    const started = Date.now();
    let status = "success";
    let response: any = null;
    let errorMsg: string | null = null;
    try {
      if (wf.webhook_url) {
        const res = await fetch(wf.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: wf.trigger_event, payload: data.payload ?? {} }),
        });
        const text = await res.text();
        try { response = JSON.parse(text); } catch { response = { raw: text }; }
        if (!res.ok) { status = "error"; errorMsg = `HTTP ${res.status}`; }
      } else {
        status = "skipped";
        errorMsg = "Webhook URL não configurada";
      }
    } catch (e: any) {
      status = "error";
      errorMsg = e?.message ?? String(e);
    }

    const { data: exec } = await supabase.from("riomed_n8n_executions").insert({
      workflow_id: wf.id,
      company_id: companyId,
      status,
      trigger_payload: data.payload ?? {},
      response_payload: response,
      error_message: errorMsg,
      duration_ms: Date.now() - started,
      triggered_by: userId,
      finished_at: new Date().toISOString(),
    }).select().single();
    return { execution: exec, status, errorMsg };
  });

export const listN8nExecutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: rows, error } = await supabase.from("riomed_n8n_executions").select("*, riomed_n8n_workflows(name)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(data.limit ?? 100);
    if (error) throw error;
    return { items: rows ?? [] };
  });

export const listAiAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data, error } = await supabase.from("riomed_ai_agents").select("*").eq("company_id", companyId).order("funnel_stage").order("name");
    if (error) throw error;
    return { items: data ?? [] };
  });

export const upsertAiAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; agentKey: string; name: string; purpose: string; funnelStage: string; model?: string; systemPrompt: string; isActive?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const payload: any = {
      company_id: companyId,
      agent_key: data.agentKey,
      name: data.name,
      purpose: data.purpose,
      funnel_stage: data.funnelStage,
      model: data.model ?? "google/gemini-3-flash-preview",
      system_prompt: data.systemPrompt,
      is_active: data.isActive ?? true,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await supabase.from("riomed_ai_agents").upsert(payload, { onConflict: "company_id,agent_key" }).select().single();
    if (error) throw error;
    return { item: row };
  });

export const runAiAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { agentId: string; input: any; relatedEntityType?: string; relatedEntityId?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: agent, error } = await supabase.from("riomed_ai_agents").select("*").eq("id", data.agentId).single();
    if (error || !agent) throw new Error("Agente não encontrado");

    const apiKey = process.env.LOVABLE_API_KEY;
    let status = "success";
    let output: any = null;
    let errorMsg: string | null = null;
    let tokensIn = 0, tokensOut = 0;

    try {
      if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            { role: "system", content: agent.system_prompt },
            { role: "user", content: typeof data.input === "string" ? data.input : JSON.stringify(data.input) },
          ],
        }),
      });
      const json: any = await res.json();
      if (!res.ok) {
        status = "error";
        errorMsg = json?.error?.message ?? `HTTP ${res.status}`;
      } else {
        output = { text: json?.choices?.[0]?.message?.content ?? "", raw: json };
        tokensIn = json?.usage?.prompt_tokens ?? 0;
        tokensOut = json?.usage?.completion_tokens ?? 0;
      }
    } catch (e: any) {
      status = "error";
      errorMsg = e?.message ?? String(e);
    }

    const { data: run } = await supabase.from("riomed_ai_runs").insert({
      agent_id: agent.id,
      company_id: companyId,
      input: data.input ?? {},
      output,
      status,
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      cost_credits: (tokensIn + tokensOut) * 0.0001,
      error_message: errorMsg,
      triggered_by: userId,
      related_entity_type: data.relatedEntityType ?? null,
      related_entity_id: data.relatedEntityId ?? null,
      finished_at: new Date().toISOString(),
    }).select().single();
    return { run, status, output, errorMsg };
  });

export const listAiRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: rows, error } = await supabase.from("riomed_ai_runs").select("*, riomed_ai_agents(name,agent_key)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(data.limit ?? 100);
    if (error) throw error;
    return { items: rows ?? [] };
  });

export const listFunnelAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data, error } = await supabase.from("riomed_funnel_automations").select("*, riomed_ai_agents(name), riomed_n8n_workflows(name)").eq("company_id", companyId).order("funnel_stage").order("priority");
    if (error) throw error;
    return { items: data ?? [] };
  });

export const upsertFunnelAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; description?: string; funnelStage: string; triggerEvent: string; conditions?: any; actions?: any; agentId?: string | null; workflowId?: string | null; isActive?: boolean; priority?: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const payload: any = {
      company_id: companyId,
      name: data.name,
      description: data.description ?? "",
      funnel_stage: data.funnelStage,
      trigger_event: data.triggerEvent,
      conditions: data.conditions ?? {},
      actions: data.actions ?? [],
      agent_id: data.agentId ?? null,
      workflow_id: data.workflowId ?? null,
      is_active: data.isActive ?? true,
      priority: data.priority ?? 100,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await supabase.from("riomed_funnel_automations").upsert(payload).select().single();
    if (error) throw error;
    return { item: row };
  });

export const listAutomationRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: rows, error } = await supabase.from("riomed_automation_runs").select("*, riomed_funnel_automations(name,funnel_stage)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(data.limit ?? 100);
    if (error) throw error;
    return { items: rows ?? [] };
  });
