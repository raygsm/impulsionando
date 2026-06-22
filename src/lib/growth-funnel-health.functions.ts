import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Growth Funnel Cockpit — Fase 81.
 * Aplica a ótica do Funil Impulsionando (captar→converter→relacionar→reter→expandir)
 * a marketing_leads, CRM, demo journey e fila de dispatch do funil.
 */
export const getGrowthFunnelHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [mlRes, clRes, coRes, caRes, cpRes, csRes, frRes, fqRes, dlRes, dsRes, daRes, dvRes, drRes] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("id, source, status, recommended_plan, utm_source, utm_medium, utm_campaign, assigned_to, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_leads").select("id, company_id, source, status, score, owner_user_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_opportunities").select("id, company_id, status, value, currency, expected_close_at, closed_at, lost_reason, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_activities").select("id, activity_type, due_at, done_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_pipelines").select("id, name, is_default, is_active").limit(5000),
      supabaseAdmin.from("crm_stages").select("id, pipeline_id, name, stage_type, win_probability").limit(10000),
      supabaseAdmin.from("core_funnel_rules").select("id, stage, event_name, niche_slug, workflow_name, delay_minutes, active").limit(5000),
      supabaseAdmin.from("core_funnel_dispatch_queue").select("id, stage, status, attempts, scheduled_at, sent_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_leads").select("id, niche, status, origin, marketing_lead_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_sessions").select("id, niche_slug, started_at, ended_at, duration_seconds, score, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_actions").select("id, niche_slug, module, action_key, weight, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_visit_sessions").select("id, niche, abandoned, attempted_contract, converted_lead_id, duration_seconds, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_survey_responses").select("id, plan_interest, source_path, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = mlRes.error || clRes.error || coRes.error || caRes.error || cpRes.error || csRes.error || frRes.error || fqRes.error || dlRes.error || dsRes.error || daRes.error || dvRes.error || drRes.error;
    if (err) throw new Error(err.message);

    const ml = mlRes.data ?? [];
    const cl = clRes.data ?? [];
    const co = coRes.data ?? [];
    const ca = caRes.data ?? [];
    const cp = cpRes.data ?? [];
    const cs = csRes.data ?? [];
    const fr = frRes.data ?? [];
    const fq = fqRes.data ?? [];
    const dl = dlRes.data ?? [];
    const ds = dsRes.data ?? [];
    const da = daRes.data ?? [];
    const dv = dvRes.data ?? [];
    const dr = drRes.data ?? [];

    const bucket = <T,>(arr: T[], key: (x: T) => string, top = 12) => {
      const m = new Map<string, number>();
      for (const x of arr) { const k = key(x) || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, top);
    };

    // Marketing leads → CAPTAR
    const mlStatuses = bucket(ml, (m: any) => m.status);
    const mlSources = bucket(ml, (m: any) => m.source);
    const mlUtmSrc = bucket(ml, (m: any) => m.utm_source);
    const mlUtmCmp = bucket(ml, (m: any) => m.utm_campaign);
    const mlAssigned = ml.filter((m: any) => m.assigned_to).length;

    // CRM Leads → CONVERTER
    const clStatuses = bucket(cl, (c: any) => c.status);
    const clSources = bucket(cl, (c: any) => c.source);
    const clAvgScore = cl.length ? cl.reduce((s, c: any) => s + Number(c.score || 0), 0) / cl.length : 0;
    const clOwned = cl.filter((c: any) => c.owner_user_id).length;

    // Opportunities → RELACIONAR/CONVERTER (GMV/pipeline)
    const opStatuses = bucket(co, (o: any) => o.status);
    const opTotalValue = co.reduce((s, o: any) => s + Number(o.value || 0), 0);
    const opWon = co.filter((o: any) => (o.status ?? "").toLowerCase() === "won" || o.closed_at);
    const opWonValue = opWon.reduce((s, o: any) => s + Number(o.value || 0), 0);
    const opLost = co.filter((o: any) => (o.status ?? "").toLowerCase() === "lost");
    const opLostReasons = bucket(opLost, (o: any) => o.lost_reason);
    const opOpenValue = co.filter((o: any) => !o.closed_at && (o.status ?? "").toLowerCase() !== "lost").reduce((s, o: any) => s + Number(o.value || 0), 0);

    // Activities → relacionar
    const caTypes = bucket(ca, (a: any) => a.activity_type);
    const caDone = ca.filter((a: any) => a.done_at).length;
    const caPending = ca.filter((a: any) => !a.done_at).length;

    // Funnel rules + dispatch → automação por stage
    const frByStage = bucket(fr, (r: any) => r.stage);
    const frActive = fr.filter((r: any) => r.active).length;
    const frByNiche = bucket(fr, (r: any) => r.niche_slug);
    const fqByStage = bucket(fq, (q: any) => q.stage);
    const fqByStatus = bucket(fq, (q: any) => q.status);
    const fqSent = fq.filter((q: any) => q.sent_at).length;
    const fqFailed = fq.filter((q: any) => (q.status ?? "").toLowerCase() === "failed" || (q.attempts ?? 0) >= 3).length;
    const fqPending = fq.filter((q: any) => !q.sent_at && (q.status ?? "").toLowerCase() !== "failed").length;

    // Demo funnel → captar → converter (lead)
    const dvTotal = dv.length;
    const dvAbandoned = dv.filter((v: any) => v.abandoned).length;
    const dvAttempted = dv.filter((v: any) => v.attempted_contract).length;
    const dvConverted = dv.filter((v: any) => v.converted_lead_id).length;
    const dvAvgDuration = dv.length ? dv.reduce((s, v: any) => s + Number(v.duration_seconds || 0), 0) / dv.length : 0;
    const dvByNiche = bucket(dv, (v: any) => v.niche);

    const dsAvgScore = ds.length ? ds.reduce((s, x: any) => s + Number(x.score || 0), 0) / ds.length : 0;
    const dsAvgDuration = ds.length ? ds.reduce((s, x: any) => s + Number(x.duration_seconds || 0), 0) / ds.length : 0;
    const dlByStatus = bucket(dl, (l: any) => l.status);
    const dlByNiche = bucket(dl, (l: any) => l.niche);
    const daByModule = bucket(da, (a: any) => a.module);
    const drByPlan = bucket(dr, (r: any) => r.plan_interest);

    // Funnel conversion rates
    const captacaoTotal = ml.length + dvTotal;
    const leadsCrm = cl.length;
    const oportunidades = co.length;
    const ganhos = opWon.length;
    const convVisitToLead = dvTotal ? dvConverted / dvTotal : 0;
    const convLeadToOpp = leadsCrm ? oportunidades / leadsCrm : 0;
    const convOppToWin = oportunidades ? ganhos / oportunidades : 0;
    const winRate = oportunidades ? ganhos / oportunidades : 0;

    return {
      window: { days: data.days, sinceIso },
      generatedAt: new Date().toISOString(),
      funnel: {
        captacaoTotal,
        marketingLeads: ml.length,
        demoVisits: dvTotal,
        crmLeads: leadsCrm,
        opportunities: oportunidades,
        won: ganhos,
        lost: opLost.length,
        winRate,
        convVisitToLead,
        convLeadToOpp,
        convOppToWin,
        gmvOpen: opOpenValue,
        gmvWon: opWonValue,
        gmvTotal: opTotalValue,
      },
      marketing: { total: ml.length, assigned: mlAssigned, statuses: mlStatuses, sources: mlSources, utmSources: mlUtmSrc, utmCampaigns: mlUtmCmp },
      crm: { leads: cl.length, owned: clOwned, avgScore: clAvgScore, leadStatuses: clStatuses, leadSources: clSources, opportunityStatuses: opStatuses, lostReasons: opLostReasons, pipelines: cp.length, activePipelines: cp.filter((p: any) => p.is_active).length, stages: cs.length },
      activities: { total: ca.length, done: caDone, pending: caPending, types: caTypes },
      funnelRules: { total: fr.length, active: frActive, byStage: frByStage, byNiche: frByNiche },
      funnelQueue: { total: fq.length, sent: fqSent, pending: fqPending, failed: fqFailed, byStage: fqByStage, byStatus: fqByStatus },
      demo: {
        visits: dvTotal,
        abandoned: dvAbandoned,
        attempted: dvAttempted,
        converted: dvConverted,
        avgDurationSec: dvAvgDuration,
        byNiche: dvByNiche,
        sessions: ds.length,
        avgScore: dsAvgScore,
        avgSessionSec: dsAvgDuration,
        leads: dl.length,
        leadsByStatus: dlByStatus,
        leadsByNiche: dlByNiche,
        actions: da.length,
        actionsByModule: daByModule,
        surveys: dr.length,
        surveyByPlan: drByPlan,
      },
    };
  });
