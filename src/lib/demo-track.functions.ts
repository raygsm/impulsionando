import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Demo profissional por nicho — tracking de sessão/ações e cálculo de score.
 *
 * Tabelas: demo_sessions, demo_actions. Função: demo_score(uuid) -> int 0..100.
 *
 * - startDemoSession: cria sessão para o nicho (idempotente por (user, niche, dia)).
 * - logDemoAction: registra ação dentro da sessão com peso para o score.
 * - endDemoSession: marca ended_at e snapshot do score.
 * - fetchDemoInsights: painel staff Impulsionando com sessões, scores e funil por nicho.
 */

const NICHOS = [
  "eventos", "saude", "bares", "ecommerce",
  "imobiliaria", "servicos", "comunidade", "cervejarias",
  "fitness", "estetica", "generico",
] as const;

const StartInput = z.object({
  nicheSlug: z.enum(NICHOS),
  companyId: z.string().uuid().optional(),
  userAgent: z.string().max(500).optional(),
});

export const startDemoSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Reaproveita sessão aberta nas últimas 2h (mesmo nicho/usuário)
    const since = new Date(Date.now() - 2 * 3600_000).toISOString();
    const { data: existing } = await supabase
      .from("demo_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("niche_slug", data.nicheSlug)
      .is("ended_at", null)
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) return { sessionId: existing.id, reused: true };

    const { data: row, error } = await supabase
      .from("demo_sessions")
      .insert({
        user_id: userId,
        niche_slug: data.nicheSlug,
        company_id: data.companyId ?? null,
        user_agent: data.userAgent ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: row.id as string, reused: false };
  });

const ActionInput = z.object({
  sessionId: z.string().uuid(),
  module: z.string().min(1).max(40),
  actionKey: z.string().min(1).max(60),
  weight: z.number().int().min(0).max(20).default(1),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const logDemoAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sess } = await supabase
      .from("demo_sessions")
      .select("niche_slug,user_id")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!sess) throw new Error("Sessão não encontrada");
    if (sess.user_id !== userId) throw new Error("Sessão não pertence ao usuário");

    const { error } = await supabase.from("demo_actions").insert({
      session_id: data.sessionId,
      user_id: userId,
      niche_slug: sess.niche_slug,
      module: data.module,
      action_key: data.actionKey,
      weight: data.weight,
      payload: (data.payload ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const EndInput = z.object({ sessionId: z.string().uuid() });

export const endDemoSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EndInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: score } = await supabase.rpc("demo_score" as never, {
      _session_id: data.sessionId,
    } as never);
    const scoreNum = typeof score === "number" ? score : Number(score ?? 0);
    const { error } = await supabase
      .from("demo_sessions")
      .update({ ended_at: new Date().toISOString(), score: scoreNum })
      .eq("id", data.sessionId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, score: scoreNum };
  });

/** Painel staff: agrega sessões, scores médios e funil por nicho/módulo. */
export const fetchDemoInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ days: z.number().int().min(1).max(180).default(30) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, {
      _user: userId,
    } as never);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando");

    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: sessions }, { data: actions }] = await Promise.all([
      supabaseAdmin
        .from("demo_sessions")
        .select("id,niche_slug,user_id,started_at,ended_at,duration_seconds,score")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("demo_actions")
        .select("session_id,niche_slug,module,action_key,weight,created_at")
        .gte("created_at", since)
        .limit(5000),
    ]);

    type S = NonNullable<typeof sessions>[number];
    type A = NonNullable<typeof actions>[number];

    const byNiche: Record<string, {
      sessions: number; finished: number; avgScore: number;
      avgDurationSec: number; actions: number;
      topModules: Array<{ module: string; count: number }>;
    }> = {};

    const groupedActions: Record<string, Record<string, number>> = {};
    for (const a of (actions ?? []) as A[]) {
      groupedActions[a.niche_slug] ??= {};
      groupedActions[a.niche_slug][a.module] = (groupedActions[a.niche_slug][a.module] ?? 0) + 1;
    }

    for (const s of (sessions ?? []) as S[]) {
      byNiche[s.niche_slug] ??= {
        sessions: 0, finished: 0, avgScore: 0,
        avgDurationSec: 0, actions: 0, topModules: [],
      };
      const b = byNiche[s.niche_slug];
      b.sessions++;
      if (s.ended_at) b.finished++;
      b.avgScore += s.score ?? 0;
      b.avgDurationSec += s.duration_seconds ?? 0;
    }
    for (const slug of Object.keys(byNiche)) {
      const b = byNiche[slug];
      const finishedDiv = Math.max(1, b.finished);
      b.avgScore = Math.round(b.avgScore / finishedDiv);
      b.avgDurationSec = Math.round(b.avgDurationSec / finishedDiv);
      const mods = groupedActions[slug] ?? {};
      b.actions = Object.values(mods).reduce((s, n) => s + n, 0);
      b.topModules = Object.entries(mods)
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    return {
      window: { since, days: data.days },
      totals: {
        sessions: sessions?.length ?? 0,
        actions: actions?.length ?? 0,
        niches: Object.keys(byNiche).length,
      },
      byNiche,
      recent: (sessions ?? []).slice(0, 50),
    };
  });
