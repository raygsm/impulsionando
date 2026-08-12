// n8n workflows — server functions backed by the production registry.
// Business rules stay in the Core; n8n is only the execution/orchestration layer.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type N8nWorkflow = {
  id: string;
  workflow_slug: string;
  version: number;
  category: string;
  description: string | null;
  n8n_workflow_id: string | null;
  registry_status: string;
  tenant_status: string | null;
  last_execution_at: string | null;
  last_error: unknown | null;
  config: Record<string, unknown>;
};

async function ensureStaff(context: any) {
  const { data: staff, error } = await context.supabase.rpc("is_impulsionando_staff", {
    _user: context.userId,
  });
  if (error || !staff) throw new Error("Apenas equipe Impulsionando.");
}

async function getImpulsionandoTenant(context: any) {
  const { data, error } = await context.supabase
    .from("communication_tenants")
    .select("id,slug,display_name")
    .eq("slug", "impulsionando")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Cliente Core Impulsionando não encontrado.");
  return data as { id: string; slug: string; display_name: string | null };
}

export const getN8nHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const baseUrl = (process.env.N8N_BASE_URL || "https://n8n.impulsionando.com.br").replace(/\/$/, "");
    const started = Date.now();
    try {
      const response = await fetch(`${baseUrl}/healthz`, {
        signal: AbortSignal.timeout(8_000),
        headers: { accept: "application/json" },
      });
      const body = (await response.text()).slice(0, 300);
      return {
        ok: response.ok,
        status: response.status,
        latency_ms: Date.now() - started,
        base_url: baseUrl,
        body,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        latency_ms: Date.now() - started,
        base_url: baseUrl,
        body: error instanceof Error ? error.message : String(error),
      };
    }
  });

export const listN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const tenant = await getImpulsionandoTenant(context);

    const [{ data: registry, error: registryError }, { data: states, error: stateError }] =
      await Promise.all([
        context.supabase
          .from("n8n_workflow_registry")
          .select("id,workflow_slug,version,category,description,n8n_workflow_id,status,config")
          .like("workflow_slug", "impulsionando.%")
          .order("category", { ascending: true })
          .order("workflow_slug", { ascending: true }),
        context.supabase
          .from("tenant_workflow_state")
          .select("registry_id,status,last_execution_at,last_error,config")
          .eq("tenant_id", tenant.id),
      ]);

    if (registryError) throw new Error(registryError.message);
    if (stateError) throw new Error(stateError.message);

    const stateByRegistry = new Map(
      ((states ?? []) as any[]).map((row) => [row.registry_id, row]),
    );

    return ((registry ?? []) as any[]).map((row) => {
      const state = stateByRegistry.get(row.id) as any | undefined;
      return {
        id: row.id,
        workflow_slug: row.workflow_slug,
        version: row.version,
        category: row.category,
        description: row.description,
        n8n_workflow_id: row.n8n_workflow_id,
        registry_status: row.status,
        tenant_status: state?.status ?? null,
        last_execution_at: state?.last_execution_at ?? null,
        last_error: state?.last_error ?? null,
        config: { ...(row.config ?? {}), ...(state?.config ?? {}) },
      } satisfies N8nWorkflow;
    });
  });

// Editing a label/note in the dashboard is allowed, but this function deliberately
// does not pretend to activate/deactivate the real n8n runtime. Runtime state must
// be changed through an authenticated n8n control-plane operation.
const UpdateInput = z.object({
  id: z.string().uuid(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: current, error: readError } = await context.supabase
      .from("n8n_workflow_registry")
      .select("id,config")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Workflow não encontrado.");

    const config = {
      ...((current as any).config ?? {}),
      dashboard_notes: data.notes ?? null,
    };
    const { error } = await context.supabase
      .from("n8n_workflow_registry")
      .update({ config, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DispatchInput = z.object({
  workflow_slug: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const dispatchN8nEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DispatchInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: workflow, error } = await context.supabase
      .from("n8n_workflow_registry")
      .select("workflow_slug,n8n_workflow_id,status,config")
      .eq("workflow_slug", data.workflow_slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!workflow) throw new Error("Workflow não cadastrado.");
    if ((workflow as any).status !== "ACTIVE") {
      return { skipped: true, reason: "inactive_registry" };
    }

    const config = ((workflow as any).config ?? {}) as Record<string, unknown>;
    const webhookPath = typeof config.webhook_path === "string" ? config.webhook_path.trim() : "";
    if (!webhookPath) {
      return {
        skipped: true,
        reason: "no_verified_webhook_path",
        workflow_id: (workflow as any).n8n_workflow_id ?? null,
      };
    }

    const baseUrl = (process.env.N8N_BASE_URL || "https://n8n.impulsionando.com.br").replace(/\/$/, "");
    const target = `${baseUrl}/webhook/${webhookPath.replace(/^\/+/, "")}`;
    const started = Date.now();
    try {
      const response = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workflow_slug: data.workflow_slug,
          source: "core_dashboard",
          test: true,
          dispatched_at: new Date().toISOString(),
          data: data.payload ?? {},
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const responseBody = (await response.text()).slice(0, 1000);
      return {
        skipped: false,
        ok: response.ok,
        status_code: response.status,
        duration_ms: Date.now() - started,
        response: responseBody,
      };
    } catch (error) {
      return {
        skipped: false,
        ok: false,
        status_code: 0,
        duration_ms: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

const LogsInput = z.object({
  limit: z.number().min(1).max(200).default(50),
});

export const listN8nLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const tenant = await getImpulsionandoTenant(context);
    const { data: rows, error } = await context.supabase
      .from("communication_workflow_runs")
      .select("id,workflow_id,n8n_execution_id,correlation_id,status,started_at,finished_at,duration_ms,error,created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
