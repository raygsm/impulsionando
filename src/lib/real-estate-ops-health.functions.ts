import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Real Estate Operations & Brokerage Cockpit — Fase 88.
 * Times comerciais, parceiros, distribuição de leads, proprietários,
 * documentos contratuais, blasts/disparos, mensageria interna, histórico,
 * matches automáticos e reviews de propriedades.
 */
export const getRealEstateOpsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [tRes, tmRes, pbRes, drRes, owRes, doRes, blRes, imRes, phRes, pmRes, prRes] = await Promise.all([
      supabaseAdmin.from("realestate_teams").select("id, company_id, name, leader_user_id, goal_monthly, status, created_at").limit(5000),
      supabaseAdmin.from("realestate_team_members").select("id, team_id, user_id, role, created_at").limit(20000),
      supabaseAdmin.from("realestate_partner_brokers").select("id, company_id, broker_name, status, contract_started_at, created_at").limit(10000),
      supabaseAdmin.from("realestate_distribution_rules").select("id, company_id, name, strategy, is_active, created_at").limit(2000),
      supabaseAdmin.from("realestate_owners").select("id, company_id, status, portal_invited_at, portal_last_login_at, preferred_contact, created_at").limit(50000),
      supabaseAdmin.from("realestate_documents").select("id, company_id, property_id, owner_id, contract_id, doc_type, status, expires_at, created_at").limit(50000),
      supabaseAdmin.from("realestate_blasts").select("id, company_id, channel, status, audience_count, enqueued_count, sent_count, failed_count, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_internal_messages").select("id, company_id, channel, request_kind, status, replies_count, last_reply_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_property_history").select("id, company_id, property_id, event_code, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("realestate_property_matches").select("id, company_id, property_id, intent_id, score, notified_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_property_reviews").select("id, company_id, property_id, action, previous_status, new_status, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = tRes.error || tmRes.error || pbRes.error || drRes.error || owRes.error || doRes.error || blRes.error || imRes.error || phRes.error || pmRes.error || prRes.error;
    if (err) throw new Error(err.message);

    const t = tRes.data ?? [];
    const tm = tmRes.data ?? [];
    const pb = pbRes.data ?? [];
    const dr = drRes.data ?? [];
    const ow = owRes.data ?? [];
    const docs = doRes.data ?? [];
    const bl = blRes.data ?? [];
    const im = imRes.data ?? [];
    const ph = phRes.data ?? [];
    const pm = pmRes.data ?? [];
    const pr = prRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Teams
    const tActive = t.filter((r: any) => String(r.status).toLowerCase() === "active").length;
    const tGoalSum = t.reduce((a: number, r: any) => a + (Number(r.goal_monthly) || 0), 0);
    const tByCompany = countBy(t, (r: any) => r.company_id);
    const teamCounts = new Map<string, number>();
    for (const m of tm) { teamCounts.set(m.team_id, (teamCounts.get(m.team_id) ?? 0) + 1); }
    const avgTeamSize = t.length ? Array.from(teamCounts.values()).reduce((a, b) => a + b, 0) / t.length : 0;
    const tmByRole = countBy(tm, (r: any) => r.role);

    // Partner brokers
    const pbByStatus = countBy(pb, (r: any) => r.status);
    const pbActive = pb.filter((r: any) => String(r.status).toLowerCase() === "active").length;

    // Distribution rules
    const drActive = dr.filter((r: any) => r.is_active).length;
    const drByStrategy = countBy(dr, (r: any) => r.strategy);

    // Owners
    const owByStatus = countBy(ow, (r: any) => r.status);
    const owInvited = ow.filter((r: any) => r.portal_invited_at).length;
    const owActivated = ow.filter((r: any) => r.portal_last_login_at).length;
    const owByContact = countBy(ow, (r: any) => r.preferred_contact);

    // Documents
    const docByType = countBy(docs, (r: any) => r.doc_type);
    const docByStatus = countBy(docs, (r: any) => r.status);
    const now = Date.now();
    const docExpiringSoon = docs.filter((r: any) => r.expires_at && new Date(r.expires_at).getTime() > now && new Date(r.expires_at).getTime() < now + 30 * 86400000).length;
    const docExpired = docs.filter((r: any) => r.expires_at && new Date(r.expires_at).getTime() < now).length;

    // Blasts
    const blByChannel = countBy(bl, (r: any) => r.channel);
    const blByStatus = countBy(bl, (r: any) => r.status);
    const blAudience = bl.reduce((a: number, r: any) => a + (r.audience_count ?? 0), 0);
    const blSent = bl.reduce((a: number, r: any) => a + (r.sent_count ?? 0), 0);
    const blFailed = bl.reduce((a: number, r: any) => a + (r.failed_count ?? 0), 0);

    // Internal messages
    const imByKind = countBy(im, (r: any) => r.request_kind);
    const imByStatus = countBy(im, (r: any) => r.status);
    const imByChannel = countBy(im, (r: any) => r.channel);
    const imOpen = im.filter((r: any) => ["open", "new", "pending", "assigned"].includes(String(r.status).toLowerCase())).length;

    // History
    const phByEvent = countBy(ph, (r: any) => r.event_code).slice(0, 12);

    // Matches
    const pmScores = pm.map((r: any) => Number(r.score) || 0).filter((n) => n > 0);
    const pmAvgScore = pmScores.length ? pmScores.reduce((a, b) => a + b, 0) / pmScores.length : 0;
    const pmNotified = pm.filter((r: any) => r.notified_at).length;
    const pmHighScore = pm.filter((r: any) => Number(r.score) >= 80).length;

    // Reviews
    const prByAction = countBy(pr, (r: any) => r.action);
    const prTransitions = countBy(pr, (r: any) => `${r.previous_status ?? "—"} → ${r.new_status ?? "—"}`).slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      teams: {
        total: t.length, active: tActive, avgSize: avgTeamSize,
        goalMonthlySum: tGoalSum, companies: tByCompany.length,
        membersTotal: tm.length, byRole: tmByRole,
      },
      partners: { total: pb.length, active: pbActive, byStatus: pbByStatus },
      distribution: { total: dr.length, active: drActive, byStrategy: drByStrategy },
      owners: {
        total: ow.length, invited: owInvited, activated: owActivated,
        activationRate: ow.length ? (owActivated / ow.length) * 100 : 0,
        byStatus: owByStatus, byContact: owByContact,
      },
      documents: {
        total: docs.length, expiringSoon: docExpiringSoon, expired: docExpired,
        byType: docByType, byStatus: docByStatus,
      },
      blasts: {
        total: bl.length, audience: blAudience, sent: blSent, failed: blFailed,
        deliveryRate: blAudience ? (blSent / blAudience) * 100 : 0,
        byChannel: blByChannel, byStatus: blByStatus,
      },
      messages: {
        total: im.length, open: imOpen,
        byChannel: imByChannel, byKind: imByKind, byStatus: imByStatus,
      },
      history: { total: ph.length, byEvent: phByEvent },
      matches: {
        total: pm.length, notified: pmNotified, highScore: pmHighScore,
        avgScore: pmAvgScore,
      },
      reviews: { total: pr.length, byAction: prByAction, transitions: prTransitions },
    };
  });
