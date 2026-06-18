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
      .select("id, title, status, created_at, created_by, tipo_entrega")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!staff) demandsQ = demandsQ.eq("created_by", userId);

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

// ───────────────────────────── MENSAGERIA — THREADS ─────────────────────────────

const ThreadsInput = z.object({
  days: z.number().int().min(1).max(180).default(60),
  channel: z.enum(["whatsapp", "email", "in_app", "all"]).default("all"),
});

type ThreadRow = {
  threadKey: string;
  channel: string;
  recipient: string;
  recipientName: string | null;
  count: number;
  lastAt: string;
  lastStatus: string;
  lastSubject: string | null;
  lastBody: string;
  failed: number;
};

export const fetchMessagingThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ThreadsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const from = new Date(Date.now() - data.days * 86400_000).toISOString();
    const staff = await isStaff(supabase);
    const companyId = staff ? null : await getCallerCompanyId(supabase, userId);

    let q = supabase
      .from("message_outbox")
      .select("id, channel, status, event_code, subject, body, recipient_phone, recipient_email, recipient_user_id, recipient_name, created_at, company_id")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (companyId) q = q.eq("company_id", companyId);
    if (data.channel !== "all") q = q.eq("channel", data.channel);

    const { data: rows, error } = await q;
    if (error) throw error;

    const map = new Map<string, ThreadRow>();
    for (const r of rows ?? []) {
      const recipient =
        r.recipient_phone || r.recipient_email || r.recipient_user_id || "desconhecido";
      const threadKey = `${r.channel}|${recipient}`;
      const existing = map.get(threadKey);
      if (!existing) {
        map.set(threadKey, {
          threadKey,
          channel: r.channel,
          recipient,
          recipientName: r.recipient_name,
          count: 1,
          lastAt: r.created_at,
          lastStatus: r.status,
          lastSubject: r.subject,
          lastBody: (r.body ?? "").slice(0, 140),
          failed: r.status === "failed" ? 1 : 0,
        });
      } else {
        existing.count += 1;
        if (r.status === "failed") existing.failed += 1;
      }
    }

    return {
      total: rows?.length ?? 0,
      threads: Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
    };
  });

const ThreadInput = z.object({
  threadKey: z.string().min(3),
  days: z.number().int().min(1).max(180).default(60),
});

export const fetchMessagingThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ThreadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [channel, recipient] = data.threadKey.split("|");
    if (!channel || !recipient) throw new Error("threadKey inválido");
    const staff = await isStaff(supabase);
    const companyId = staff ? null : await getCallerCompanyId(supabase, userId);
    const from = new Date(Date.now() - data.days * 86400_000).toISOString();

    let q = supabase
      .from("message_outbox")
      .select("id, channel, status, event_code, subject, body, recipient_name, sent_at, last_error, created_at, company_id, recipient_phone, recipient_email, recipient_user_id")
      .eq("channel", channel)
      .gte("created_at", from)
      .order("created_at", { ascending: true })
      .limit(500);
    if (companyId) q = q.eq("company_id", companyId);

    // recipient match across phone/email/user_id
    q = q.or(
      `recipient_phone.eq.${recipient},recipient_email.eq.${recipient},recipient_user_id.eq.${recipient}`,
    );

    const { data: rows, error } = await q;
    if (error) throw error;
    return { messages: rows ?? [], channel, recipient };
  });

// ───────────────────────────── VOC — INSIGHTS ─────────────────────────────

const VocInsightsInput = z.object({
  days: z.number().int().min(1).max(365).default(60),
  channel: z.enum(["agent_demand", "poll", "all"]).default("all"),
  audience: z.enum(["empresa", "consumidor", "all"]).default("all"),
  status: z.string().optional(),
});

export const fetchVoiceInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VocInsightsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const from = new Date(Date.now() - data.days * 86400_000).toISOString();
    const staff = await isStaff(supabase);
    const companyId = staff ? null : await getCallerCompanyId(supabase, userId);

    type Insight = {
      id: string;
      source: "agent_demand" | "poll";
      title: string;
      status: string;
      audience: "empresa" | "consumidor";
      createdAt: string;
      meta?: Record<string, unknown>;
    };
    const insights: Insight[] = [];

    if (data.channel === "all" || data.channel === "agent_demand") {
      let dq = supabase
        .from("agent_demands")
        .select("id, title, status, created_at, created_by, tipo_entrega")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!staff) dq = dq.eq("created_by", userId);
      if (data.status) dq = dq.eq("status", data.status);
      const { data: demands } = await dq;
      for (const d of demands ?? []) {
        insights.push({
          id: d.id,
          source: "agent_demand",
          title: d.title,
          status: d.status,
          audience: "empresa",
          createdAt: d.created_at,
          meta: { tipo: d.tipo_entrega },
        });
      }
    }

    if (data.channel === "all" || data.channel === "poll") {
      let pq = supabase
        .from("clube_polls")
        .select("id, question, status, created_at, company_id")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(200);
      if (companyId) pq = pq.eq("company_id", companyId);
      if (data.status) pq = pq.eq("status", data.status);
      const { data: polls } = await pq;
      for (const p of polls ?? []) {
        insights.push({
          id: p.id,
          source: "poll",
          title: p.question,
          status: p.status,
          audience: "consumidor",
          createdAt: p.created_at,
        });
      }
    }

    const filtered =
      data.audience === "all" ? insights : insights.filter((i) => i.audience === data.audience);
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const bySource = new Map<string, number>();
    const byAudience = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const i of filtered) {
      bySource.set(i.source, (bySource.get(i.source) ?? 0) + 1);
      byAudience.set(i.audience, (byAudience.get(i.audience) ?? 0) + 1);
      byStatus.set(i.status, (byStatus.get(i.status) ?? 0) + 1);
    }

    return {
      total: filtered.length,
      insights: filtered.slice(0, 200),
      facets: {
        bySource: Array.from(bySource.entries()).map(([k, v]) => ({ key: k, count: v })),
        byAudience: Array.from(byAudience.entries()).map(([k, v]) => ({ key: k, count: v })),
        byStatus: Array.from(byStatus.entries()).map(([k, v]) => ({ key: k, count: v })),
      },
    };
  });

// ───────────────────────────── VERSÕES — ROLLOUT ─────────────────────────────

export type RolloutStage = "sandbox" | "rollout_5" | "rollout_25" | "rollout_100" | "paused";
export type RolloutAudience = "core" | "white-label" | "empresa" | "consumidor";

export interface RolloutConfig {
  stage: RolloutStage;
  audiences: RolloutAudience[];
  notes: string;
  updatedAt: string;
  updatedBy: string | null;
}

const DEFAULT_ROLLOUT: RolloutConfig = {
  stage: "rollout_100",
  audiences: ["core", "white-label", "empresa", "consumidor"],
  notes: "",
  updatedAt: "",
  updatedBy: null,
};

export const fetchVersionsRollout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { supabase } = context;
    const staff = await isStaff(supabase);

    const { data: modules } = await supabase
      .from("modules")
      .select("id, code, name, version")
      .order("name");

    const { data: versions } = await supabase
      .from("module_versions")
      .select("module_id, version, released_at, notes")
      .order("released_at", { ascending: false })
      .limit(500);

    const versionsByModule = new Map<string, any[]>();
    for (const v of versions ?? []) {
      if (!versionsByModule.has(v.module_id)) versionsByModule.set(v.module_id, []);
      versionsByModule.get(v.module_id)!.push(v);
    }

    let rolloutMap = new Map<string, RolloutConfig>();
    if (staff) {
      const { data: settings } = await supabase
        .from("core_settings")
        .select("key, value, updated_at, updated_by")
        .like("key", "module_rollout:%");
      for (const s of settings ?? []) {
        const code = s.key.replace("module_rollout:", "");
        const v = (s.value ?? {}) as Partial<RolloutConfig>;
        rolloutMap.set(code, {
          stage: (v.stage as RolloutStage) ?? DEFAULT_ROLLOUT.stage,
          audiences: (v.audiences as RolloutAudience[]) ?? DEFAULT_ROLLOUT.audiences,
          notes: v.notes ?? "",
          updatedAt: s.updated_at,
          updatedBy: s.updated_by,
        });
      }
    }

    const rows = (modules ?? []).map((m: any) => {
      const moduleVersions = versionsByModule.get(m.id) ?? [];
      const latest = moduleVersions[0];
      return {
        moduleId: m.id,
        code: m.code,
        name: m.name,
        latestVersion: latest?.version ?? m.version ?? "—",
        releasedAt: latest?.released_at ?? null,
        releaseNotes: latest?.notes ?? null,
        history: moduleVersions.slice(0, 10).map((v) => ({
          version: v.version,
          releasedAt: v.released_at,
          notes: v.notes,
        })),
        rollout: rolloutMap.get(m.code) ?? DEFAULT_ROLLOUT,
      };
    });

    return { staff, modules: rows };
  });

const SetRolloutInput = z.object({
  moduleCode: z.string().min(1),
  stage: z.enum(["sandbox", "rollout_5", "rollout_25", "rollout_100", "paused"]),
  audiences: z.array(z.enum(["core", "white-label", "empresa", "consumidor"])).min(1),
  notes: z.string().max(500).default(""),
});

export const setModuleRollout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetRolloutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await isStaff(supabase))) throw new Error("Forbidden");

    const key = `module_rollout:${data.moduleCode}`;
    const value = {
      stage: data.stage,
      audiences: data.audiences,
      notes: data.notes,
    };

    const { error } = await supabase
      .from("core_settings")
      .upsert(
        {
          key,
          value,
          label: `Rollout — ${data.moduleCode}`,
          description: `Controle de rollout do módulo ${data.moduleCode}`,
          category: "rollout",
          is_editable: true,
          updated_by: userId,
        },
        { onConflict: "key" },
      );
    if (error) throw error;
    return { ok: true };
  });

// ───────────────────────────── SAÚDE — RECOMENDAÇÕES ─────────────────────────────

export interface HealthRecommendation {
  severity: "critical" | "warning" | "info";
  dimension: string;
  title: string;
  action: string;
  link?: { to: string; label: string };
}

export function computeHealthRecommendations(input: {
  score: number | null;
  dimensions: Array<{ key: string; label: string; value: number }>;
  signals: Array<{ label: string; value: number; inverse?: boolean }>;
}): HealthRecommendation[] {
  const recs: HealthRecommendation[] = [];
  if (input.score === null) return recs;

  if (input.score < 50) {
    recs.push({
      severity: "critical",
      dimension: "geral",
      title: "Score geral crítico",
      action: "Agende uma revisão de onboarding e priorize as dimensões abaixo de 60.",
      link: { to: "/onboarding", label: "Abrir onboarding" },
    });
  } else if (input.score < 80) {
    recs.push({
      severity: "warning",
      dimension: "geral",
      title: "Score em zona de atenção",
      action: "Há ganhos rápidos nas dimensões com menor pontuação. Veja recomendações abaixo.",
    });
  }

  for (const d of input.dimensions) {
    if (d.value >= 80) continue;
    const sev: HealthRecommendation["severity"] = d.value < 50 ? "critical" : "warning";
    const base = { severity: sev, dimension: d.key } as const;
    switch (d.key) {
      case "adocao":
        recs.push({
          ...base,
          title: `Adoção baixa (${d.value}/100)`,
          action: "Treine a equipe nos módulos contratados e ative os fluxos diários (vendas, agenda).",
          link: { to: "/modules", label: "Ver módulos" },
        });
        break;
      case "financeiro":
        recs.push({
          ...base,
          title: `Financeiro pendente (${d.value}/100)`,
          action: "Quite faturas em aberto e revise o método de pagamento padrão.",
          link: { to: "/finance", label: "Abrir Financeiro" },
        });
        break;
      case "relacionamento":
        recs.push({
          ...base,
          title: `Relacionamento abaixo do alvo (${d.value}/100)`,
          action: "Ative campanhas de mensageria e colha NPS recente dos clientes ativos.",
          link: { to: "/ops/mensageria", label: "Ver Mensageria" },
        });
        break;
      case "operacao":
        recs.push({
          ...base,
          title: `Operação com alertas (${d.value}/100)`,
          action: "Investigue falhas recentes de mensageria e reprocesse o que estiver com erro.",
          link: { to: "/ops/mensageria", label: "Falhas recentes" },
        });
        break;
      case "crescimento":
        recs.push({
          ...base,
          title: `Crescimento parado (${d.value}/100)`,
          action: "Reative login diário, conecte novas fontes de leads e configure metas.",
          link: { to: "/crm/leads", label: "Ver Leads" },
        });
        break;
    }
  }

  for (const s of input.signals) {
    if (s.inverse && s.value >= 5) {
      recs.push({
        severity: "warning",
        dimension: "sinal",
        title: `${s.label}: ${s.value}`,
        action: "Revise os itens com erro e reprocesse a fila antes que afete o atendimento.",
      });
    }
  }

  return recs;
}
