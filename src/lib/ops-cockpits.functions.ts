import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fase 3 — Core Ops: Mensageria, Voz do Cliente, Saúde da Conta, Versões.
 *
 * Todas as funções respeitam RLS via requireSupabaseAuth. Para visões
 * agregadas Core, exigem is_impulsionando_staff; para visão de empresa,
 * derivam companyId do user_profiles do chamador.
 */

async function getCallerCompanyId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.company_id ?? null;
}

async function isStaff(supabase: any): Promise<boolean> {
  const { data } = await supabase.rpc("is_impulsionando_staff");
  return Boolean(data);
}

// ───────────────────────────── MENSAGERIA ─────────────────────────────

const MsgInput = z.object({
  days: z.number().int().min(1).max(90).default(30),
  scope: z.enum(["company", "core"]).default("company"),
});

export const fetchMessagingPanel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MsgInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const from = new Date(Date.now() - data.days * 86400_000).toISOString();

    let q = supabase
      .from("message_outbox")
      .select("id, channel, status, event_code, scheduled_at, sent_at, last_error, company_id, created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.scope === "company" || !(await isStaff(supabase))) {
      const companyId = await getCallerCompanyId(supabase, userId);
      if (!companyId) return { byChannel: [], byStatus: [], failedRecent: [], total: 0 };
      q = q.eq("company_id", companyId);
    }

    const { data: rows, error } = await q;
    if (error) throw error;

    const byChannel = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const r of rows ?? []) {
      byChannel.set(r.channel, (byChannel.get(r.channel) ?? 0) + 1);
      byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    }
    const failedRecent = (rows ?? [])
      .filter((r: any) => r.status === "failed")
      .slice(0, 20)
      .map((r: any) => ({
        id: r.id,
        channel: r.channel,
        event: r.event_code,
        at: r.created_at,
        error: r.last_error,
      }));

    return {
      total: rows?.length ?? 0,
      byChannel: Array.from(byChannel.entries()).map(([k, v]) => ({ channel: k, count: v })),
      byStatus: Array.from(byStatus.entries()).map(([k, v]) => ({ status: k, count: v })),
      failedRecent,
    };
  });

// ───────────────────────────── VOZ DO CLIENTE ─────────────────────────────

const VoiceInput = z.object({ days: z.number().int().min(7).max(180).default(30) });

export const fetchVoiceOfCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VoiceInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const staff = await isStaff(supabase);
    const companyId = staff ? null : await getCallerCompanyId(supabase, userId);
    const from = new Date(Date.now() - data.days * 86400_000).toISOString();

    // Demandas/feedback de agentes (proxies de VoC enquanto não há tabela dedicada)
    let demandsQ = supabase
      .from("agent_demands")
      .select("id, title, status, created_at, company_id, priority")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(200);
    if (companyId) demandsQ = demandsQ.eq("company_id", companyId);

    let pollsQ = supabase
      .from("clube_polls")
      .select("id, question, status, created_at, company_id")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(50);
    if (companyId) pollsQ = pollsQ.eq("company_id", companyId);

    const [{ data: demands }, { data: polls }] = await Promise.all([demandsQ, pollsQ]);

    const byStatus = new Map<string, number>();
    for (const d of demands ?? []) byStatus.set(d.status, (byStatus.get(d.status) ?? 0) + 1);

    return {
      demands: demands ?? [],
      polls: polls ?? [],
      byStatus: Array.from(byStatus.entries()).map(([k, v]) => ({ status: k, count: v })),
      summary: {
        totalDemands: demands?.length ?? 0,
        openDemands: (demands ?? []).filter((d: any) => d.status !== "done" && d.status !== "closed").length,
        activePolls: (polls ?? []).filter((p: any) => p.status === "open" || p.status === "active").length,
      },
    };
  });

// ───────────────────────────── SAÚDE DA CONTA ─────────────────────────────

const HealthInput = z.object({ companyId: z.string().uuid().optional() });

export const fetchAccountHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HealthInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const staff = await isStaff(supabase);
    const companyId =
      staff && data.companyId ? data.companyId : await getCallerCompanyId(supabase, userId);
    if (!companyId) {
      return { companyId: null, score: null, dimensions: [], signals: [] };
    }

    const last30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    // Sinais (consultas pequenas em paralelo)
    const [
      { count: salesCount },
      { count: appointmentsCount },
      { count: messageFailures },
      { count: openInvoices },
      { data: lastLogin },
    ] = await Promise.all([
      supabase.from("sales_orders").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", last30),
      supabase.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", last30),
      supabase.from("message_outbox").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "failed").gte("created_at", last30),
      supabase.from("billing_invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["open", "overdue"]),
      supabase.from("user_profiles").select("last_login_at").eq("company_id", companyId).order("last_login_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Dimensões (peso conforme /saiba-mais/saude)
    const adocao = Math.min(100, ((salesCount ?? 0) + (appointmentsCount ?? 0)) * 2);
    const financeiro = (openInvoices ?? 0) === 0 ? 100 : Math.max(0, 100 - (openInvoices ?? 0) * 15);
    const relacionamento = 70; // placeholder; depende de NPS futuro
    const operacao = (messageFailures ?? 0) === 0 ? 100 : Math.max(0, 100 - (messageFailures ?? 0) * 5);
    const lastLoginAt = (lastLogin as any)?.last_login_at;
    const crescimento = lastLoginAt
      ? Math.max(0, 100 - Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / 86400_000) * 3)
      : 40;

    const score = Math.round(
      adocao * 0.3 + financeiro * 0.25 + relacionamento * 0.2 + operacao * 0.15 + crescimento * 0.1,
    );

    const dimensions = [
      { key: "adocao", label: "Adoção", weight: 0.3, value: Math.round(adocao) },
      { key: "financeiro", label: "Financeiro", weight: 0.25, value: Math.round(financeiro) },
      { key: "relacionamento", label: "Relacionamento", weight: 0.2, value: Math.round(relacionamento) },
      { key: "operacao", label: "Operação", weight: 0.15, value: Math.round(operacao) },
      { key: "crescimento", label: "Crescimento", weight: 0.1, value: Math.round(crescimento) },
    ];

    const signals = [
      { label: "Vendas (30d)", value: salesCount ?? 0 },
      { label: "Atendimentos (30d)", value: appointmentsCount ?? 0 },
      { label: "Mensagens falhas (30d)", value: messageFailures ?? 0, inverse: true },
      { label: "Faturas em aberto", value: openInvoices ?? 0, inverse: true },
    ];

    return { companyId, score, dimensions, signals };
  });

// ───────────────────────────── VERSÕES ─────────────────────────────

export const fetchVersionsPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const staff = await isStaff(supabase);
    const companyId = staff ? null : await getCallerCompanyId(supabase, userId);

    // Catálogo de módulos com última versão
    const { data: modules } = await supabase
      .from("modules")
      .select("id, code, name, version")
      .order("name");

    const { data: versions } = await supabase
      .from("module_versions")
      .select("module_id, version, released_at, notes")
      .order("released_at", { ascending: false })
      .limit(200);

    const latestByModule = new Map<string, any>();
    for (const v of versions ?? []) {
      if (!latestByModule.has(v.module_id)) latestByModule.set(v.module_id, v);
    }

    let installedQ = supabase
      .from("company_modules")
      .select("company_id, module_id, installed_version, installed_at, is_enabled");
    if (companyId) installedQ = installedQ.eq("company_id", companyId);
    const { data: installed } = await installedQ.limit(2000);

    const rows = (modules ?? []).map((m: any) => {
      const latest = latestByModule.get(m.id);
      const myInstalls = (installed ?? []).filter((i: any) => i.module_id === m.id);
      const onLatest = myInstalls.filter(
        (i: any) => latest && i.installed_version === latest.version,
      ).length;
      return {
        moduleId: m.id,
        code: m.code,
        name: m.name,
        latestVersion: latest?.version ?? m.version ?? "—",
        releasedAt: latest?.released_at ?? null,
        notes: latest?.notes ?? null,
        installs: myInstalls.length,
        onLatest,
        pending: myInstalls.length - onLatest,
      };
    });

    return {
      scope: companyId ? "company" : "core",
      modules: rows,
      summary: {
        totalModules: rows.length,
        totalPending: rows.reduce((s, r) => s + r.pending, 0),
      },
    };
  });
