import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Documents & Files Cockpit — Fase 67.
 * Consolida auditoria de documentos (contratos, contábeis, imobiliários),
 * exportações e arquivos de IA.
 */
export const getDocumentsFilesHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [ctRes, sigRes, cdRes, rdRes, expRes, aiRes, gpRes] = await Promise.all([
      supabaseAdmin.from("contract_documents").select("id, status, created_at, signed_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("contract_signatures").select("id, document_id, status, signed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("contab_documents").select("id, status, doc_type, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_documents").select("id, doc_type, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("core_export_logs").select("id, kind, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("ai_project_files").select("id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("generated_pages").select("id, status, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = ctRes.error || sigRes.error || cdRes.error || rdRes.error || expRes.error || aiRes.error || gpRes.error;
    if (err) throw new Error(err.message);

    const ct = (ctRes.data ?? []) as any[];
    const sig = (sigRes.data ?? []) as any[];
    const cd = (cdRes.data ?? []) as any[];
    const rd = (rdRes.data ?? []) as any[];
    const exp = (expRes.data ?? []) as any[];
    const ai = (aiRes.data ?? []) as any[];
    const gp = (gpRes.data ?? []) as any[];

    const ctSigned = ct.filter((c) => c.signed_at || c.status === "signed" || c.status === "assinado").length;
    const ctPending = ct.filter((c) => !c.signed_at && (c.status === "pending" || c.status === "draft" || c.status === "pendente")).length;
    const sigDone = sig.filter((s) => s.signed_at || s.status === "signed").length;
    const sigPending = sig.length - sigDone;
    const sigTimes = sig.filter((s) => s.signed_at && s.created_at).map((s) => (new Date(s.signed_at as string).getTime() - new Date(s.created_at as string).getTime()) / 3600000);
    const sigAvgHours = sigTimes.length ? Math.round((sigTimes.reduce((a, b) => a + b, 0) / sigTimes.length) * 10) / 10 : 0;

    const cdMap = new Map<string, number>();
    for (const d of cd) { const k = d.doc_type || "—"; cdMap.set(k, (cdMap.get(k) ?? 0) + 1); }
    const cdTopTypes = Array.from(cdMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const rdMap = new Map<string, number>();
    for (const d of rd) { const k = d.doc_type || "—"; rdMap.set(k, (rdMap.get(k) ?? 0) + 1); }
    const rdTopTypes = Array.from(rdMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const expOk = exp.filter((e) => e.status === "success" || e.status === "ok" || e.status === "completed").length;
    const expFail = exp.filter((e) => e.status === "failed" || e.status === "error").length;
    const expMap = new Map<string, number>();
    for (const e of exp) { const k = e.kind || "—"; expMap.set(k, (expMap.get(k) ?? 0) + 1); }
    const expByKind = Array.from(expMap, ([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const gpPub = gp.filter((g) => g.status === "published" || g.status === "active").length;

    return {
      days: data.days,
      contracts: { total: ct.length, signed: ctSigned, pending: ctPending, signatures: sig.length, signaturesDone: sigDone, signaturesPending: sigPending, avgSignHours: sigAvgHours },
      contab: { total: cd.length, topTypes: cdTopTypes },
      realestate: { total: rd.length, topTypes: rdTopTypes },
      exports: { total: exp.length, ok: expOk, failed: expFail, byKind: expByKind },
      ai: { files: ai.length },
      generatedPages: { total: gp.length, published: gpPub },
    };
  });
