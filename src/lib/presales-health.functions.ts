import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Pré-Vendas & Conversão Comercial — Fase 100.
 * Consolida quotes, contract_documents, contract_signatures,
 * demo_leads, demo_sessions, demo_visit_sessions, demo_survey_responses,
 * demo_actions e catalog_intents.
 */
export const getPresalesHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [qRes, cdRes, csRes, dlRes, dsRes, dvRes, drRes, daRes, ciRes] = await Promise.all([
      supabaseAdmin.from("quotes").select("id, company_id, status, total, valor_total, created_at, updated_at, accepted_at, rejected_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("contract_documents").select("id, company_id, status, total_amount, created_at, signed_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("contract_signatures").select("id, status, signer_role, signed_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("demo_leads").select("id, company_id, status, source, niche, created_at, converted_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("demo_sessions").select("id, company_id, niche, started_at, completed_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("demo_visit_sessions").select("id, company_id, status, niche, started_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("demo_survey_responses").select("id, company_id, score, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("demo_actions").select("id, company_id, action, niche, created_at").gte("created_at", sinceIso).limit(500000),
      supabaseAdmin.from("catalog_intents").select("id, company_id, status, intent_type, source, created_at, processed_at").gte("created_at", sinceIso).limit(200000),
    ]);

    const err = qRes.error || cdRes.error || csRes.error || dlRes.error || dsRes.error || dvRes.error || drRes.error || daRes.error || ciRes.error;
    if (err) throw new Error(err.message);

    const q = qRes.data ?? [];
    const cd = cdRes.data ?? [];
    const cs = csRes.data ?? [];
    const dl = dlRes.data ?? [];
    const ds = dsRes.data ?? [];
    const dv = dvRes.data ?? [];
    const dr = drRes.data ?? [];
    const da = daRes.data ?? [];
    const ci = ciRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const sum = (rows: any[], f: string) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
    const avg = (rows: any[], f: string) => rows.length ? sum(rows, f) / rows.length : 0;

    // Quotes
    const qAccepted = q.filter((x: any) => x.accepted_at || String(x.status) === "accepted");
    const qRejected = q.filter((x: any) => x.rejected_at || String(x.status) === "rejected");
    const qOpen = q.filter((x: any) => !x.accepted_at && !x.rejected_at);
    const qAcceptRate = q.length ? (qAccepted.length / q.length) * 100 : 0;
    const qAcceptedBRL = qAccepted.reduce((s: number, x: any) => s + (Number(x.total) || Number(x.valor_total) || 0), 0);
    const qByStatus = countBy(q, (x: any) => x.status);

    // Contracts
    const cdSigned = cd.filter((x: any) => x.signed_at || String(x.status) === "signed");
    const cdOpen = cd.filter((x: any) => !x.signed_at && !["signed","canceled","void"].includes(String(x.status)));
    const cdSignRate = cd.length ? (cdSigned.length / cd.length) * 100 : 0;
    const cdSignedBRL = sum(cdSigned, "total_amount");
    const cdByStatus = countBy(cd, (x: any) => x.status);

    // Signatures
    const csSigned = cs.filter((x: any) => x.signed_at || String(x.status) === "signed").length;
    const csByStatus = countBy(cs, (x: any) => x.status);
    const csByRole = countBy(cs, (x: any) => x.signer_role);

    // Demo leads
    const dlConverted = dl.filter((x: any) => x.converted_at).length;
    const dlConvRate = dl.length ? (dlConverted / dl.length) * 100 : 0;
    const dlByStatus = countBy(dl, (x: any) => x.status);
    const dlByNiche = countBy(dl, (x: any) => x.niche).slice(0, 15);
    const dlBySource = countBy(dl, (x: any) => x.source).slice(0, 15);

    // Demo sessions
    const dsCompleted = ds.filter((x: any) => x.completed_at).length;
    const dsCompleteRate = ds.length ? (dsCompleted / ds.length) * 100 : 0;
    const dsByNiche = countBy(ds, (x: any) => x.niche).slice(0, 15);

    // Visit sessions
    const dvByStatus = countBy(dv, (x: any) => x.status);
    const dvByNiche = countBy(dv, (x: any) => x.niche).slice(0, 15);

    // Survey
    const drAvgScore = avg(dr, "score");

    // Demo actions
    const daByAction = countBy(da, (x: any) => x.action).slice(0, 15);
    const daByNiche = countBy(da, (x: any) => x.niche).slice(0, 15);

    // Catalog intents
    const ciProcessed = ci.filter((x: any) => x.processed_at).length;
    const ciProcessRate = ci.length ? (ciProcessed / ci.length) * 100 : 0;
    const ciByStatus = countBy(ci, (x: any) => x.status);
    const ciByType = countBy(ci, (x: any) => x.intent_type);
    const ciBySource = countBy(ci, (x: any) => x.source);

    return {
      windowDays: data.days,
      quotes: { total: q.length, accepted: qAccepted.length, rejected: qRejected.length, open: qOpen.length, acceptRate: qAcceptRate, acceptedBRL: qAcceptedBRL, byStatus: qByStatus },
      contracts: { total: cd.length, signed: cdSigned.length, open: cdOpen.length, signRate: cdSignRate, signedBRL: cdSignedBRL, byStatus: cdByStatus },
      signatures: { total: cs.length, signed: csSigned, byStatus: csByStatus, byRole: csByRole },
      demoLeads: { total: dl.length, converted: dlConverted, convRate: dlConvRate, byStatus: dlByStatus, byNiche: dlByNiche, bySource: dlBySource },
      demoSessions: { total: ds.length, completed: dsCompleted, completeRate: dsCompleteRate, byNiche: dsByNiche },
      visitSessions: { total: dv.length, byStatus: dvByStatus, byNiche: dvByNiche },
      survey: { total: dr.length, avgScore: drAvgScore },
      demoActions: { total: da.length, byAction: daByAction, byNiche: daByNiche },
      catalogIntents: { total: ci.length, processed: ciProcessed, processRate: ciProcessRate, byStatus: ciByStatus, byType: ciByType, bySource: ciBySource },
    };
  });
