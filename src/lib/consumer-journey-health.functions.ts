import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Consumer Journey & Membership Cockpit — Fase 83.
 * Camada B2C do core Impulsionando: perfis, memberships, faturas, favoritos,
 * reviews do ecossistema, consents LGPD, preferências de notificação,
 * pedidos de exportação/deleção e supressões de email.
 */
export const getConsumerJourneyHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [pfRes, msRes, ivRes, fvRes, rvRes, lgRes, npRes, exRes, dlRes, suRes, cuRes] = await Promise.all([
      supabaseAdmin.from("consumer_profiles").select("id, user_id, state, city, marketing_optin, current_level, points_balance, total_savings_cents, total_visits, interests_tags, created_at").limit(50000),
      supabaseAdmin.from("consumer_memberships").select("id, user_id, plan, status, amount_cents, cycle, started_at, current_period_end, cancel_at_period_end, canceled_at, created_at").limit(50000),
      supabaseAdmin.from("consumer_membership_invoices").select("id, status, amount_cents, due_date, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("consumer_favorites").select("id, user_id, company_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("ecosystem_reviews").select("id, company_id, stars, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("lgpd_consents").select("id, consent_type, accepted, accepted_at, revoked_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("notification_preferences").select("id, category, channel, enabled").limit(50000),
      supabaseAdmin.from("data_export_requests").select("id, status, processed_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("data_deletion_requests").select("id, status, scheduled_for, processed_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("suppressed_emails").select("id, reason, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("customers").select("id, company_id, is_active, anonymized_at, patient_user_id, patient_activated_at, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = pfRes.error || msRes.error || ivRes.error || fvRes.error || rvRes.error || lgRes.error || npRes.error || exRes.error || dlRes.error || suRes.error || cuRes.error;
    if (err) throw new Error(err.message);

    const pf = pfRes.data ?? [];
    const ms = msRes.data ?? [];
    const iv = ivRes.data ?? [];
    const fv = fvRes.data ?? [];
    const rv = rvRes.data ?? [];
    const lg = lgRes.data ?? [];
    const np = npRes.data ?? [];
    const ex = exRes.data ?? [];
    const dl = dlRes.data ?? [];
    const su = suRes.data ?? [];
    const cu = cuRes.data ?? [];

    const bucket = <T,>(arr: T[], key: (x: T) => string | null | undefined, top = 12) => {
      const m = new Map<string, number>();
      for (const x of arr) { const k = (key(x) ?? "—") || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, top);
    };

    // Profiles
    const pfOptin = pf.filter((p: any) => p.marketing_optin).length;
    const pfWithGeo = pf.filter((p: any) => p.city || p.state).length;
    const pfByState = bucket(pf, (p: any) => p.state);
    const pfByLevel = bucket(pf, (p: any) => p.current_level);
    const pointsSum = pf.reduce((s, p: any) => s + Number(p.points_balance || 0), 0);
    const savingsSum = pf.reduce((s, p: any) => s + Number(p.total_savings_cents || 0), 0);
    const visitsSum = pf.reduce((s, p: any) => s + Number(p.total_visits || 0), 0);
    const tagMap = new Map<string, number>();
    for (const p of pf as any[]) {
      const tags: string[] = Array.isArray(p.interests_tags) ? p.interests_tags : [];
      for (const t of tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    }
    const topTags = Array.from(tagMap, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    // Memberships
    const msActive = ms.filter((m: any) => (m.status ?? "").toLowerCase() === "active").length;
    const msCanceled = ms.filter((m: any) => m.canceled_at).length;
    const msAtRisk = ms.filter((m: any) => m.cancel_at_period_end && !m.canceled_at).length;
    const msMrrCents = ms.filter((m: any) => (m.status ?? "").toLowerCase() === "active").reduce((s, m: any) => {
      const v = Number(m.amount_cents || 0);
      const cycle = (m.cycle ?? "monthly").toLowerCase();
      if (cycle === "yearly" || cycle === "annual") return s + v / 12;
      if (cycle === "weekly") return s + v * 4.33;
      return s + v;
    }, 0);
    const msByPlan = bucket(ms, (m: any) => m.plan);
    const msByStatus = bucket(ms, (m: any) => m.status);
    const msByCycle = bucket(ms, (m: any) => m.cycle);

    // Invoices
    const ivPaid = iv.filter((i: any) => i.paid_at).length;
    const ivOpen = iv.filter((i: any) => !i.paid_at && (i.status ?? "").toLowerCase() !== "canceled" && (i.status ?? "").toLowerCase() !== "failed").length;
    const ivOverdue = iv.filter((i: any) => !i.paid_at && i.due_date && new Date(i.due_date).getTime() < Date.now()).length;
    const ivRevenue = iv.filter((i: any) => i.paid_at).reduce((s, i: any) => s + Number(i.amount_cents || 0), 0);
    const ivByStatus = bucket(iv, (i: any) => i.status);

    // Favorites & reviews
    const fvUniqueUsers = new Set(fv.map((x: any) => x.user_id)).size;
    const fvByCompany = bucket(fv, (x: any) => x.company_id);
    const rvAvg = rv.length ? rv.reduce((s, r: any) => s + Number(r.stars || 0), 0) / rv.length : 0;
    const rvDist = bucket(rv, (r: any) => String(r.stars ?? "—"), 5);

    // LGPD & privacy
    const lgAccepted = lg.filter((l: any) => l.accepted).length;
    const lgRevoked = lg.filter((l: any) => l.revoked_at).length;
    const lgByType = bucket(lg, (l: any) => l.consent_type);
    const exPending = ex.filter((x: any) => !x.processed_at).length;
    const exDone = ex.filter((x: any) => x.processed_at).length;
    const dlPending = dl.filter((x: any) => !x.processed_at).length;
    const dlDone = dl.filter((x: any) => x.processed_at).length;
    const suByReason = bucket(su, (s: any) => s.reason);

    // Notification prefs
    const npEnabled = np.filter((n: any) => n.enabled).length;
    const npChannels = bucket(np, (n: any) => n.channel);
    const npCategories = bucket(np, (n: any) => n.category);

    // Customers (B2B side) — activations
    const cuActive = cu.filter((c: any) => c.is_active).length;
    const cuAnon = cu.filter((c: any) => c.anonymized_at).length;
    const cuInvited = cu.filter((c: any) => c.patient_user_id).length;
    const cuActivated = cu.filter((c: any) => c.patient_activated_at).length;
    const cuActivationRate = cuInvited ? cuActivated / cuInvited : 0;

    return {
      window: { days: data.days, sinceIso },
      generatedAt: new Date().toISOString(),
      profiles: {
        total: pf.length, optin: pfOptin, withGeo: pfWithGeo,
        pointsTotal: pointsSum, savingsCents: savingsSum, visitsTotal: visitsSum,
        byState: pfByState, byLevel: pfByLevel, topTags,
      },
      memberships: {
        total: ms.length, active: msActive, canceled: msCanceled, atRisk: msAtRisk,
        mrrCents: msMrrCents,
        byPlan: msByPlan, byStatus: msByStatus, byCycle: msByCycle,
      },
      invoices: { total: iv.length, paid: ivPaid, open: ivOpen, overdue: ivOverdue, revenueCents: ivRevenue, byStatus: ivByStatus },
      favorites: { total: fv.length, uniqueUsers: fvUniqueUsers, byCompany: fvByCompany },
      reviews: { total: rv.length, avgStars: rvAvg, distribution: rvDist },
      lgpd: { total: lg.length, accepted: lgAccepted, revoked: lgRevoked, byType: lgByType },
      exports: { total: ex.length, pending: exPending, done: exDone },
      deletions: { total: dl.length, pending: dlPending, done: dlDone },
      suppressed: { total: su.length, byReason: suByReason },
      preferences: { total: np.length, enabled: npEnabled, byChannel: npChannels, byCategory: npCategories },
      customers: { total: cu.length, active: cuActive, anonymized: cuAnon, invited: cuInvited, activated: cuActivated, activationRate: cuActivationRate },
    };
  });
