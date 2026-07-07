/**
 * Auditoria em tempo real do ecossistema Impulsionando.
 *
 * `getEcosystemHealth` — resumo agregado seguro para QUALQUER usuário
 * autenticado (gestor, cliente, funcionário, consumidor). Não devolve
 * URLs privadas, emails de alerta ou mensagens de erro sensíveis: só
 * contagens, percentuais e labels públicos de checks marcados como
 * `show_on_public`. Alimenta o botão "Auditoria" fixo no menu lateral
 * e o dashboard `/auditoria`.
 *
 * `triggerImpulsionitoFix` — grava um pedido "CORRIGIR" em
 * `automation_approvals` (contrato existente, sem alteração de schema)
 * para que o agente Impulsionito processe a lista de recursos inativos
 * pelo mesmo pipeline de aprovações já auditado. Um por usuário/janela
 * curta — não spam-a o pipeline.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface EcosystemCheck {
  id: string;
  label: string;
  category: string | null;
  isUp: boolean;
  paused: boolean;
  since: string | null;
  lastCheckAt: string | null;
  uptime24hPct: number;
  consecutiveFailures: number;
}

export interface EcosystemHealthResult {
  overallOk: boolean;
  total: number;
  up: number;
  down: number;
  paused: number;
  openIncidents: number;
  uptime24hPct: number;
  checkedAt: string;
  checks: EcosystemCheck[];
}

export const getEcosystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EcosystemHealthResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: state }, { data: last24 }, { data: incidents }] = await Promise.all([
      supabaseAdmin
        .from("uptime_state")
        .select(
          "url, label, category, paused, show_on_public, is_up, since, last_check_at, consecutive_failures",
        )
        .eq("show_on_public", true)
        .order("category", { ascending: true }),
      supabaseAdmin
        .from("uptime_checks")
        .select("url, is_up")
        .gte("checked_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5000),
      supabaseAdmin
        .from("core_incidents")
        .select("id, status")
        .in("status", ["open", "monitoring"])
        .limit(500),
    ]);

    const rows = state ?? [];
    const uptimeByUrl = new Map<string, { total: number; up: number }>();
    for (const c of last24 ?? []) {
      const key = c.url as string;
      const agg = uptimeByUrl.get(key) ?? { total: 0, up: 0 };
      agg.total += 1;
      if (c.is_up) agg.up += 1;
      uptimeByUrl.set(key, agg);
    }

    let totalPctSum = 0;
    let totalPctCount = 0;
    const checks: EcosystemCheck[] = rows.map((r) => {
      const agg = uptimeByUrl.get(r.url as string) ?? { total: 0, up: 0 };
      const pct = agg.total === 0 ? (r.is_up ? 100 : 0) : (agg.up / agg.total) * 100;
      totalPctSum += pct;
      totalPctCount += 1;
      return {
        // uptime_state usa url como identificador — não há coluna `id`.
        id: String(r.url),
        // Só expomos o label amigável; nunca a URL/endpoint interno.
        label: (r.label as string | null) ?? "Recurso",
        category: (r.category as string | null) ?? null,
        isUp: !!r.is_up,
        paused: !!r.paused,
        since: (r.since as string | null) ?? null,
        lastCheckAt: (r.last_check_at as string | null) ?? null,
        uptime24hPct: Math.round(pct * 100) / 100,
        consecutiveFailures: Number(r.consecutive_failures ?? 0),
      };
    });


    const active = checks.filter((c) => !c.paused);
    const up = active.filter((c) => c.isUp).length;
    const down = active.length - up;
    const paused = checks.length - active.length;
    const openIncidents = incidents?.length ?? 0;
    const overallOk = down === 0 && openIncidents === 0;

    return {
      overallOk,
      total: active.length,
      up,
      down,
      paused,
      openIncidents,
      uptime24hPct: totalPctCount === 0 ? 100 : Math.round((totalPctSum / totalPctCount) * 100) / 100,
      checkedAt: new Date().toISOString(),
      checks,
    };
  });

const TriggerSchema = z.object({
  failingLabels: z.array(z.string().max(200)).max(50).default([]),
  note: z.string().max(500).nullable().optional(),
});

export const triggerImpulsionitoFix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TriggerSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const files = data.failingLabels.slice(0, 50).map((l) => `auditoria://${l}`);
    const note =
      data.note ??
      `Auditoria: ${data.failingLabels.length} recurso(s) inativo(s) encaminhado(s) ao Impulsionito.`;
    const { data: row, error } = await supabase
      .from("automation_approvals")
      .insert({
        user_id: userId,
        tenant_slug: null,
        mode: "producao",
        regua: "auditoria-corrigir",
        action: "test",
        files,
        note,
        status: "pending",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, createdAt: row.created_at };
  });
