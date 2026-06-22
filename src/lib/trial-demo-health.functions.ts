import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trial & Demo Governance Cockpit — Fase 58.
 * Trials ativos/convertidos, abuso, sessões demo, score, captura de leads.
 */
export const getTrialDemoHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const today = new Date().toISOString();

    const [trialsRes, tEvRes, abuseRes, dSessRes, dLeadsRes, dEnvRes, dActRes, dVisRes, dSurvRes] = await Promise.all([
      supabaseAdmin.from("trial_subscriptions").select("id, chosen_plan, status, started_at, ends_at, converted_at, suspended_at, cancelled_at, extended_days, source, created_at").limit(50000),
      supabaseAdmin.from("trial_events").select("id, event_type, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("trial_abuse_index").select("id, email_hash, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("demo_sessions").select("id, niche_slug, duration_seconds, score, started_at, ended_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_leads").select("id, niche, status, origin, marketing_lead_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_environments").select("id, niche, active").limit(2000),
      supabaseAdmin.from("demo_actions").select("id, niche_slug, module, action_key, weight, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("demo_visit_sessions").select("id, niche, duration_seconds, attempted_contract, abandoned, converted_lead_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("demo_survey_responses").select("id, plan_interest, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = trialsRes.error || tEvRes.error || abuseRes.error || dSessRes.error || dLeadsRes.error || dEnvRes.error || dActRes.error || dVisRes.error || dSurvRes.error;
    if (err) throw new Error(err.message);

    const trials = trialsRes.data ?? [];
    const events = tEvRes.data ?? [];
    const abuse = abuseRes.data ?? [];
    const sessions = dSessRes.data ?? [];
    const leads = dLeadsRes.data ?? [];
    const envs = dEnvRes.data ?? [];
    const actions = dActRes.data ?? [];
    const visits = dVisRes.data ?? [];
    const surveys = dSurvRes.data ?? [];

    // Trials
    const trialsNew = trials.filter((t) => t.created_at >= sinceIso);
    const trialsActive = trials.filter((t) => t.status === "ativo" || (t.ends_at && t.ends_at >= today && !t.cancelled_at && !t.suspended_at && !t.converted_at));
    const trialsConverted = trials.filter((t) => !!t.converted_at);
    const trialsSuspended = trials.filter((t) => !!t.suspended_at);
    const trialsCancelled = trials.filter((t) => !!t.cancelled_at);
    const trialsExpiringSoon = trials.filter((t) => t.ends_at && t.ends_at >= today && t.ends_at <= new Date(Date.now() + 7 * 86400000).toISOString() && !t.cancelled_at && !t.converted_at);
    const conversionRate = trials.length ? (trialsConverted.length / trials.length) * 100 : 0;

    const planMap = new Map<string, number>();
    for (const t of trials) { const k = t.chosen_plan || "—"; planMap.set(k, (planMap.get(k) ?? 0) + 1); }
    const planDist = Array.from(planMap, ([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);

    // Demo
    const avgScore = sessions.length ? sessions.reduce((s, x) => s + Number(x.score || 0), 0) / sessions.length : 0;
    const avgDuration = sessions.length ? sessions.reduce((s, x) => s + Number(x.duration_seconds || 0), 0) / sessions.length : 0;
    const totalActions = actions.length;
    const moduleMap = new Map<string, number>();
    for (const a of actions) { const k = a.module || "—"; moduleMap.set(k, (moduleMap.get(k) ?? 0) + 1); }
    const topModules = Array.from(moduleMap, ([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const nicheMap = new Map<string, number>();
    for (const s of sessions) { const k = s.niche_slug || "—"; nicheMap.set(k, (nicheMap.get(k) ?? 0) + 1); }
    const topNiches = Array.from(nicheMap, ([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count);

    const visitsConverted = visits.filter((v) => !!v.converted_lead_id).length;
    const visitsAbandoned = visits.filter((v) => v.abandoned).length;
    const visitConvRate = visits.length ? (visitsConverted / visits.length) * 100 : 0;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      trials: {
        total: trials.length,
        newInWindow: trialsNew.length,
        active: trialsActive.length,
        converted: trialsConverted.length,
        suspended: trialsSuspended.length,
        cancelled: trialsCancelled.length,
        expiringSoon: trialsExpiringSoon.length,
        conversionRate,
        events: events.length,
        abuseHits: abuse.length,
        plans: planDist,
      },
      demo: {
        sessions: sessions.length,
        avgScore,
        avgDurationMin: avgDuration / 60,
        actions: totalActions,
        environments: envs.length,
        activeEnvironments: envs.filter((e) => e.active).length,
        leads: leads.length,
        visits: visits.length,
        visitsConverted,
        visitsAbandoned,
        visitConvRate,
        surveys: surveys.length,
        topModules,
        topNiches,
      },
    };
  });
