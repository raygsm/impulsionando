/**
 * Server functions para a aba /admin/clientes/:slug/automacoes.
 *
 * Regras:
 *  - Requer auth.
 *  - Só devolve dados se o caller for staff Impulsionando ou admin global (has_role).
 *  - Em `mode = "demo"` devolve eventos simulados (nunca toca banco além do lookup de company).
 *  - Em `mode = "producao"` faz leitura escopada por tenant de n8n_workflow_runs.
 *  - Nunca dispara canal real.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AutomationLog = {
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
  simulated?: boolean;
};

export type TenantAutomationsResult = {
  authorized: boolean;
  reason?: "not_staff" | "not_found";
  mode: "demo" | "producao";
  company: {
    id: string;
    name: string | null;
    subdomain: string | null;
    is_demo: boolean | null;
    is_active: boolean | null;
  } | null;
  workflows: string[];
  channels: string[];
  statuses: string[];
  total: number;
  logs: AutomationLog[];
};

const DEMO_WORKFLOWS = [
  { name: "lead-captado", regua: "captacao", channel: "whatsapp", step: "notify" },
  { name: "lead-qualificado", regua: "captacao", channel: "email", step: "qualify" },
  { name: "boas-vindas", regua: "relacionamento", channel: "whatsapp", step: "welcome" },
  { name: "pagamento-aprovado", regua: "financeiro", channel: "email", step: "receipt" },
  { name: "cliente-sem-uso", regua: "relacionamento", channel: "impulsionito", step: "nudge" },
  { name: "trial-d25", regua: "retencao", channel: "whatsapp", step: "reminder" },
  { name: "vitrine-publicado", regua: "vitrine", channel: "internal", step: "announce" },
  { name: "chamado-aberto", regua: "suporte", channel: "email", step: "ack" },
];
const DEMO_STATUSES: Array<{ s: string; http: number }> = [
  { s: "success", http: 200 },
  { s: "success", http: 200 },
  { s: "success", http: 200 },
  { s: "pending", http: 202 },
  { s: "failed", http: 500 },
];

function buildDemoLogs(seed: string, count = 80): AutomationLog[] {
  // Determinístico por tenant slug — garante estabilidade entre paginação/refetch.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 0x100000000;
  };
  const now = Date.now();
  const out: AutomationLog[] = [];
  for (let i = 0; i < count; i++) {
    const wf = DEMO_WORKFLOWS[Math.floor(rand() * DEMO_WORKFLOWS.length)];
    const st = DEMO_STATUSES[Math.floor(rand() * DEMO_STATUSES.length)];
    const startedAt = new Date(now - i * (5 * 60_000 + Math.floor(rand() * 10 * 60_000))).toISOString();
    out.push({
      id: `demo-${seed}-${i}`,
      workflow_name: wf.name,
      regua: wf.regua,
      event_name: wf.name.replace(/-/g, "."),
      step: wf.step,
      channel: wf.channel,
      status: st.s,
      http_status: st.s === "failed" ? st.http : st.http,
      latency_ms: Math.floor(80 + rand() * 900),
      started_at: startedAt,
      finished_at: st.s === "pending" ? null : startedAt,
      error: st.s === "failed" ? "Simulado: canal em modo demo — nenhum envio real" : null,
      simulated: true,
    });
  }
  return out;
}

export const loadTenantAutomations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1),
        mode: z.enum(["demo", "producao"]).default("demo"),
        workflow: z.string().optional(),
        channel: z.string().optional(),
        status: z.string().optional(),
        q: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<TenantAutomationsResult> => {
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
      return {
        authorized: false, reason: "not_staff", mode: data.mode, company: null,
        workflows: [], channels: [], statuses: [], total: 0, logs: [],
      };
    }

    const { data: company } = await context.supabase
      .from("companies")
      .select("id, name, subdomain, is_demo, is_active")
      .eq("subdomain", data.slug)
      .maybeSingle();

    if (!company) {
      return {
        authorized: true, reason: "not_found", mode: data.mode, company: null,
        workflows: [], channels: [], statuses: [], total: 0, logs: [],
      };
    }

    // Aplica filtros comuns em memória (demo) ou em query (produção).
    const applyFilters = (l: AutomationLog) => {
      if (data.workflow && l.workflow_name !== data.workflow) return false;
      if (data.channel && (l.channel ?? "") !== data.channel) return false;
      if (data.status && l.status !== data.status) return false;
      if (data.from && new Date(l.started_at) < new Date(data.from)) return false;
      if (data.to && new Date(l.started_at) > new Date(data.to)) return false;
      if (data.q) {
        const needle = data.q.toLowerCase();
        const hay = [l.workflow_name, l.event_name, l.step, l.channel, l.error]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    };

    if (data.mode === "demo") {
      const all = buildDemoLogs(data.slug);
      const workflows = Array.from(new Set(all.map((l) => l.workflow_name))).sort();
      const channels = Array.from(new Set(all.map((l) => l.channel ?? "").filter(Boolean))).sort();
      const statuses = Array.from(new Set(all.map((l) => l.status))).sort();
      const filtered = all.filter(applyFilters);
      const start = (data.page - 1) * data.pageSize;
      return {
        authorized: true, mode: "demo", company,
        workflows, channels, statuses,
        total: filtered.length,
        logs: filtered.slice(start, start + data.pageSize),
      };
    }

    // Produção — leitura real.
    const [{ data: wfRows }, { data: chRows }, { data: stRows }] = await Promise.all([
      context.supabase.from("n8n_workflow_runs").select("workflow_name").eq("tenant_id", company.id).order("created_at", { ascending: false }).limit(500),
      context.supabase.from("n8n_workflow_runs").select("channel").eq("tenant_id", company.id).not("channel", "is", null).limit(500),
      context.supabase.from("n8n_workflow_runs").select("status").eq("tenant_id", company.id).limit(500),
    ]);
    const workflows = Array.from(new Set((wfRows ?? []).map((r: any) => r.workflow_name).filter(Boolean))).sort();
    const channels = Array.from(new Set((chRows ?? []).map((r: any) => r.channel).filter(Boolean))).sort();
    const statuses = Array.from(new Set((stRows ?? []).map((r: any) => r.status).filter(Boolean))).sort();

    let q = context.supabase
      .from("n8n_workflow_runs")
      .select(
        "id, workflow_name, regua, event_name, step, channel, status, http_status, latency_ms, started_at, finished_at, error",
        { count: "exact" },
      )
      .eq("tenant_id", company.id);
    if (data.workflow) q = q.eq("workflow_name", data.workflow);
    if (data.channel) q = q.eq("channel", data.channel);
    if (data.status) q = q.eq("status", data.status);
    if (data.from) q = q.gte("started_at", data.from);
    if (data.to) q = q.lte("started_at", data.to);
    if (data.q) q = q.or(
      `workflow_name.ilike.%${data.q}%,event_name.ilike.%${data.q}%,step.ilike.%${data.q}%,error.ilike.%${data.q}%`,
    );
    const start = (data.page - 1) * data.pageSize;
    q = q.order("started_at", { ascending: false }).range(start, start + data.pageSize - 1);
    const { data: logs, count } = await q;

    return {
      authorized: true, mode: "producao", company,
      workflows, channels, statuses,
      total: count ?? (logs?.length ?? 0),
      logs: (logs ?? []) as AutomationLog[],
    };
  });
