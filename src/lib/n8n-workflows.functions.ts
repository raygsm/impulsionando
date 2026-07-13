// n8n workflows — server functions
// Central de disparo dos fluxos n8n conectados às jornadas Impulsionando.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type N8nWorkflow = {
  id: string;
  funil: "captacao" | "conversao" | "relacionamento";
  event_code: string;
  label: string;
  webhook_url: string | null;
  is_active: boolean;
  notes: string | null;
  last_dispatched_at: string | null;
};

async function ensureStaff(context: any) {
  const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", {
    _user: context.userId,
  });
  if (!staff) throw new Error("Apenas equipe Impulsionando.");
}

// ---------- Listagem ----------
export const listN8nWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data, error } = await context.supabase
      .from("n8n_workflows")
      .select("*")
      .order("funil", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as N8nWorkflow[];
  });

// ---------- Atualização ----------
const UpdateInput = z.object({
  id: z.string().uuid(),
  webhook_url: z.string().url().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export const updateN8nWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const patch: {
      webhook_url: string | null;
      is_active?: boolean;
      notes?: string | null;
    } = {
      webhook_url: data.webhook_url === "" ? null : data.webhook_url,
    };
    if (typeof data.is_active === "boolean") patch.is_active = data.is_active;
    if (data.notes !== undefined) patch.notes = data.notes;

    const { error } = await context.supabase
      .from("n8n_workflows")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Disparo (usado por outras server fns e pelo botão "testar") ----------
const DispatchInput = z.object({
  event_code: z.string(),
  company_id: z.string().uuid().nullable().optional(),
  payload: z.record(z.unknown()).optional(),
});

async function doDispatch(
  supabase: any,
  event_code: string,
  company_id: string | null,
  payload: Record<string, unknown>,
) {
  const { data: wf, error } = await supabase
    .from("n8n_workflows")
    .select("id, webhook_url, is_active")
    .eq("event_code", event_code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!wf) throw new Error(`Fluxo n8n não cadastrado: ${event_code}`);
  if (!wf.is_active || !wf.webhook_url) {
    return { skipped: true, reason: !wf.is_active ? "inactive" : "no_url" };
  }

  const body = JSON.stringify({
    event_code,
    company_id,
    dispatched_at: new Date().toISOString(),
    data: payload,
  });

  let status_code: number | null = null;
  let response_body = "";
  let errorMsg: string | null = null;

  try {
    const res = await fetch(wf.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    status_code = res.status;
    response_body = (await res.text()).slice(0, 2000);
  } catch (e: any) {
    errorMsg = e?.message ?? String(e);
  }

  await supabase.from("n8n_dispatch_log").insert({
    event_code,
    company_id,
    payload,
    status_code,
    response_body,
    error: errorMsg,
  });

  if (!errorMsg && status_code && status_code < 400) {
    await supabase
      .from("n8n_workflows")
      .update({ last_dispatched_at: new Date().toISOString() })
      .eq("id", wf.id);
  }

  return { skipped: false, status_code, error: errorMsg };
}

// Disparo autenticado (usado por telas admin / botão "testar")
export const dispatchN8nEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DispatchInput.parse(d))
  .handler(async ({ data, context }) => {
    return await doDispatch(
      context.supabase,
      data.event_code,
      data.company_id ?? null,
      data.payload ?? {},
    );
  });

// ---------- Logs recentes ----------
const LogsInput = z.object({
  event_code: z.string().optional(),
  limit: z.number().min(1).max(200).default(50),
});

export const listN8nLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    let q = context.supabase
      .from("n8n_dispatch_log")
      .select("*")
      .order("dispatched_at", { ascending: false })
      .limit(data.limit);
    if (data.event_code) q = q.eq("event_code", data.event_code);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
