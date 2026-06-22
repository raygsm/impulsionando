import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Imobiliário & Locação por Temporada — Fase 105.
 * Consolida realestate_* (properties, interests, visits, contracts, owners,
 * partner_brokers, matches, reviews, search_intents, blasts, financings,
 * lead_assignments) + marocas_* (apartments, maintenance_requests/quotes,
 * owner_statements, report_runs).
 */
export const getRealestateHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [prpRes, intRes, vstRes, ctrRes, ownRes, pbRes, mtcRes, revRes, siRes, blRes, finRes, laRes,
           apRes, mrRes, mqRes, osRes, rrRes] = await Promise.all([
      supabaseAdmin.from("realestate_properties").select("id, operation, property_type, status, sale_price, rent_price, city, is_published, approval_status, created_at").limit(100000),
      supabaseAdmin.from("realestate_interests").select("id, kind, status, source, responded_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("realestate_visits").select("id, status, scheduled_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_contracts").select("id, contract_type, status, value, signed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_owners").select("id, status, portal_invited_at, portal_last_login_at, created_at").limit(50000),
      supabaseAdmin.from("realestate_partner_brokers").select("id, status, created_at").limit(20000),
      supabaseAdmin.from("realestate_property_matches").select("id, score, notified_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("realestate_property_reviews").select("id, action, previous_status, new_status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_search_intents").select("id, operation, status, source, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_blasts").select("id, channel, status, audience_count, sent_count, failed_count, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_financings").select("id, status, financed_value, bank, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_lead_assignments").select("id, strategy, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_apartments").select("id, status, city, daily_rate").limit(20000),
      supabaseAdmin.from("marocas_maintenance_requests").select("id, status, priority, category, resolved_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_maintenance_quotes").select("id, status, amount, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_owner_statements").select("id, status, reference_month, gross_revenue, marocas_fee, expenses, net_payout, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("marocas_report_runs").select("id, status, total, done, late, error, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = prpRes.error || intRes.error || vstRes.error || ctrRes.error || ownRes.error || pbRes.error || mtcRes.error || revRes.error || siRes.error || blRes.error || finRes.error || laRes.error
              || apRes.error || mrRes.error || mqRes.error || osRes.error || rrRes.error;
    if (err) throw new Error(err.message);

    const prp = prpRes.data ?? []; const int = intRes.data ?? []; const vst = vstRes.data ?? [];
    const ctr = ctrRes.data ?? []; const own = ownRes.data ?? []; const pb = pbRes.data ?? [];
    const mtc = mtcRes.data ?? []; const rev = revRes.data ?? []; const si = siRes.data ?? [];
    const bl = blRes.data ?? []; const fin = finRes.data ?? []; const la = laRes.data ?? [];
    const ap = apRes.data ?? []; const mr = mrRes.data ?? []; const mq = mqRes.data ?? [];
    const os = osRes.data ?? []; const rr = rrRes.data ?? [];

    const sum = (rows: any[], key: string) => rows.reduce((a, r) => a + Number(r[key] ?? 0), 0);
    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const now = Date.now();

    // Imóveis
    const prpPublished = prp.filter((x: any) => x.is_published).length;
    const prpPending = prp.filter((x: any) => String(x.approval_status) === "pending").length;
    const prpForSale = prp.filter((x: any) => ["sale","both"].includes(String(x.operation))).length;
    const prpForRent = prp.filter((x: any) => ["rent","both"].includes(String(x.operation))).length;
    const prpByOperation = countBy(prp, (x: any) => x.operation);
    const prpByType = countBy(prp, (x: any) => x.property_type).slice(0, 15);
    const prpByStatus = countBy(prp, (x: any) => x.status);
    const prpByCity = countBy(prp, (x: any) => x.city).slice(0, 15);

    // Interesses
    const intResponded = int.filter((x: any) => x.responded_at).length;
    const intRespRate = int.length ? (intResponded / int.length) * 100 : 0;
    const intByKind = countBy(int, (x: any) => x.kind);
    const intByStatus = countBy(int, (x: any) => x.status);
    const intBySource = countBy(int, (x: any) => x.source).slice(0, 15);

    // Visitas
    const vstDone = vst.filter((x: any) => ["done","completed","realizada"].includes(String(x.status))).length;
    const vstNoShow = vst.filter((x: any) => ["no_show","cancelled"].includes(String(x.status))).length;
    const vstDoneRate = vst.length ? (vstDone / vst.length) * 100 : 0;
    const vstByStatus = countBy(vst, (x: any) => x.status);

    // Contratos
    const ctrSigned = ctr.filter((x: any) => x.signed_at).length;
    const ctrValue = sum(ctr.filter((x: any) => x.signed_at), "value");
    const ctrSignRate = ctr.length ? (ctrSigned / ctr.length) * 100 : 0;
    const ctrByType = countBy(ctr, (x: any) => x.contract_type);
    const ctrByStatus = countBy(ctr, (x: any) => x.status);

    // Owners
    const ownActive = own.filter((x: any) => String(x.status) === "active").length;
    const ownLogged = own.filter((x: any) => x.portal_last_login_at).length;
    const ownByStatus = countBy(own, (x: any) => x.status);

    // Matches & search intents
    const mtcNotified = mtc.filter((x: any) => x.notified_at).length;
    const avgScore = mtc.length ? mtc.reduce((a: number, b: any) => a + Number(b.score ?? 0), 0) / mtc.length : 0;
    const siActive = si.filter((x: any) => ["active","open","new"].includes(String(x.status))).length;
    const siByOp = countBy(si, (x: any) => x.operation);

    // Blasts
    const blSent = sum(bl, "sent_count");
    const blFailed = sum(bl, "failed_count");
    const blAudience = sum(bl, "audience_count");
    const blByChannel = countBy(bl, (x: any) => x.channel);

    // Financings
    const finApproved = fin.filter((x: any) => String(x.status) === "approved").length;
    const finValue = sum(fin.filter((x: any) => String(x.status) === "approved"), "financed_value");

    // Marocas — apartments
    const apActive = ap.filter((x: any) => String(x.status) === "active" || String(x.status) === "available").length;
    const avgDaily = ap.length ? sum(ap, "daily_rate") / ap.length : 0;

    // Maintenance
    const mrOpen = mr.filter((x: any) => !x.resolved_at).length;
    const mrResolved = mr.filter((x: any) => x.resolved_at).length;
    const mrMttrH = mrResolved ? mr.filter((x: any) => x.resolved_at && x.created_at).reduce((a: number, x: any) => a + (new Date(x.resolved_at).getTime() - new Date(x.created_at).getTime()), 0) / mrResolved / 3600000 : 0;
    const mrByPriority = countBy(mr, (x: any) => x.priority);
    const mrByCategory = countBy(mr, (x: any) => x.category).slice(0, 15);
    const mqApproved = mq.filter((x: any) => String(x.status) === "approved").length;
    const mqAmount = sum(mq.filter((x: any) => String(x.status) === "approved"), "amount");

    // Owner statements
    const osPaid = os.filter((x: any) => x.paid_at).length;
    const osGross = sum(os, "gross_revenue");
    const osFee = sum(os, "marocas_fee");
    const osNet = sum(os, "net_payout");
    const osByStatus = countBy(os, (x: any) => x.status);

    // Report runs
    const rrErrors = sum(rr, "error");
    const rrDone = sum(rr, "done");
    const rrLate = sum(rr, "late");

    return {
      filters: { days: data.days, sinceIso },
      properties: { total: prp.length, published: prpPublished, pending: prpPending, forSale: prpForSale, forRent: prpForRent, byOperation: prpByOperation, byType: prpByType, byStatus: prpByStatus, byCity: prpByCity },
      interests: { total: int.length, responded: intResponded, respRate: intRespRate, byKind: intByKind, byStatus: intByStatus, bySource: intBySource },
      visits: { total: vst.length, done: vstDone, noShow: vstNoShow, doneRate: vstDoneRate, byStatus: vstByStatus },
      contracts: { total: ctr.length, signed: ctrSigned, signRate: ctrSignRate, value: ctrValue, byType: ctrByType, byStatus: ctrByStatus },
      owners: { total: own.length, active: ownActive, logged: ownLogged, byStatus: ownByStatus },
      partnerBrokers: { total: pb.length },
      matches: { total: mtc.length, notified: mtcNotified, avgScore },
      reviews: { total: rev.length, byAction: countBy(rev, (x: any) => x.action).slice(0, 15) },
      searchIntents: { total: si.length, active: siActive, byOperation: siByOp },
      blasts: { total: bl.length, sent: blSent, failed: blFailed, audience: blAudience, byChannel: blByChannel },
      financings: { total: fin.length, approved: finApproved, value: finValue },
      assignments: { total: la.length, byStrategy: countBy(la, (x: any) => x.strategy) },
      marocasApartments: { total: ap.length, active: apActive, avgDaily },
      marocasMaintenance: { total: mr.length, open: mrOpen, resolved: mrResolved, mttrHours: mrMttrH, byPriority: mrByPriority, byCategory: mrByCategory, quotesApproved: mqApproved, quotesAmount: mqAmount },
      marocasStatements: { total: os.length, paid: osPaid, gross: osGross, fee: osFee, net: osNet, byStatus: osByStatus },
      marocasReports: { total: rr.length, done: rrDone, late: rrLate, errors: rrErrors },
    };
  });
