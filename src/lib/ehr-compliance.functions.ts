import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * EHR & Clinical Compliance — Fase 43.
 * Visão consolidada da saúde do prontuário eletrônico: evoluções sem assinatura,
 * pareceres pendentes, documentos aguardando revisão, gaps de preenchimento e
 * cobertura LGPD em dados sensíveis de saúde.
 */
export const getEhrCompliance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const staleIso = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const [recordsRes, evolutionsRes, opinionsRes, documentsRes, companiesRes] = await Promise.all([
      supabaseAdmin
        .from("ehr_records")
        .select("id, company_id, status, customer_id, responsible_user_id, chief_complaint, medical_history, allergies, current_medications, created_at, updated_at")
        .limit(20000),
      supabaseAdmin
        .from("ehr_evolutions")
        .select("id, company_id, record_id, doctor_user_id, occurred_at, signed_at, released_to_patient, chief_complaint, hypothesis, conduct, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("ehr_opinions")
        .select("id, company_id, record_id, doctor_user_id, summary, conduct, confirmed_at, released_to_patient, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("ehr_documents")
        .select("id, company_id, record_id, requires_review, review_status, ai_status, visible_to_patient, occurred_at, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin.from("companies").select("id, name").limit(5000),
    ]);

    const err = recordsRes.error || evolutionsRes.error || opinionsRes.error || documentsRes.error;
    if (err) throw new Error(err.message);

    const records = recordsRes.data ?? [];
    const evolutions = evolutionsRes.data ?? [];
    const opinions = opinionsRes.data ?? [];
    const documents = documentsRes.data ?? [];
    const companyName = new Map((companiesRes.data ?? []).map((c) => [c.id, c.name]));

    // Métricas globais
    const totalRecords = records.length;
    const activeRecords = records.filter((r) => r.status === "ativo" || r.status === "active").length;
    const recordsMissingHistory = records.filter(
      (r) => !r.medical_history || (r.medical_history ?? "").trim().length < 10,
    ).length;
    const recordsMissingAllergies = records.filter((r) => !r.allergies).length;
    const recordsWithoutResponsible = records.filter((r) => !r.responsible_user_id).length;

    const totalEvolutions = evolutions.length;
    const unsignedEvolutions = evolutions.filter((e) => !e.signed_at).length;
    const staleUnsigned = evolutions.filter((e) => !e.signed_at && e.created_at < staleIso).length;
    const evolutionsWithoutConduct = evolutions.filter((e) => !e.conduct || (e.conduct ?? "").trim().length < 5).length;
    const evolutionsReleased = evolutions.filter((e) => e.released_to_patient).length;
    const releaseRate = totalEvolutions ? (evolutionsReleased / totalEvolutions) * 100 : 0;

    const totalOpinions = opinions.length;
    const pendingOpinions = opinions.filter((o) => !o.confirmed_at).length;
    const stalePendingOpinions = opinions.filter((o) => !o.confirmed_at && o.created_at < staleIso).length;

    const totalDocuments = documents.length;
    const pendingDocReview = documents.filter(
      (d) => d.requires_review && d.review_status !== "approved" && d.review_status !== "aprovado",
    ).length;
    const aiPendingDocs = documents.filter((d) => d.ai_status === "pending" || d.ai_status === "processing").length;

    // Score de compliance (0-100)
    const penalties =
      (unsignedEvolutions / Math.max(1, totalEvolutions)) * 35 +
      (pendingOpinions / Math.max(1, totalOpinions || 1)) * 20 +
      (recordsMissingHistory / Math.max(1, totalRecords)) * 15 +
      (pendingDocReview / Math.max(1, totalDocuments || 1)) * 15 +
      (recordsWithoutResponsible / Math.max(1, totalRecords)) * 15;
    const complianceScore = Math.max(0, Math.min(100, 100 - penalties));

    // Por tenant
    type TenantRow = {
      companyId: string;
      name: string;
      records: number;
      evolutions: number;
      unsigned: number;
      pendingOpinions: number;
      pendingDocs: number;
      missingHistory: number;
      score: number;
    };
    const tenantMap = new Map<string, TenantRow>();
    const touch = (cid: string): TenantRow => {
      let t = tenantMap.get(cid);
      if (!t) {
        t = {
          companyId: cid,
          name: companyName.get(cid) ?? cid.slice(0, 8),
          records: 0,
          evolutions: 0,
          unsigned: 0,
          pendingOpinions: 0,
          pendingDocs: 0,
          missingHistory: 0,
          score: 100,
        };
        tenantMap.set(cid, t);
      }
      return t;
    };
    for (const r of records) {
      const t = touch(r.company_id);
      t.records++;
      if (!r.medical_history || (r.medical_history ?? "").trim().length < 10) t.missingHistory++;
    }
    for (const e of evolutions) {
      const t = touch(e.company_id);
      t.evolutions++;
      if (!e.signed_at) t.unsigned++;
    }
    for (const o of opinions) {
      if (!o.confirmed_at) touch(o.company_id).pendingOpinions++;
    }
    for (const d of documents) {
      if (d.requires_review && d.review_status !== "approved" && d.review_status !== "aprovado") {
        touch(d.company_id).pendingDocs++;
      }
    }
    const tenants = Array.from(tenantMap.values()).map((t) => {
      const pen =
        (t.unsigned / Math.max(1, t.evolutions)) * 50 +
        (t.missingHistory / Math.max(1, t.records)) * 25 +
        (t.pendingOpinions / Math.max(1, t.evolutions || 1)) * 15 +
        (t.pendingDocs / Math.max(1, t.evolutions || 1)) * 10;
      t.score = Math.max(0, Math.min(100, 100 - pen));
      return t;
    });
    tenants.sort((a, b) => a.score - b.score);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      kpis: {
        totalRecords,
        activeRecords,
        recordsMissingHistory,
        recordsMissingAllergies,
        recordsWithoutResponsible,
        totalEvolutions,
        unsignedEvolutions,
        staleUnsigned,
        evolutionsWithoutConduct,
        releaseRate,
        totalOpinions,
        pendingOpinions,
        stalePendingOpinions,
        totalDocuments,
        pendingDocReview,
        aiPendingDocs,
        complianceScore,
      },
      tenants: tenants.slice(0, 25),
      criticalTenants: tenants.filter((t) => t.score < 70).slice(0, 15),
    };
  });
