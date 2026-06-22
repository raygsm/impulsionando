import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Audit & Security Cockpit — Fase 84.
 * Auditoria sensível, RBAC (roles/permissions/overrides), webhook event log,
 * dedupe thresholds e auditoria de retenção de notificações.
 */
export const getAuditSecurityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [auRes, urRes, pmRes, ppRes, ovRes, dtRes, daRes, deRes, nrRes, weRes, taRes, agRes] = await Promise.all([
      supabaseAdmin.from("audit_logs").select("id, company_id, user_id, user_email, action, entity, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("user_roles").select("id, user_id, role, company_id, created_at").limit(50000),
      supabaseAdmin.from("permissions").select("id, code, module").limit(5000),
      supabaseAdmin.from("profile_permissions").select("profile_id, permission_id").limit(50000),
      supabaseAdmin.from("user_permission_overrides").select("id, user_id, company_id, permission_id, effect, created_at").limit(20000),
      supabaseAdmin.from("admin_dedupe_thresholds").select("user_id, min_pct, max_pct, updated_at").limit(10000),
      supabaseAdmin.from("admin_dedupe_threshold_audit").select("id, changed_by, target_user, old_min_pct, old_max_pct, new_min_pct, new_max_pct, changed_at").gte("changed_at", sinceIso).limit(10000),
      supabaseAdmin.from("dedupe_threshold_events").select("id, user_id, dedupe_pct, min_pct, max_pct, state, prev_state, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("notification_retention_audit").select("id, changed_by, changed_by_email, previous_days, new_days, reason, created_at").gte("created_at", sinceIso).limit(5000),
      supabaseAdmin.from("webhook_event_log").select("id, source, status, processed_at, replay_count, replayed_at, error").gte("processed_at", sinceIso).limit(50000),
      supabaseAdmin.from("trial_abuse_index").select("id, trial_id, email_hash, whatsapp_hash, doc_hash, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("agent_logs").select("id, event, user_id, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = auRes.error || urRes.error || pmRes.error || ppRes.error || ovRes.error || dtRes.error || daRes.error || deRes.error || nrRes.error || weRes.error || taRes.error || agRes.error;
    if (err) throw new Error(err.message);

    const au = auRes.data ?? [];
    const ur = urRes.data ?? [];
    const pm = pmRes.data ?? [];
    const pp = ppRes.data ?? [];
    const ov = ovRes.data ?? [];
    const dt = dtRes.data ?? [];
    const da = daRes.data ?? [];
    const de = deRes.data ?? [];
    const nr = nrRes.data ?? [];
    const we = weRes.data ?? [];
    const ta = taRes.data ?? [];
    const ag = agRes.data ?? [];

    const bucket = <T,>(arr: T[], key: (x: T) => string | null | undefined, top = 12) => {
      const m = new Map<string, number>();
      for (const x of arr) { const k = (key(x) ?? "—") || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, top);
    };

    // Audit
    const auByAction = bucket(au, (a: any) => a.action);
    const auByEntity = bucket(au, (a: any) => a.entity);
    const auByUser = bucket(au, (a: any) => a.user_email);
    const auUniqUsers = new Set(au.map((a: any) => a.user_id).filter(Boolean)).size;
    const auUniqCos = new Set(au.map((a: any) => a.company_id).filter(Boolean)).size;
    // Daily series
    const day = new Map<string, number>();
    for (const a of au as any[]) { const d = (a.created_at || "").slice(0, 10); day.set(d, (day.get(d) ?? 0) + 1); }
    const auDaily = Array.from(day, ([d, count]) => ({ d, count })).sort((a, b) => a.d.localeCompare(b.d)).slice(-30);

    // RBAC
    const urByRole = bucket(ur, (r: any) => r.role);
    const uniqUsersWithRole = new Set(ur.map((r: any) => r.user_id)).size;
    const uniqProfiles = new Set(pp.map((p: any) => p.profile_id)).size;
    const ovAllow = ov.filter((o: any) => (o.effect ?? "").toLowerCase() === "allow").length;
    const ovDeny = ov.filter((o: any) => (o.effect ?? "").toLowerCase() === "deny").length;
    const pmByModule = bucket(pm, (p: any) => p.module);
    const ppPerProfile = uniqProfiles ? pp.length / uniqProfiles : 0;

    // Dedupe thresholds
    const avgMin = dt.length ? dt.reduce((s, x: any) => s + Number(x.min_pct || 0), 0) / dt.length : 0;
    const avgMax = dt.length ? dt.reduce((s, x: any) => s + Number(x.max_pct || 0), 0) / dt.length : 0;
    const deByState = bucket(de, (e: any) => e.state);
    const deTransitions = de.filter((e: any) => e.prev_state && e.state && e.prev_state !== e.state).length;

    // Webhook event log
    const weByStatus = bucket(we, (w: any) => w.status);
    const weBySource = bucket(we, (w: any) => w.source);
    const weFailed = we.filter((w: any) => w.error || ["failed", "error"].includes((w.status ?? "").toLowerCase())).length;
    const weReplayed = we.filter((w: any) => (w.replay_count ?? 0) > 0 || w.replayed_at).length;

    // Trial abuse
    const taUniqEmail = new Set(ta.map((t: any) => t.email_hash).filter(Boolean)).size;
    const taUniqDoc = new Set(ta.map((t: any) => t.doc_hash).filter(Boolean)).size;
    const taUniqWhats = new Set(ta.map((t: any) => t.whatsapp_hash).filter(Boolean)).size;

    // Agent logs (security/observability of internal agents)
    const agByEvent = bucket(ag, (a: any) => a.event);

    return {
      window: { days: data.days, sinceIso },
      generatedAt: new Date().toISOString(),
      audit: {
        total: au.length, uniqueUsers: auUniqUsers, uniqueCompanies: auUniqCos,
        byAction: auByAction, byEntity: auByEntity, byUser: auByUser, daily: auDaily,
      },
      rbac: {
        roles: ur.length, uniqueUsersWithRole: uniqUsersWithRole, byRole: urByRole,
        permissions: pm.length, byModule: pmByModule,
        profileMappings: pp.length, profiles: uniqProfiles, avgPermsPerProfile: ppPerProfile,
        overrides: ov.length, allow: ovAllow, deny: ovDeny,
      },
      dedupe: {
        users: dt.length, avgMin, avgMax,
        auditChanges: da.length, events: de.length, transitions: deTransitions,
        byState: deByState,
      },
      retention: { total: nr.length, last: nr.slice(0, 5).map((r: any) => ({ id: r.id, email: r.changed_by_email, previous: r.previous_days, next: r.new_days, reason: r.reason, at: r.created_at })) },
      webhooks: { total: we.length, failed: weFailed, replayed: weReplayed, byStatus: weByStatus, bySource: weBySource },
      trialAbuse: { total: ta.length, uniqueEmail: taUniqEmail, uniqueDoc: taUniqDoc, uniqueWhats: taUniqWhats },
      agents: { logs: ag.length, byEvent: agByEvent },
    };
  });
