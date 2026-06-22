import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * CRM & Funil Cockpit — Fase 97.
 * Captação→Conversão do funil Impulsionando: marketing_leads, crm_leads,
 * crm_pipelines/stages, crm_opportunities, crm_activities.
 */
export const getCrmFunnelHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [mlRes, ldRes, ppRes, stRes, opRes, acRes] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("id, company_id, source, status, niche_code, utm_source, utm_medium, utm_campaign, created_at, converted_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("crm_leads").select("id, company_id, source, status, owner_id, score, created_at, converted_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("crm_pipelines").select("id, company_id, name, is_active, created_at").limit(20000),
      supabaseAdmin.from("crm_stages").select("id, company_id, pipeline_id, name, position, probability, is_won, is_lost").limit(50000),
      supabaseAdmin.from("crm_opportunities").select("id, company_id, pipeline_id, stage_id, owner_id, value, status, created_at, closed_at, won_at, lost_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("crm_activities").select("id, company_id, kind, status, owner_id, due_at, completed_at, created_at").gte("created_at", sinceIso).limit(200000),
    ]);

    const err = mlRes.error || ldRes.error || ppRes.error || stRes.error || opRes.error || acRes.error;
    if (err) throw new Error(err.message);

    const ml = mlRes.data ?? [];
    const ld = ldRes.data ?? [];
    const pp = ppRes.data ?? [];
    const st = stRes.data ?? [];
    const op = opRes.data ?? [];
    const ac = acRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const sum = (rows: any[], f: string) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
    const stageNameById = new Map(st.map((s: any) => [s.id, s.name]));
    const pipelineNameById = new Map(pp.map((p: any) => [p.id, p.name]));

    // Marketing leads
    const mlTotal = ml.length;
    const mlConverted = ml.filter((r: any) => r.converted_at).length;
    const mlConvRate = mlTotal ? (mlConverted / mlTotal) * 100 : 0;
    const mlBySource = countBy(ml, (r: any) => r.source).slice(0, 15);
    const mlByStatus = countBy(ml, (r: any) => r.status);
    const mlByNiche = countBy(ml, (r: any) => r.niche_code).slice(0, 15);
    const mlByUtmSource = countBy(ml, (r: any) => r.utm_source).slice(0, 10);
    const mlByUtmCampaign = countBy(ml, (r: any) => r.utm_campaign).slice(0, 10);

    // CRM leads
    const ldTotal = ld.length;
    const ldConverted = ld.filter((r: any) => r.converted_at).length;
    const ldConvRate = ldTotal ? (ldConverted / ldTotal) * 100 : 0;
    const ldByStatus = countBy(ld, (r: any) => r.status);
    const ldBySource = countBy(ld, (r: any) => r.source).slice(0, 15);
    const ldAvgScore = ld.length ? sum(ld, "score") / ld.length : 0;
    const ldByOwner = countBy(ld, (r: any) => r.owner_id).slice(0, 10);

    // Pipelines & stages
    const ppActive = pp.filter((p: any) => p.is_active).length;
    const stWon = st.filter((s: any) => s.is_won).length;
    const stLost = st.filter((s: any) => s.is_lost).length;

    // Opportunities
    const opTotal = op.length;
    const opCompanies = new Set(op.map((r: any) => r.company_id)).size;
    const opOpen = op.filter((r: any) => !r.closed_at && !["won","lost","closed"].includes(String(r.status))).length;
    const opWon = op.filter((r: any) => r.won_at || String(r.status) === "won").length;
    const opLost = op.filter((r: any) => r.lost_at || String(r.status) === "lost").length;
    const opWinRate = (opWon + opLost) ? (opWon / (opWon + opLost)) * 100 : 0;
    const opGrossValue = sum(op, "value");
    const opWonValue = sum(op.filter((r: any) => r.won_at || String(r.status) === "won"), "value");
    const opAvgTicket = opWon ? opWonValue / opWon : 0;
    const opCycleDays = (() => {
      const arr = op.filter((r: any) => r.won_at && r.created_at).map((r: any) =>
        (new Date(r.won_at).getTime() - new Date(r.created_at).getTime()) / 86400000
      );
      return arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    })();
    const opByStage = countBy(op, (r: any) => stageNameById.get(r.stage_id) as string | undefined).slice(0, 15);
    const opByPipeline = countBy(op, (r: any) => pipelineNameById.get(r.pipeline_id) as string | undefined).slice(0, 10);
    const opByOwner = countBy(op, (r: any) => r.owner_id).slice(0, 10);
    const opByStatus = countBy(op, (r: any) => r.status);

    // Activities
    const acTotal = ac.length;
    const acCompleted = ac.filter((r: any) => r.completed_at).length;
    const acOverdue = ac.filter((r: any) => !r.completed_at && r.due_at && r.due_at < new Date().toISOString()).length;
    const acCompletionRate = acTotal ? (acCompleted / acTotal) * 100 : 0;
    const acByKind = countBy(ac, (r: any) => r.kind);
    const acByStatus = countBy(ac, (r: any) => r.status);
    const acByOwner = countBy(ac, (r: any) => r.owner_id).slice(0, 10);

    return {
      windowDays: data.days,
      marketingLeads: { total: mlTotal, converted: mlConverted, convRate: mlConvRate, bySource: mlBySource, byStatus: mlByStatus, byNiche: mlByNiche, byUtmSource: mlByUtmSource, byUtmCampaign: mlByUtmCampaign },
      crmLeads: { total: ldTotal, converted: ldConverted, convRate: ldConvRate, avgScore: ldAvgScore, byStatus: ldByStatus, bySource: ldBySource, byOwner: ldByOwner },
      pipelines: { total: pp.length, active: ppActive, stagesTotal: st.length, stagesWon: stWon, stagesLost: stLost },
      opportunities: {
        total: opTotal, companies: opCompanies, open: opOpen, won: opWon, lost: opLost,
        winRate: opWinRate, grossValueBRL: opGrossValue, wonValueBRL: opWonValue, avgTicketBRL: opAvgTicket,
        avgCycleDays: opCycleDays,
        byStage: opByStage, byPipeline: opByPipeline, byOwner: opByOwner, byStatus: opByStatus,
      },
      activities: {
        total: acTotal, completed: acCompleted, overdue: acOverdue, completionRate: acCompletionRate,
        byKind: acByKind, byStatus: acByStatus, byOwner: acByOwner,
      },
    };
  });
