import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export type ReliabilityAlertRow = {
  id: string;
  company_id: string;
  company_name: string | null;
  public_slug: string | null;
  triggered_score: number;
  triggered_grade: string;
  n8n_failed: number;
  webhook_failed: number;
  open_incidents: number;
  status: "open" | "resolved";
  resolved_score: number | null;
  resolved_grade: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const listReliabilityAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const { data, error } = await supa
      .from("core_reliability_alerts")
      .select(
        "id, company_id, triggered_score, triggered_grade, n8n_failed, webhook_failed, open_incidents, status, resolved_score, resolved_grade, resolved_at, created_at, updated_at, companies:company_id(name, public_slug)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows: ReliabilityAlertRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      company_id: r.company_id,
      company_name: r.companies?.name ?? null,
      public_slug: r.companies?.public_slug ?? null,
      triggered_score: r.triggered_score,
      triggered_grade: r.triggered_grade,
      n8n_failed: r.n8n_failed ?? 0,
      webhook_failed: r.webhook_failed ?? 0,
      open_incidents: r.open_incidents ?? 0,
      status: r.status,
      resolved_score: r.resolved_score,
      resolved_grade: r.resolved_grade,
      resolved_at: r.resolved_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    const open = rows.filter((r) => r.status === "open").length;
    const resolved = rows.length - open;
    return { rows, kpis: { open, resolved, total: rows.length } };
  });

export const triggerReliabilitySweep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const url =
      (process.env.PUBLIC_APP_URL ?? "https://impulsionando.com.br").replace(/\/$/, "") +
      "/api/public/hooks/reliability-alerts";
    const res = await fetch(url, { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) throw new Error(json?.error ?? `Falha ${res.status}`);
    return json;
  });
