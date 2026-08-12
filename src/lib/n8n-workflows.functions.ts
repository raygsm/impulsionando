// n8n workflows — server functions
// Fonte de verdade: registry + estado por cliente + ledger único de execuções.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type N8nWorkflow = {
  id: string;
  funil: string;
  event_code: string;
  label: string;
  n8n_workflow_id: string | null;
  registry_status: string;
  state_status: string | null;
  trigger_type: string | null;
  last_execution_at: string | null;
  last_run_status: string | null;
  last_error: unknown | null;
  webhook_verified: boolean;
};

async function ensureStaff(context: any) {
  const { data: staff, error } = await context.supabase.rpc("is_impulsionando_staff", {
    _user: context.userId,
  });
  if (error || !staff) throw new Error("Apenas equipe Impulsionando.");
}

async function getImpulsionandoTenantId() {
  const { data, error } = await supabaseAdmin
    .from("communication_tenants" as never)
    .select("id" as never)
    .eq("slug" as never, "impulsionando")
    .eq("active" as never, true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Cliente Core Impulsionando não encontrado no backend.");
  return String((data as any).id);
}

export const listN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const tenantId = await getImpulsionandoTenantId();

    const { data: registry, error: registryError } = await supabaseAdmin
      .from("n8n_workflow_registry" as never)
      .select("id,workflow_slug,category,description,trigger_type,n8n_workflow_id,status,config" as never)
      .like("workflow_slug" as never, "impulsionando.%")
      .order("category" as never, { ascending: true })
      .order("workflow_slug" as never, { ascending: true });
    if (registryError) throw new Error(registryError.message);

    const ids = ((registry ?? []) as any[]).map((r) => r.id);
    if (!ids.length) return [] as N8nWorkflow[];

    const [{ data: states, error: statesError }, { data: runs, error: runsError }] = await Promise.all([
      supabaseAdmin
        .from("tenant_workflow_state" as never)
        .select("registry_id,status,last_execution_at,last_error,config" as never)
        .eq("tenant_id" as never, tenantId)
        .in("registry_id" as never, ids),
      supabaseAdmin
        .from("communication_workflow_runs" as never)
        .select("registry_id,status,error,created_at,started_at,finished_at" as never)
        .eq("tenant_id" as never, tenantId)
        .in("registry_id" as never, ids)
        .order("created_at" as never, { ascending: false })
        .limit(500),
    ]);
    if (statesError) throw new Error(statesError.message);
    if (runsError) throw new Error(runsError.message);

    const stateByRegistry = new Map<string, any>();
    for (const state of (states ?? []) as any[]) stateByRegistry.set(state.registry_id, state);

    const latestRunByRegistry = new Map<string, any>();
    for (const run of (runs ?? []) as any[]) {
      if (run.registry_id && !latestRunByRegistry.has(run.registry_id)) {
        latestRunByRegistry.set(run.registry_id, run);
      }
    }

    return ((registry ?? []) as any[]).map((row): N8nWorkflow => {
      const state = stateByRegistry.get(row.id) ?? null;
      const run = latestRunByRegistry.get(row.id) ?? null;
      const cfg = row.config && typeof row.config === "object" ? row.config : {};
      const stateCfg = state?.config && typeof state.config === "object" ? state.config : {};
      const webhookUrl = String(stateCfg.webhook_url ?? cfg.webhook_url ?? "");
      const canonical = "https://n8n.impulsionando.com.br/";
      return {
        id: row.id,
        funil: row.category,
        event_code: row.workflow_slug,
        label: row.description || row.workflow_slug.split(".").pop() || row.workflow_slug,
        n8n_workflow_id: row.n8n_workflow_id,
        registry_status: row.status,
        state_status: state?.status ?? null,
        trigger_type: row.trigger_type ?? null,
        last_execution_at: state?.last_execution_at ?? run?.finished_at ?? run?.started_at ?? run?.created_at ?? null,
        last_run_status: run?.status ?? null,
        last_error: state?.last_error ?? run?.error ?? null,
        webhook_verified: webhookUrl.startsWith(canonical),
      };
    });
  });

const LogsInput = z.object({
  event_code: z.string().optional(),
  limit: z.number().min(1).max(200).default(50),
});

export const listN8nLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const tenantId = await getImpulsionandoTenantId();

    let registryId: string | null = null;
    if (data.event_code) {
      const { data: reg, error } = await supabaseAdmin
        .from("n8n_workflow_registry" as never)
        .select("id" as never)
        .eq("workflow_slug" as never, data.event_code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      registryId = reg ? String((reg as any).id) : null;
      if (!registryId) return [];
    }

    let query = supabaseAdmin
      .from("communication_workflow_runs" as never)
      .select("id,registry_id,automation_id,correlation_id,n8n_execution_id,status,started_at,finished_at,error,created_at" as never)
      .eq("tenant_id" as never, tenantId)
      .order("created_at" as never, { ascending: false })
      .limit(data.limit);
    if (registryId) query = query.eq("registry_id" as never, registryId);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const registryIds = [...new Set(((rows ?? []) as any[]).map((r) => r.registry_id).filter(Boolean))];
    const slugById = new Map<string, string>();
    if (registryIds.length) {
      const { data: regs, error: regsError } = await supabaseAdmin
        .from("n8n_workflow_registry" as never)
        .select("id,workflow_slug" as never)
        .in("id" as never, registryIds);
      if (regsError) throw new Error(regsError.message);
      for (const reg of (regs ?? []) as any[]) slugById.set(reg.id, reg.workflow_slug);
    }

    return ((rows ?? []) as any[]).map((row) => ({
      ...row,
      event_code: row.registry_id ? slugById.get(row.registry_id) ?? "workflow-desconhecido" : "automacao-moderna",
    }));
  });
