import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Education & Polos Cockpit — Fase 90.
 * Polos, leads, matrículas, evasão, white-label e role assignments.
 */
export const getEducationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [pRes, lRes, mRes, raRes, wlRes] = await Promise.all([
      supabaseAdmin.from("educ_polos").select("id, company_id, codigo, nome, cidade, estado, status, capacidade, meta_matriculas_mes, cursos_ofertados, created_at").limit(20000),
      supabaseAdmin.from("educ_leads").select("id, company_id, polo_id, consultor_id, curso_interesse, origem, campanha, stage, valor_estimado, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("educ_matriculas").select("id, company_id, polo_id, lead_id, curso, status, status_financeiro, valor_mensalidade, matriculado_em, evasao_em, created_at").limit(200000),
      supabaseAdmin.from("educ_role_assignments").select("id, user_id, company_id, polo_id, role, created_at").limit(50000),
      supabaseAdmin.from("educ_white_label_branding").select("id, company_id, nome_exibicao, dominio_personalizado, ativo, created_at, updated_at").limit(5000),
    ]);

    const err = pRes.error || lRes.error || mRes.error || raRes.error || wlRes.error;
    if (err) throw new Error(err.message);

    const p = pRes.data ?? [];
    const l = lRes.data ?? [];
    const m = mRes.data ?? [];
    const ra = raRes.data ?? [];
    const wl = wlRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const map = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; map.set(k, (map.get(k) ?? 0) + 1); }
      return Array.from(map.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Polos
    const pActive = p.filter((r: any) => String(r.status).toLowerCase() === "ativo" || String(r.status).toLowerCase() === "active").length;
    const pCapacity = p.reduce((a: number, r: any) => a + (Number(r.capacidade) || 0), 0);
    const pGoalMonthly = p.reduce((a: number, r: any) => a + (Number(r.meta_matriculas_mes) || 0), 0);
    const pByState = countBy(p, (r: any) => r.estado).slice(0, 12);
    const pByStatus = countBy(p, (r: any) => r.status);

    // Leads (period)
    const leadsTotal = l.length;
    const leadValueSum = l.reduce((a: number, r: any) => a + (Number(r.valor_estimado) || 0), 0);
    const leadByStage = countBy(l, (r: any) => r.stage);
    const leadByOrigem = countBy(l, (r: any) => r.origem).slice(0, 10);
    const leadByCampanha = countBy(l, (r: any) => r.campanha).slice(0, 10);
    const leadByCurso = countBy(l, (r: any) => r.curso_interesse).slice(0, 10);

    // Matrículas
    const sinceMs = Date.now() - data.days * 86400000;
    const mPeriod = m.filter((r: any) => r.matriculado_em && new Date(r.matriculado_em).getTime() >= sinceMs);
    const mActive = m.filter((r: any) => String(r.status).toLowerCase() === "ativa" || String(r.status).toLowerCase() === "active").length;
    const mEvaded = m.filter((r: any) => r.evasao_em).length;
    const mEvadedPeriod = m.filter((r: any) => r.evasao_em && new Date(r.evasao_em).getTime() >= sinceMs).length;
    const mrr = m.filter((r: any) => !r.evasao_em).reduce((a: number, r: any) => a + (Number(r.valor_mensalidade) || 0), 0);
    const evasionRate = m.length > 0 ? (mEvaded / m.length) * 100 : 0;
    const mByStatus = countBy(m, (r: any) => r.status);
    const mByFin = countBy(m, (r: any) => r.status_financeiro);
    const mByCurso = countBy(m, (r: any) => r.curso).slice(0, 10);

    // Conversão lead → matrícula (período)
    const leadIdsPeriod = new Set(l.map((r: any) => r.id));
    const convertedLeads = m.filter((r: any) => r.lead_id && leadIdsPeriod.has(r.lead_id)).length;
    const convRate = leadsTotal > 0 ? (convertedLeads / leadsTotal) * 100 : 0;

    // Top polos por matrículas no período
    const poloNome = new Map<string, string>(p.map((r: any) => [r.id, `${r.nome} (${r.cidade}/${r.estado})`]));
    const mByPolo = new Map<string, { count: number; mrr: number }>();
    for (const r of mPeriod as any[]) {
      const k = r.polo_id ?? "—";
      const cur = mByPolo.get(k) ?? { count: 0, mrr: 0 };
      cur.count += 1; cur.mrr += Number(r.valor_mensalidade) || 0;
      mByPolo.set(k, cur);
    }
    const topPolos = Array.from(mByPolo.entries())
      .map(([id, v]) => ({ id, label: poloNome.get(id) ?? id.slice(0, 8), count: v.count, mrr: v.mrr }))
      .sort((a, b) => b.count - a.count).slice(0, 12);

    // Roles
    const raByRole = countBy(ra, (r: any) => r.role);

    // White-label
    const wlActive = wl.filter((r: any) => r.ativo).length;
    const wlWithDomain = wl.filter((r: any) => r.dominio_personalizado).length;

    return {
      days: data.days,
      polos: { total: p.length, active: pActive, capacity: pCapacity, goalMonthly: pGoalMonthly, byState: pByState, byStatus: pByStatus },
      leads: { total: leadsTotal, valueSum: leadValueSum, byStage: leadByStage, byOrigem: leadByOrigem, byCampanha: leadByCampanha, byCurso: leadByCurso, convRate, converted: convertedLeads },
      matriculas: {
        total: m.length, active: mActive, evaded: mEvaded, evadedPeriod: mEvadedPeriod, evasionRate,
        mrr, newInPeriod: mPeriod.length, byStatus: mByStatus, byFinanceiro: mByFin, byCurso: mByCurso, topPolos,
      },
      roles: { total: ra.length, byRole: raByRole },
      whitelabel: { total: wl.length, active: wlActive, withDomain: wlWithDomain },
    };
  });
