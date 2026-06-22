import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vitrine, Site Builder & Legal Contracts Cockpit — Fase 86.
 * Páginas geradas, templates, vitrine pública, exports, documentos legais,
 * aceites LGPD, contratos faturáveis, assinaturas e aplicações de governança.
 */
export const getVitrineLegalHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [pgRes, pvRes, stRes, vpRes, veRes, cdRes, csRes, edRes, eaRes, gaRes] = await Promise.all([
      supabaseAdmin.from("generated_pages").select("id, company_id, template_id, slug, status, created_by, created_at, updated_at").limit(50000),
      supabaseAdmin.from("generated_page_versions").select("id, page_id, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("site_templates").select("id, slug, niche, status, created_at").limit(5000),
      supabaseAdmin.from("companies_vitrine_public").select("id, segment, company_type, address_state, address_city, rating_avg, rating_count, updated_at").limit(50000),
      supabaseAdmin.from("vitrine_export_logs").select("id, company_id, dataset, format, status, total_expected, total_exported, batches_done, started_at, finished_at, error_message, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("contract_documents").select("id, company_id, white_label_id, contract_number, version, status, file_size_bytes, generated_at, sent_at, signed_at, superseded_at, created_at").limit(50000),
      supabaseAdmin.from("contract_signatures").select("id, contract_document_id, company_id, signer_email, status, signed_at, created_at").limit(50000),
      supabaseAdmin.from("eco_legal_documents").select("id, kind, niche, audience, version, title, is_current, effective_at, created_at").limit(5000),
      supabaseAdmin.from("eco_legal_acceptances").select("id, user_id, company_id, document_id, document_kind, document_version, accepted_at").gte("accepted_at", sinceIso).limit(50000),
      supabaseAdmin.from("governance_applications").select("id, kind, scope, target_id, affected_count, applied_by_email, applied_at, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = pgRes.error || pvRes.error || stRes.error || vpRes.error || veRes.error || cdRes.error || csRes.error || edRes.error || eaRes.error || gaRes.error;
    if (err) throw new Error(err.message);

    const pg = pgRes.data ?? [];
    const pv = pvRes.data ?? [];
    const st = stRes.data ?? [];
    const vp = vpRes.data ?? [];
    const ve = veRes.data ?? [];
    const cd = cdRes.data ?? [];
    const cs = csRes.data ?? [];
    const ed = edRes.data ?? [];
    const ea = eaRes.data ?? [];
    const ga = gaRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Pages
    const pgByStatus = countBy(pg, (r: any) => r.status);
    const pgWithTemplate = pg.filter((r: any) => r.template_id).length;
    const pgCompanies = new Set(pg.map((r: any) => r.company_id).filter(Boolean)).size;

    // Versions
    const pvByStatus = countBy(pv, (r: any) => r.status);

    // Templates
    const stByNiche = countBy(st, (r: any) => r.niche);
    const stActive = st.filter((r: any) => String(r.status).toLowerCase() === "active" || String(r.status).toLowerCase() === "published").length;

    // Vitrine público
    const vpBySegment = countBy(vp, (r: any) => r.segment).slice(0, 10);
    const vpByState = countBy(vp, (r: any) => r.address_state).slice(0, 12);
    const vpRatings = vp.filter((r: any) => r.rating_avg != null && Number(r.rating_count) > 0);
    const vpAvgRating = vpRatings.length ? vpRatings.reduce((a: number, r: any) => a + Number(r.rating_avg), 0) / vpRatings.length : 0;

    // Vitrine exports
    const veByStatus = countBy(ve, (r: any) => r.status);
    const veRows = ve.reduce((a: number, r: any) => a + (r.total_exported ?? 0), 0);
    const veErrors = ve.filter((r: any) => r.error_message).length;
    const veByDataset = countBy(ve, (r: any) => r.dataset);

    // Contratos
    const cdByStatus = countBy(cd, (r: any) => r.status);
    const cdSigned = cd.filter((r: any) => r.signed_at).length;
    const cdSent = cd.filter((r: any) => r.sent_at && !r.signed_at).length;
    const cdSuperseded = cd.filter((r: any) => r.superseded_at).length;
    const cdSize = cd.reduce((a: number, r: any) => a + (r.file_size_bytes ?? 0), 0);

    // Assinaturas
    const csByStatus = countBy(cs, (r: any) => r.status);
    const csCompleted = cs.filter((r: any) => r.signed_at).length;
    const csUniqueSigners = new Set(cs.map((r: any) => (r.signer_email ?? "").toLowerCase()).filter(Boolean)).size;
    const cdMap = new Map(cd.map((c: any) => [c.id, c]));
    const csTimes = cs
      .filter((r: any) => r.signed_at && cdMap.get(r.contract_document_id))
      .map((r: any) => {
        const c: any = cdMap.get(r.contract_document_id);
        const start = c?.sent_at ?? c?.generated_at;
        if (!start) return null;
        return (new Date(r.signed_at).getTime() - new Date(start).getTime()) / 3600000;
      })
      .filter((n): n is number => n != null && Number.isFinite(n) && n >= 0);
    const csAvgHours = csTimes.length ? csTimes.reduce((a, b) => a + b, 0) / csTimes.length : 0;

    // Documentos legais
    const edByKind = countBy(ed, (r: any) => r.kind);
    const edCurrent = ed.filter((r: any) => r.is_current).length;
    const eaByKind = countBy(ea, (r: any) => r.document_kind);
    const eaUniqueUsers = new Set(ea.map((r: any) => r.user_id).filter(Boolean)).size;

    // Governance applications
    const gaByKind = countBy(ga, (r: any) => r.kind);
    const gaTotalAffected = ga.reduce((a: number, r: any) => a + (r.affected_count ?? 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      pages: {
        total: pg.length,
        companies: pgCompanies,
        withTemplate: pgWithTemplate,
        byStatus: pgByStatus,
        versions: pv.length,
        versionsByStatus: pvByStatus,
      },
      templates: { total: st.length, active: stActive, byNiche: stByNiche },
      vitrinePublic: {
        total: vp.length,
        avgRating: vpAvgRating,
        rated: vpRatings.length,
        bySegment: vpBySegment,
        byState: vpByState,
      },
      vitrineExports: {
        total: ve.length,
        rowsExported: veRows,
        errors: veErrors,
        byStatus: veByStatus,
        byDataset: veByDataset,
      },
      contracts: {
        total: cd.length,
        signed: cdSigned,
        awaitingSignature: cdSent,
        superseded: cdSuperseded,
        totalSizeBytes: cdSize,
        byStatus: cdByStatus,
        signatures: cs.length,
        signaturesCompleted: csCompleted,
        uniqueSigners: csUniqueSigners,
        avgHoursToSign: csAvgHours,
        signaturesByStatus: csByStatus,
      },
      legal: {
        documents: ed.length,
        current: edCurrent,
        byKind: edByKind,
        acceptances: ea.length,
        uniqueUsers: eaUniqueUsers,
        acceptancesByKind: eaByKind,
        latestDocs: ed
          .slice()
          .sort((a: any, b: any) => new Date(b.effective_at ?? b.created_at).getTime() - new Date(a.effective_at ?? a.created_at).getTime())
          .slice(0, 8)
          .map((r: any) => ({ id: r.id, kind: r.kind, niche: r.niche, audience: r.audience, version: r.version, title: r.title, isCurrent: r.is_current, effectiveAt: r.effective_at })),
      },
      governance: {
        total: ga.length,
        totalAffected: gaTotalAffected,
        byKind: gaByKind,
        latest: ga
          .slice()
          .sort((a: any, b: any) => new Date(b.applied_at ?? b.created_at).getTime() - new Date(a.applied_at ?? a.created_at).getTime())
          .slice(0, 10)
          .map((r: any) => ({ id: r.id, kind: r.kind, scope: r.scope, affected: r.affected_count, by: r.applied_by_email, at: r.applied_at ?? r.created_at })),
      },
    };
  });
