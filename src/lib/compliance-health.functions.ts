import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * LGPD, Compliance & Auditoria — Fase 102.
 * Consolida lgpd_consents, data_deletion_requests, data_export_requests,
 * audit_logs, core_compliance_requirements, core_incidents,
 * notification_retention_audit, admin_dedupe_threshold_audit, dedupe_threshold_events.
 */
export const getComplianceHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [lcRes, ddrRes, derRes, alRes, ccrRes, ciRes, nraRes, adtaRes, dteRes] = await Promise.all([
      supabaseAdmin.from("lgpd_consents").select("id, consent_type, terms_version, accepted, revoked_at, accepted_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("data_deletion_requests").select("id, status, scheduled_for, processed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("data_export_requests").select("id, status, expires_at, processed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("audit_logs").select("id, action, entity, user_email, company_id, created_at").gte("created_at", sinceIso).limit(300000),
      supabaseAdmin.from("core_compliance_requirements").select("id, scope, requirement_key, document_kind, blocking, applies_to, active").limit(10000),
      supabaseAdmin.from("core_incidents").select("id, severity, status, scope, source, detected_at, resolved_at, event_count, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("notification_retention_audit").select("id, changed_by_email, previous_days, new_days, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("admin_dedupe_threshold_audit").select("id, changed_by, target_user, old_min_pct, new_min_pct, old_max_pct, new_max_pct, changed_at").gte("changed_at", sinceIso).limit(20000),
      supabaseAdmin.from("dedupe_threshold_events").select("id, state, prev_state, dedupe_pct, days_window, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = lcRes.error || ddrRes.error || derRes.error || alRes.error || ccrRes.error || ciRes.error || nraRes.error || adtaRes.error || dteRes.error;
    if (err) throw new Error(err.message);

    const lc = lcRes.data ?? [];
    const ddr = ddrRes.data ?? [];
    const der = derRes.data ?? [];
    const al = alRes.data ?? [];
    const ccr = ccrRes.data ?? [];
    const ci = ciRes.data ?? [];
    const nra = nraRes.data ?? [];
    const adta = adtaRes.data ?? [];
    const dte = dteRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const now = Date.now();

    // LGPD Consents
    const lcAccepted = lc.filter((x: any) => x.accepted).length;
    const lcRevoked = lc.filter((x: any) => x.revoked_at).length;
    const lcAcceptRate = lc.length ? (lcAccepted / lc.length) * 100 : 0;
    const lcByType = countBy(lc, (x: any) => x.consent_type);
    const lcByVersion = countBy(lc, (x: any) => x.terms_version).slice(0, 15);

    // Deletion Requests
    const ddrPending = ddr.filter((x: any) => ["pending","scheduled","requested"].includes(String(x.status))).length;
    const ddrProcessed = ddr.filter((x: any) => x.processed_at).length;
    const ddrOverdue = ddr.filter((x: any) => x.scheduled_for && !x.processed_at && new Date(x.scheduled_for).getTime() < now).length;
    const ddrByStatus = countBy(ddr, (x: any) => x.status);

    // Export Requests
    const derProcessed = der.filter((x: any) => x.processed_at).length;
    const derPending = der.filter((x: any) => !x.processed_at).length;
    const derExpired = der.filter((x: any) => x.expires_at && new Date(x.expires_at).getTime() < now).length;
    const derByStatus = countBy(der, (x: any) => x.status);

    // Audit logs
    const alByAction = countBy(al, (x: any) => x.action).slice(0, 15);
    const alByEntity = countBy(al, (x: any) => x.entity).slice(0, 15);
    const alTopUsers = countBy(al, (x: any) => x.user_email).slice(0, 15);

    // Compliance requirements
    const ccrActive = ccr.filter((x: any) => x.active).length;
    const ccrBlocking = ccr.filter((x: any) => x.blocking).length;
    const ccrByScope = countBy(ccr, (x: any) => x.scope);
    const ccrByKind = countBy(ccr, (x: any) => x.document_kind);

    // Incidents
    const ciOpen = ci.filter((x: any) => !x.resolved_at).length;
    const ciResolved = ci.filter((x: any) => x.resolved_at).length;
    const ciHigh = ci.filter((x: any) => ["high","critical","sev1","sev2"].includes(String(x.severity))).length;
    const mttrMs = ci.filter((x: any) => x.resolved_at && x.detected_at).map((x: any) => new Date(x.resolved_at).getTime() - new Date(x.detected_at).getTime());
    const mttrH = mttrMs.length ? (mttrMs.reduce((a, b) => a + b, 0) / mttrMs.length) / 3600000 : 0;
    const ciBySeverity = countBy(ci, (x: any) => x.severity);
    const ciByStatus = countBy(ci, (x: any) => x.status);
    const ciBySource = countBy(ci, (x: any) => x.source).slice(0, 15);

    // Retention / dedupe audits
    const dteByState = countBy(dte, (x: any) => x.state);

    return {
      filters: { days: data.days, sinceIso },
      consents: { total: lc.length, accepted: lcAccepted, revoked: lcRevoked, acceptRate: lcAcceptRate, byType: lcByType, byVersion: lcByVersion },
      deletions: { total: ddr.length, pending: ddrPending, processed: ddrProcessed, overdue: ddrOverdue, byStatus: ddrByStatus },
      exports: { total: der.length, processed: derProcessed, pending: derPending, expired: derExpired, byStatus: derByStatus },
      audit: { total: al.length, byAction: alByAction, byEntity: alByEntity, topUsers: alTopUsers },
      requirements: { total: ccr.length, active: ccrActive, blocking: ccrBlocking, byScope: ccrByScope, byKind: ccrByKind },
      incidents: { total: ci.length, open: ciOpen, resolved: ciResolved, high: ciHigh, mttrHours: mttrH, bySeverity: ciBySeverity, byStatus: ciByStatus, bySource: ciBySource },
      retention: { total: nra.length },
      dedupeAudit: { total: adta.length, events: dte.length, byState: dteByState },
    };
  });
