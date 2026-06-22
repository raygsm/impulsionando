import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Governance & LGPD Cockpit — Fase 64.
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
      supabaseAdmin.from("lgpd_consents").select("id, consent_type, accepted, revoked_at, accepted_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("data_deletion_requests").select("id, status, processed_at, scheduled_for, created_at").limit(20000),
      supabaseAdmin.from("data_export_requests").select("id, status, processed_at, created_at").limit(20000),
      supabaseAdmin.from("eco_legal_acceptances").select("id, document_id, accepted_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_legal_documents").select("id, title, kind, is_current, version").limit(2000),
      supabaseAdmin.from("audit_logs").select("id, action, entity, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("governance_applications").select("id, kind, scope, applied_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_compliance_requirements").select("id, requirement_key, blocking, active").limit(2000),
      supabaseAdmin.from("core_incidents").select("id, severity, status, created_at").gte("created_at", sinceIso).limit(5000),
    ]);

    const err = consRes.error || delRes.error || expRes.error || accRes.error || docRes.error || auditRes.error || govRes.error || complRes.error || incRes.error;
    if (err) throw new Error(err.message);

    const cons = (consRes.data ?? []) as any[];
    const del = (delRes.data ?? []) as any[];
    const exp = (expRes.data ?? []) as any[];
    const acc = (accRes.data ?? []) as any[];
    const docs = (docRes.data ?? []) as any[];
    const audit = (auditRes.data ?? []) as any[];
    const gov = (govRes.data ?? []) as any[];
    const compl = (complRes.data ?? []) as any[];
    const inc = (incRes.data ?? []) as any[];

    const consGranted = cons.filter((c) => c.accepted && !c.revoked_at).length;
    const consRevoked = cons.filter((c) => c.revoked_at).length;
    const purposeMap = new Map<string, number>();
    for (const c of cons) { const k = c.consent_type || "—"; purposeMap.set(k, (purposeMap.get(k) ?? 0) + 1); }
    const topPurposes = Array.from(purposeMap, ([purpose, count]) => ({ purpose, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const delPending = del.filter((d) => d.status === "pending" || d.status === "requested" || d.status === "scheduled").length;
    const delDone = del.filter((d) => d.processed_at || d.status === "completed" || d.status === "done").length;
    const expPending = exp.filter((e) => e.status === "pending" || e.status === "requested" || e.status === "processing").length;
    const expDone = exp.filter((e) => e.processed_at || e.status === "completed" || e.status === "done").length;

    const docsActive = docs.filter((d) => d.is_current).length;

    const actionMap = new Map<string, number>();
    for (const a of audit) { const k = a.action || "—"; actionMap.set(k, (actionMap.get(k) ?? 0) + 1); }
    const topActions = Array.from(actionMap, ([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 15);
    const entityMap = new Map<string, number>();
    for (const a of audit) { const k = a.entity || "—"; entityMap.set(k, (entityMap.get(k) ?? 0) + 1); }
    const topEntities = Array.from(entityMap, ([entity, count]) => ({ entity, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    const govKindMap = new Map<string, number>();
    for (const g of gov) { const k = g.kind || "—"; govKindMap.set(k, (govKindMap.get(k) ?? 0) + 1); }
    const govByKind = Array.from(govKindMap, ([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const complActive = compl.filter((c) => c.active).length;
    const complBlocking = compl.filter((c) => c.blocking && c.active).length;

    const incOpen = inc.filter((i) => i.status !== "resolved").length;
    const incHigh = inc.filter((i) => i.severity === "sev1" || i.severity === "sev2").length;

    return {
      days: data.days,
      consents: { total: cons.length, granted: consGranted, revoked: consRevoked, topPurposes },
      deletion: { total: del.length, pending: delPending, done: delDone },
      export: { total: exp.length, pending: expPending, done: expDone },
      legal: { acceptances: acc.length, documents: docs.length, activeDocuments: docsActive },
      audit: { total: audit.length, topActions, topEntities },
      governance: { total: gov.length, byKind: govByKind },
      compliance: { total: compl.length, active: complActive, blocking: complBlocking },
      incidents: { total: inc.length, open: incOpen, high: incHigh },
    };
  });
