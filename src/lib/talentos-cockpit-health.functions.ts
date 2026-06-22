import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Talentos Cockpit — Fase 94.
 * Consolida candidatos, vagas, matches, currículos e settings de empresas
 * participantes do banco de talentos Impulsionando.
 */
export const getTalentosCockpitHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [candRes, vagaRes, matchRes, curRes, csRes] = await Promise.all([
      supabaseAdmin.from("talentos_candidatos").select("id, nicho, cidade, estado, modelo_trabalho, escolaridade, disponibilidade, faixa_etaria, ativo, visivel_rede, foto_url, video_url, created_at").limit(50000),
      supabaseAdmin.from("talentos_vagas").select("id, company_id, nicho, cargo, cidade, modelo_trabalho, experiencia_minima, escolaridade_minima, ativa, created_at").limit(20000),
      supabaseAdmin.from("talentos_matches").select("id, company_id, candidato_id, vaga_id, score, stage, created_at, updated_at, contratado_em, desligado_em").limit(100000),
      supabaseAdmin.from("talentos_curriculos").select("id, candidato_id, formato, processado_em, created_at").limit(50000),
      supabaseAdmin.from("talentos_company_settings").select("id, company_id, participa, receber_automatico, nicho, raio_km, created_at").limit(20000),
    ]);

    const err = candRes.error || vagaRes.error || matchRes.error || curRes.error || csRes.error;
    if (err) throw new Error(err.message);

    const cand = candRes.data ?? [];
    const vagas = vagaRes.data ?? [];
    const matches = matchRes.data ?? [];
    const curs = curRes.data ?? [];
    const cs = csRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Candidatos
    const candAtivos = cand.filter((r: any) => r.ativo).length;
    const candVisiveis = cand.filter((r: any) => r.visivel_rede).length;
    const candComFoto = cand.filter((r: any) => r.foto_url).length;
    const candComVideo = cand.filter((r: any) => r.video_url).length;
    const candNovos = cand.filter((r: any) => r.created_at >= sinceIso).length;
    const candByNicho = countBy(cand, (r: any) => r.nicho).slice(0, 10);
    const candByEstado = countBy(cand, (r: any) => r.estado).slice(0, 10);
    const candByCidade = countBy(cand, (r: any) => r.cidade).slice(0, 10);
    const candByModelo = countBy(cand, (r: any) => r.modelo_trabalho);
    const candByEsc = countBy(cand, (r: any) => r.escolaridade);
    const candByDispo = countBy(cand, (r: any) => r.disponibilidade);
    const candByFaixa = countBy(cand, (r: any) => String(r.faixa_etaria ?? ""));

    // Vagas
    const vagasAtivas = vagas.filter((r: any) => r.ativa).length;
    const vagasNovas = vagas.filter((r: any) => r.created_at >= sinceIso).length;
    const vagasByNicho = countBy(vagas, (r: any) => r.nicho).slice(0, 10);
    const vagasByCidade = countBy(vagas, (r: any) => r.cidade).slice(0, 10);
    const vagasByModelo = countBy(vagas, (r: any) => r.modelo_trabalho);
    const vagasByExp = countBy(vagas, (r: any) => r.experiencia_minima);
    const vagasByCargo = countBy(vagas, (r: any) => r.cargo).slice(0, 10);

    // Matches
    const matchesPeriodo = matches.filter((r: any) => r.created_at >= sinceIso);
    const matchesByStage = countBy(matches, (r: any) => r.stage);
    const matchesContratados = matches.filter((r: any) => r.contratado_em).length;
    const matchesDesligados = matches.filter((r: any) => r.desligado_em).length;
    const scores = matches.map((r: any) => Number(r.score) || 0).filter((n: number) => n > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((s: number, n: number) => s + n, 0) / scores.length : 0;
    const matchesPorVaga = vagas.length > 0 ? matches.length / vagas.length : 0;
    const taxaContratacao = matches.length > 0 ? (matchesContratados / matches.length) * 100 : 0;

    // Currículos
    const curProcessados = curs.filter((r: any) => r.processado_em).length;
    const curRate = curs.length > 0 ? (curProcessados / curs.length) * 100 : 0;
    const curByFormato = countBy(curs, (r: any) => r.formato);
    const candComCV = new Set(curs.map((r: any) => r.candidato_id)).size;
    const cobertura = cand.length > 0 ? (candComCV / cand.length) * 100 : 0;

    // Company settings
    const csParticipa = cs.filter((r: any) => r.participa).length;
    const csAuto = cs.filter((r: any) => r.receber_automatico).length;
    const csByNicho = countBy(cs, (r: any) => r.nicho).slice(0, 10);
    const raios = cs.map((r: any) => Number(r.raio_km) || 0).filter((n: number) => n > 0);
    const raioMedio = raios.length > 0 ? raios.reduce((s: number, n: number) => s + n, 0) / raios.length : 0;

    return {
      days: data.days,
      candidatos: {
        total: cand.length, ativos: candAtivos, visiveis: candVisiveis,
        comFoto: candComFoto, comVideo: candComVideo, novosPeriodo: candNovos,
        byNicho: candByNicho, byEstado: candByEstado, byCidade: candByCidade,
        byModelo: candByModelo, byEscolaridade: candByEsc, byDisponibilidade: candByDispo, byFaixaEtaria: candByFaixa,
      },
      vagas: {
        total: vagas.length, ativas: vagasAtivas, novasPeriodo: vagasNovas,
        byNicho: vagasByNicho, byCidade: vagasByCidade, byModelo: vagasByModelo,
        byExperiencia: vagasByExp, byCargo: vagasByCargo,
      },
      matches: {
        total: matches.length, noPeriodo: matchesPeriodo.length,
        contratados: matchesContratados, desligados: matchesDesligados,
        scoreMedio, matchesPorVaga, taxaContratacao,
        byStage: matchesByStage,
      },
      curriculos: {
        total: curs.length, processados: curProcessados, processRate: curRate,
        coberturaCandidatos: cobertura, byFormato: curByFormato,
      },
      empresas: {
        total: cs.length, participantes: csParticipa, comRecebimentoAuto: csAuto,
        raioMedioKm: raioMedio, byNicho: csByNicho,
      },
    };
  });
