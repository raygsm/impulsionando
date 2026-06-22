import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * EHR & Clinical Cockpit — Fase 71.
 * Prontuários, evoluções, pareceres, documentos clínicos e atendimentos da agenda.
 */
export const getEhrClinicalHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({
    days: Math.max(7, Math.min(180, d?.days ?? 30)),
  }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [recRes, evoRes, opRes, docRes, apptRes] = await Promise.all([
      supabaseAdmin
        .from("ehr_records")
        .select("id, company_id, customer_id, responsible_user_id, status, created_at")
        .limit(50000),
      supabaseAdmin
        .from("ehr_evolutions")
        .select("id, company_id, record_id, doctor_user_id, occurred_at, signed_at, released_to_patient, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("ehr_opinions")
        .select("id, company_id, record_id, doctor_user_id, confirmed_at, released_to_patient, request_followup, request_new_exam, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("ehr_documents")
        .select("id, company_id, record_id, category, source, requires_review, review_status, ai_status, visible_to_patient, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("agenda_appointments")
        .select("id, company_id, professional_id, status, starts_at, cancelled_at, created_at")
        .gte("starts_at", sinceIso)
        .limit(50000),
    ]);

    const recs = recRes.data ?? [];
    const evos = evoRes.data ?? [];
    const ops = opRes.data ?? [];
    const docs = docRes.data ?? [];
    const appts = apptRes.data ?? [];

    const recByStatus: Record<string, number> = {};
    for (const r of recs) recByStatus[r.status ?? "—"] = (recByStatus[r.status ?? "—"] ?? 0) + 1;

    const signedEvos = evos.filter((e: any) => e.signed_at).length;
    const releasedEvos = evos.filter((e: any) => e.released_to_patient).length;
    let signLagSum = 0, signLagN = 0;
    for (const e of evos) {
      if (e.signed_at && e.occurred_at) {
        signLagSum += (new Date(e.signed_at).getTime() - new Date(e.occurred_at).getTime()) / 3600000;
        signLagN++;
      }
    }
    const avgSignHours = signLagN ? signLagSum / signLagN : 0;

    const confirmedOps = ops.filter((o: any) => o.confirmed_at).length;
    const followupOps = ops.filter((o: any) => o.request_followup).length;
    const newExamOps = ops.filter((o: any) => o.request_new_exam).length;

    const docByCategory: Record<string, number> = {};
    const docBySource: Record<string, number> = {};
    let needsReview = 0, reviewed = 0, aiOk = 0, aiFail = 0;
    for (const d of docs) {
      docByCategory[d.category ?? "—"] = (docByCategory[d.category ?? "—"] ?? 0) + 1;
      docBySource[d.source ?? "—"] = (docBySource[d.source ?? "—"] ?? 0) + 1;
      if (d.requires_review) needsReview++;
      if (d.review_status === "reviewed" || d.review_status === "approved") reviewed++;
      if (d.ai_status === "done" || d.ai_status === "completed") aiOk++;
      if (d.ai_status === "failed" || d.ai_status === "error") aiFail++;
    }

    const apptByStatus: Record<string, number> = {};
    for (const a of appts) apptByStatus[a.status ?? "—"] = (apptByStatus[a.status ?? "—"] ?? 0) + 1;
    const apptDone = appts.filter((a: any) => a.status === "completed" || a.status === "finished" || a.status === "done").length;
    const apptCanceled = appts.filter((a: any) => a.cancelled_at || a.status === "canceled" || a.status === "cancelled").length;
    const apptNoShow = appts.filter((a: any) => a.status === "no_show" || a.status === "noshow").length;

    return {
      records: {
        total: recs.length,
        byStatus: Object.entries(recByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      evolutions: {
        total: evos.length,
        signed: signedEvos,
        released: releasedEvos,
        avgSignHours: Math.round(avgSignHours * 10) / 10,
      },
      opinions: {
        total: ops.length,
        confirmed: confirmedOps,
        requestedFollowup: followupOps,
        requestedNewExam: newExamOps,
      },
      documents: {
        total: docs.length,
        needsReview,
        reviewed,
        aiOk,
        aiFail,
        byCategory: Object.entries(docByCategory).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        bySource: Object.entries(docBySource).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      },
      appointments: {
        total: appts.length,
        done: apptDone,
        canceled: apptCanceled,
        noShow: apptNoShow,
        byStatus: Object.entries(apptByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
    };
  });
