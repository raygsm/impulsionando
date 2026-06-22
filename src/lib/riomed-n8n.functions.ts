import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getRiomedCompanyId(supabase: any) {
  const { data } = await supabase.from("companies").select("id").ilike("name", "%riomed%").limit(1).maybeSingle();
  return data?.id ?? null;
}

export const listRiomedN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) return { workflows: [] };
    const { data } = await context.supabase
      .from("riomed_n8n_workflows")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return { workflows: data ?? [] };
  });

const wfSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(160),
  description: z.string().max(800).optional().or(z.literal("")),
  webhook_url: z.string().url().max(800).optional().or(z.literal("")),
  trigger_event: z.string().max(80).optional().or(z.literal("")),
  funnel_stage: z.enum(["captar", "converter", "relacionar", "reter", "expandir"]).optional(),
  is_active: z.boolean().default(true),
});

export const upsertRiomedN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => wfSchema.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) throw new Error("RioMed company not configured");
    const row = {
      company_id: companyId,
      name: data.name,
      description: data.description || null,
      webhook_url: data.webhook_url || null,
      trigger_event: data.trigger_event || null,
      funnel_stage: data.funnel_stage || null,
      is_active: data.is_active,
      config: {} as any,
    };
    const q = data.id
      ? context.supabase.from("riomed_n8n_workflows").update(row).eq("id", data.id).select().single()
      : context.supabase.from("riomed_n8n_workflows").insert(row).select().single();
    const { data: out, error } = await q;
    if (error) throw error;
    return { workflow: out };
  });

export const deleteRiomedN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await context.supabase.from("riomed_n8n_workflows").delete().eq("id", data.id);
    return { ok: true };
  });

const triggerSchema = z.object({
  workflowId: z.string().uuid(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const triggerRiomedN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => triggerSchema.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) throw new Error("RioMed company not configured");

    const { data: wf, error: wfErr } = await context.supabase
      .from("riomed_n8n_workflows")
      .select("*")
      .eq("id", data.workflowId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (wfErr || !wf) throw new Error("Workflow não encontrado");
    if (!wf.is_active) throw new Error("Workflow inativo");
    if (!wf.webhook_url) throw new Error("Workflow sem webhook_url configurado");

    const { data: exec } = await context.supabase
      .from("riomed_n8n_executions")
      .insert({
        workflow_id: wf.id,
        company_id: companyId,
        status: "running",
        trigger_payload: data.payload ?? {},
        triggered_by: context.userId,
      })
      .select("id")
      .single();

    const t0 = Date.now();
    try {
      const resp = await fetch(wf.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: wf.trigger_event ?? "manual", payload: data.payload ?? {} }),
      });
      const text = await resp.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
      await context.supabase.from("riomed_n8n_executions").update({
        status: resp.ok ? "success" : "error",
        response_payload: parsed,
        error_message: resp.ok ? null : `HTTP ${resp.status}`,
        duration_ms: Date.now() - t0,
        finished_at: new Date().toISOString(),
      }).eq("id", exec!.id);
      return { executionId: exec!.id, ok: resp.ok, response: parsed };
    } catch (e: any) {
      await context.supabase.from("riomed_n8n_executions").update({
        status: "error",
        error_message: String(e?.message ?? e).slice(0, 500),
        duration_ms: Date.now() - t0,
        finished_at: new Date().toISOString(),
      }).eq("id", exec!.id);
      throw e;
    }
  });

export const listRiomedN8nExecutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workflowId?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const companyId = await getRiomedCompanyId(context.supabase);
    if (!companyId) return { executions: [] };
    let q = context.supabase
      .from("riomed_n8n_executions")
      .select("id,workflow_id,status,trigger_payload,response_payload,error_message,duration_ms,created_at,finished_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.workflowId) q = q.eq("workflow_id", data.workflowId);
    const { data: executions } = await q;
    return { executions: executions ?? [] };
  });
