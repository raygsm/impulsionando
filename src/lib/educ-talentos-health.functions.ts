import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Educacional & Talentos Cockpit — Fase 48.
 * Funil educacional (leads → matrículas → mensalidades) e mercado de talentos
 * (vagas, candidatos, matches, contratações).
 */
export const getEducTalentosHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [leadsRes, matRes, polosRes, vagasRes, candRes, matchesRes] = await Promise.all([
      supabaseAdmin
        .from("educ_leads")
        .select("id, company_id, polo_id, consultor_id, curso_interesse, origem, campanha, stage, valor_estimado, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("educ_matriculas")
        .select("id, company_id, polo_id, lead_id, curso, status, status_financeiro, valor_mensalidade, matriculado_em, evasao_em, created_at")
        .limit(50000),
      supabaseAdmin
        .from("educ_polos")
        .select("id, company_id, codigo, nome, cidade, estado, status, capacidade, meta_matriculas_mes")
        .limit(5000),
      supabaseAdmin
        .from("talentos_vagas")
        .select("id, company_id, titulo, nicho, cargo, cidade, modelo_trabalho, faixa_salarial, ativa, created_at")
        .limit(20000),
      supabaseAdmin
        .from("talentos_candidatos")
        .select("id, nome, nicho, cidade, estado, modelo_trabalho, ativo, visivel_rede, created_at")
        .limit(50000),
      supabaseAdmin
        .from("talentos_matches")
        .select("id, company_id, candidato_id, vaga_id, score, stage, contratado_em, desligado_em, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
    ]);

    const err = leadsRes.error || matRes.error || polosRes.error || vagasRes.error || candRes.error || matchesRes.error;
    if (err) throw new Error(err.message);

    const leads = leadsRes.data ?? [];
    const matriculas = matRes.data ?? [];
    const polos = polosRes.data ?? [];
    const vagas = vagasRes.data ?? [];
    const candidatos = candRes.data ?? [];
    const matches = matchesRes.data ?? [];

    const num = (v: unknown) => Number(v ?? 0);
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();

    // ===== Educacional =====
    const totalLeads = leads.length;
    const stageMap = new Map<string, number>();
    for (const l of leads) {
      const s = l.stage ?? "novo";
      stageMap.set(s, (stageMap.get(s) ?? 0) + 1);
    }
    const leadStages = Array.from(stageMap.entries()).map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count);

    const origemMap = new Map<string, number>();
    for (const l of leads) {
      const o = l.origem ?? "direto";
      origemMap.set(o, (origemMap.get(o) ?? 0) + 1);
    }
    const leadOrigens = Array.from(origemMap.entries()).map(([origem, count]) => ({ origem, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const pipelineValue = sum(leads.map((l) => num(l.valor_estimado)));

    // Matrículas
    const M_ACTIVE = new Set(["ativa", "ativo", "active", "matriculado", "cursando"]);
    const M_EVADED = new Set(["evadido", "evadida", "trancada", "trancado", "cancelada", "cancelado"]);
    const M_COMPLETED = new Set(["concluida", "concluido", "formado", "formada"]);
    const matNew = matriculas.filter((m) => (m.matriculado_em ?? m.created_at ?? "") >= sinceIso).length;
    const matActive = matriculas.filter((m) => M_ACTIVE.has(lower(m.status))).length;
    const matEvaded = matriculas.filter((m) => M_EVADED.has(lower(m.status)) || m.evasao_em).length;
    const matCompleted = matriculas.filter((m) => M_COMPLETED.has(lower(m.status))).length;
    const totalMat = matriculas.length;
    const evasionRate = totalMat ? (matEvaded / totalMat) * 100 : 0;
    const conversionLeadMat = totalLeads ? (matNew / totalLeads) * 100 : 0;

    // MRR educacional
    const mrr = sum(matriculas.filter((m) => M_ACTIVE.has(lower(m.status))).map((m) => num(m.valor_mensalidade)));

    // Financeiro
    const F_INAD = new Set(["inadimplente", "atrasada", "atrasado", "overdue"]);
    const matInadimplentes = matriculas.filter((m) => F_INAD.has(lower(m.status_financeiro))).length;

    // Polos
    type PoloRow = { id: string; nome: string; cidade: string | null; estado: string | null; meta: number; matriculas: number; ativas: number; metaPct: number };
    const polosMap = new Map(polos.map((p) => [p.id, p]));
    const poloStats = new Map<string, PoloRow>();
    for (const p of polos) {
      poloStats.set(p.id, {
        id: p.id,
        nome: p.nome ?? p.codigo ?? p.id.slice(0, 8),
        cidade: p.cidade,
        estado: p.estado,
        meta: p.meta_matriculas_mes ?? 0,
        matriculas: 0,
        ativas: 0,
        metaPct: 0,
      });
    }
    for (const m of matriculas) {
      if (!m.polo_id) continue;
      let r = poloStats.get(m.polo_id);
      if (!r) {
        const p = polosMap.get(m.polo_id);
        r = { id: m.polo_id, nome: p?.nome ?? m.polo_id.slice(0, 8), cidade: p?.cidade ?? null, estado: p?.estado ?? null, meta: p?.meta_matriculas_mes ?? 0, matriculas: 0, ativas: 0, metaPct: 0 };
        poloStats.set(m.polo_id, r);
      }
      if ((m.matriculado_em ?? m.created_at ?? "") >= sinceIso) r.matriculas++;
      if (M_ACTIVE.has(lower(m.status))) r.ativas++;
    }
    const polosRanking = Array.from(poloStats.values())
      .map((r) => ({ ...r, metaPct: r.meta > 0 ? (r.matriculas / r.meta) * 100 : 0 }))
      .sort((a, b) => b.matriculas - a.matriculas)
      .slice(0, 20);

    const polosAtivos = polos.filter((p) => lower(p.status) === "ativo" || lower(p.status) === "active").length;

    // ===== Talentos =====
    const vagasAtivas = vagas.filter((v) => v.ativa).length;
    const candidatosAtivos = candidatos.filter((c) => c.ativo).length;
    const candidatosVisiveis = candidatos.filter((c) => c.visivel_rede).length;
    const newCandidatos = candidatos.filter((c) => (c.created_at ?? "") >= sinceIso).length;

    const totalMatches = matches.length;
    const contratados = matches.filter((m) => m.contratado_em).length;
    const desligados = matches.filter((m) => m.desligado_em).length;
    const matchHireRate = totalMatches ? (contratados / totalMatches) * 100 : 0;
    const avgScore = totalMatches ? matches.reduce((a, b) => a + num(b.score), 0) / totalMatches : 0;

    const matchStageMap = new Map<string, number>();
    for (const m of matches) {
      const s = m.stage ?? "novo";
      matchStageMap.set(s, (matchStageMap.get(s) ?? 0) + 1);
    }
    const matchStages = Array.from(matchStageMap.entries()).map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count);

    const nichoMap = new Map<string, number>();
    for (const v of vagas) {
      if (!v.ativa) continue;
      const n = v.nicho ?? "outros";
      nichoMap.set(n, (nichoMap.get(n) ?? 0) + 1);
    }
    const topNichos = Array.from(nichoMap.entries()).map(([nicho, count]) => ({ nicho, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // Match ratio (candidatos por vaga ativa)
    const matchRatio = vagasAtivas ? candidatosAtivos / vagasAtivas : 0;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      educ: {
        totalLeads,
        leadStages,
        leadOrigens,
        pipelineValue,
        totalMat,
        matNew,
        matActive,
        matEvaded,
        matCompleted,
        matInadimplentes,
        conversionLeadMat,
        evasionRate,
        mrr,
        polosAtivos,
        polosTotal: polos.length,
        polosRanking,
      },
      talentos: {
        vagasAtivas,
        vagasTotal: vagas.length,
        candidatosAtivos,
        candidatosVisiveis,
        candidatosTotal: candidatos.length,
        newCandidatos,
        totalMatches,
        contratados,
        desligados,
        matchHireRate,
        avgScore,
        matchRatio,
        matchStages,
        topNichos,
      },
    };
  });
