import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trial & Onboarding — Fase 103.
 * Consolida trial_subscriptions, trial_events, trial_abuse_index,
 * onboarding_checklist, onboarding_domain_requests, onboarding_email_requests,
 * demo_environments.
 */
export const getTrialOnboardingHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [tsRes, teRes, taiRes, ocRes, odrRes, oerRes, deRes] = await Promise.all([
      supabaseAdmin.from("trial_subscriptions").select("id, status, chosen_plan, source, started_at, ends_at, converted_at, suspended_at, cancelled_at, extended_days, setup_charged, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("trial_events").select("id, event_type, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("trial_abuse_index").select("id, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("onboarding_checklist").select("id, item_key, status, completed_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("onboarding_domain_requests").select("id, mode, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("onboarding_email_requests").select("id, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("demo_environments").select("id, niche, active, seed_volume").limit(5000),
    ]);

    const err = tsRes.error || teRes.error || taiRes.error || ocRes.error || odrRes.error || oerRes.error || deRes.error;
    if (err) throw new Error(err.message);

    const ts = tsRes.data ?? [];
    const te = teRes.data ?? [];
    const tai = taiRes.data ?? [];
    const oc = ocRes.data ?? [];
    const odr = odrRes.data ?? [];
    const oer = oerRes.data ?? [];
    const de = deRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const now = Date.now();

    // Trials
    const tsActive = ts.filter((x: any) => String(x.status) === "active").length;
    const tsConverted = ts.filter((x: any) => x.converted_at).length;
    const tsCancelled = ts.filter((x: any) => x.cancelled_at).length;
    const tsSuspended = ts.filter((x: any) => x.suspended_at).length;
    const tsExpiringSoon = ts.filter((x: any) => x.ends_at && !x.converted_at && !x.cancelled_at && new Date(x.ends_at).getTime() < now + 3 * 86400000 && new Date(x.ends_at).getTime() > now).length;
    const tsExpired = ts.filter((x: any) => x.ends_at && !x.converted_at && !x.cancelled_at && new Date(x.ends_at).getTime() < now).length;
    const tsConversionRate = ts.length ? (tsConverted / ts.length) * 100 : 0;
    const tsSetupCharged = ts.filter((x: any) => x.setup_charged).length;
    const tsByStatus = countBy(ts, (x: any) => x.status);
    const tsByPlan = countBy(ts, (x: any) => x.chosen_plan).slice(0, 15);
    const tsBySource = countBy(ts, (x: any) => x.source).slice(0, 15);

    // Trial events
    const teByType = countBy(te, (x: any) => x.event_type).slice(0, 15);

    // Onboarding checklist
    const ocCompleted = oc.filter((x: any) => x.completed_at || String(x.status) === "completed").length;
    const ocCompletionRate = oc.length ? (ocCompleted / oc.length) * 100 : 0;
    const ocByItem = countBy(oc, (x: any) => x.item_key).slice(0, 20);
    const ocByStatus = countBy(oc, (x: any) => x.status);

    // Domain/Email requests
    const odrPending = odr.filter((x: any) => ["pending","requested","review"].includes(String(x.status))).length;
    const odrByStatus = countBy(odr, (x: any) => x.status);
    const odrByMode = countBy(odr, (x: any) => x.mode);
    const oerPending = oer.filter((x: any) => ["pending","requested","review"].includes(String(x.status))).length;
    const oerByStatus = countBy(oer, (x: any) => x.status);

    // Demo envs
    const deActive = de.filter((x: any) => x.active).length;
    const deByNiche = countBy(de, (x: any) => x.niche).slice(0, 15);

    return {
      filters: { days: data.days, sinceIso },
      trials: { total: ts.length, active: tsActive, converted: tsConverted, cancelled: tsCancelled, suspended: tsSuspended, expired: tsExpired, expiringSoon: tsExpiringSoon, conversionRate: tsConversionRate, setupCharged: tsSetupCharged, byStatus: tsByStatus, byPlan: tsByPlan, bySource: tsBySource },
      events: { total: te.length, byType: teByType },
      abuse: { total: tai.length },
      checklist: { total: oc.length, completed: ocCompleted, completionRate: ocCompletionRate, byItem: ocByItem, byStatus: ocByStatus },
      domainRequests: { total: odr.length, pending: odrPending, byStatus: odrByStatus, byMode: odrByMode },
      emailRequests: { total: oer.length, pending: oerPending, byStatus: oerByStatus },
      demoEnvs: { total: de.length, active: deActive, byNiche: deByNiche },
    };
  });
