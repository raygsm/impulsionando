import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Governance & LGPD Cockpit — Fase 64.
 * Consents, deletion/export requests, eco legal acceptances/documents,
 * audit logs e governance applications.
 */
export const getGovernanceLgpdHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [consRes, delRes, expRes, accRes, docRes, auditRes, govRes, complRes, incRes] = await Promise.all([
      supabaseAdmin.from("lgpd_consents").select("id, purpose, granted, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("data_deletion_requests").select("id, status, requested_at, completed_at, created_at").limit(20000),
      supabaseAdmin.from("data_export_requests").select("id, status, requested_at, completed_at, created_at").limit(20000),
      supabaseAdmin.from("eco_legal_acceptances").select("id, document_id, accepted_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_legal_documents").select("id, title, status, version").limit(2000),
      supabaseAdmin.from("audit_logs").select("id, action, resource, severity, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("governance_applications").select("id, status, application_type, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_compliance_requirements").select("id, status, requirement_type").limit(2000),
      supabaseAdmin.from("core_incidents").select("id, severity, status, created_at").gte("created_at", sinceIso).limit(5000),
    ]);

    const err = consRes.error || delRes.error || expRes.error || accRes.error || docRes.error || auditRes.error || govRes.error || complRes.error || incRes.error;
    if (err) throw new Error(err.message);

    const cons = consRes.data ?? [];
    const del = delRes.data ?? [];
    const exp = expRes.data ?? [];
    const acc = accRes.data ?? [];
    const docs = docRes.data ?? [];
    const audit = auditRes.data ?? [];
    const gov = govRes.data ?? [];
    const compl = complRes.data ?? [];
    const inc = incRes.data ?? [];

    const consGranted = cons.filter((c) => c.granted).length;
    const purposeMap = new Map<string, number>();
    for (const c of cons) { const k = c.purpose || "—"; purposeMap.set(k, (purposeMap.get(k) ?? 0) + 1); }
    const topPurposes = Array.from(purposeMap, ([purpose, count]) => ({ purpose, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const delPending = del.filter((d) => d.status === "pending" || d.status === "requested").length;
    const delDone = del.filter((d) => d.status === "completed" || d.status === "done").length;
    const expPending = exp.filter((e) => e.status === "pending" || e.status === "requested").length;
    const expDone = exp.filter((e) => e.status === "completed" || e.status === "done").length;

    const docsActive = docs.filter((d) => d.status === "active" || d.status === "published").length;

    const severityMap = new Map<string, number>();
    for (const a of audit) { const k = a.severity || "info"; severityMap.set(k, (severityMap.get(k) ?? 0) + 1); }
    const auditBySeverity = Array.from(severityMap, ([severity, count]) => ({ severity, count })).sort((a, b) => b.count - a.count);
    const actionMap = new Map<string, number>();
    for (const a of audit) { const k = a.action || "—"; actionMap.set(k, (actionMap.get(k) ?? 0) + 1); }
    const topActions = Array.from(actionMap, ([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    const govPending = gov.filter((g) => g.status === "pending" || g.status === "submitted").length;
    const govApproved = gov.filter((g) => g.status === "approved").length;

    const complOk = compl.filter((c) => c.status === "ok" || c.status === "compliant").length;
    const complGap = compl.filter((c) => c.status === "gap" || c.status === "non_compliant").length;

    const incOpen = inc.filter((i) => i.status === "open" || i.status === "investigating").length;
    const incHigh = inc.filter((i) => i.severity === "high" || i.severity === "critical").length;

    return {
      days: data.days,
      consents: { total: cons.length, granted: consGranted, topPurposes },
      deletion: { total: del.length, pending: delPending, done: delDone },
      export: { total: exp.length, pending: expPending, done: expDone },
      legal: { acceptances: acc.length, documents: docs.length, activeDocuments: docsActive },
      audit: { total: audit.length, bySeverity: auditBySeverity, topActions },
      governance: { total: gov.length, pending: govPending, approved: govApproved },
      compliance: { total: compl.length, ok: complOk, gaps: complGap },
      incidents: { total: inc.length, open: incOpen, high: incHigh },
    };
  });
