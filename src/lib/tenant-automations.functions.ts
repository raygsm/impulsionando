/**
 * Server functions para a aba /admin/clientes/:slug/automacoes.
 *
 * Regras:
 *  - Requer auth.
 *  - Só devolve dados se o caller for staff Impulsionando ou admin global (has_role).
 *  - Nunca dispara canal: apenas leitura de n8n_workflow_runs escopado por tenant.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TenantAutomationsResult = {
  authorized: boolean;
  reason?: "not_staff" | "not_found";
  company: {
    id: string;
    name: string | null;
    subdomain: string | null;
    is_demo: boolean | null;
    is_active: boolean | null;
  } | null;
  workflows: string[];
  logs: Array<{
    id: string;
    workflow_name: string;
    regua: string | null;
    event_name: string | null;
    step: string | null;
    channel: string | null;
    status: string;
    http_status: number | null;
    latency_ms: number | null;
    started_at: string;
    finished_at: string | null;
    error: string | null;
  }>;
};

export const loadTenantAutomations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1),
        workflow: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<TenantAutomationsResult> => {
    // Autorização: staff OU admin global.
    const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    let allowed = Boolean(staff);
    if (!allowed) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      allowed = Boolean(isAdmin);
    }
    if (!allowed) {
      return { authorized: false, reason: "not_staff", company: null, workflows: [], logs: [] };
    }

    const { data: company } = await context.supabase
      .from("companies")
      .select("id, name, subdomain, is_demo, is_active")
      .eq("subdomain", data.slug)
      .maybeSingle();

    if (!company) {
      return { authorized: true, reason: "not_found", company: null, workflows: [], logs: [] };
    }

    // Distinct workflow names para o filtro.
    const { data: wfRows } = await context.supabase
      .from("n8n_workflow_runs")
      .select("workflow_name")
      .eq("tenant_id", company.id)
      .order("created_at", { ascending: false })
      .limit(500);
    const workflows = Array.from(
      new Set((wfRows ?? []).map((r: any) => r.workflow_name).filter(Boolean)),
    ).sort();

    // Logs recentes escopados por tenant e (opcional) por fluxo.
    let q = context.supabase
      .from("n8n_workflow_runs")
      .select(
        "id, workflow_name, regua, event_name, step, channel, status, http_status, latency_ms, started_at, finished_at, error",
      )
      .eq("tenant_id", company.id)
      .order("started_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.workflow) q = q.eq("workflow_name", data.workflow);
    const { data: logs } = await q;

    return {
      authorized: true,
      company,
      workflows,
      logs: (logs ?? []) as TenantAutomationsResult["logs"],
    };
  });
