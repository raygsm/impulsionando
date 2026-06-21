import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Security & Compliance Overview — Fase 28.
 * Consolida sinais de:
 *  - LGPD: requests de exclusão/exportação pendentes, consentimentos
 *  - Credenciais: integrações inativas, sem check recente, SSL/domínios expirando
 *  - Audit: volume 7/30d, anomalias (picos), ações destrutivas
 *  - Auth: contas master, super-admins, MFA (quando disponível)
 */
export const getSecurityCompliance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const d7 = new Date(now - 7 * 86400000).toISOString();
    const d30 = new Date(now - 30 * 86400000).toISOString();
    const d60 = new Date(now - 60 * 86400000).toISOString();
    const in30 = new Date(now + 30 * 86400000).toISOString();

    const [
      delReqRes, expReqRes, consentRes,
      integrationsRes, whatsappCredsRes, domainReqRes,
      audit7Res, audit30Res, audit60Res,
      rolesRes, suspensionsRes,
    ] = await Promise.all([
      supabaseAdmin.from("data_deletion_requests").select("id, status, requested_at, completed_at").limit(500),
      supabaseAdmin.from("data_export_requests").select("id, status, requested_at, completed_at").limit(500),
      supabaseAdmin.from("lgpd_consents").select("id, granted, created_at").gte("created_at", d30).limit(2000),
      supabaseAdmin.from("core_integrations").select("id, provider, scope, is_active, last_check_at, last_error").limit(500),
      supabaseAdmin.from("core_whatsapp_credentials").select("id, company_id, is_active, status, last_validated_at").limit(500),
      supabaseAdmin.from("onboarding_domain_requests").select("id, domain, status, ssl_expires_at").not("ssl_expires_at", "is", null).limit(500),
      supabaseAdmin.from("audit_logs").select("id, action, user_id, created_at").gte("created_at", d7).limit(5000),
      supabaseAdmin.from("audit_logs").select("id, action, user_id, created_at").gte("created_at", d30).limit(10000),
      supabaseAdmin.from("audit_logs").select("id, created_at").gte("created_at", d60).lt("created_at", d30).limit(10000),
      supabaseAdmin.from("user_roles").select("user_id, role").limit(2000),
      supabaseAdmin.from("billing_suspensions").select("id, company_id, resolved_at, created_at").is("resolved_at", null).limit(200),
    ]);

    const delReqs = delReqRes.data ?? [];
    const expReqs = expReqRes.data ?? [];
    const consents = consentRes.data ?? [];
    const integrations = integrationsRes.data ?? [];
    const wa = whatsappCredsRes.data ?? [];
    const domains = domainReqRes.data ?? [];
    const audit7 = audit7Res.data ?? [];
    const audit30 = audit30Res.data ?? [];
    const audit60 = audit60Res.data ?? [];
    const roles = rolesRes.data ?? [];
    const suspensions = suspensionsRes.data ?? [];

    // LGPD
    const isOverdue = (req: any, days = 15) => {
      if (req.status === "completed" || req.completed_at) return false;
      const reqAt = new Date(req.requested_at ?? req.created_at ?? Date.now()).getTime();
      return now - reqAt > days * 86400000;
    };
    const delPending = delReqs.filter((r: any) => r.status !== "completed" && !r.completed_at).length;
    const delOverdue = delReqs.filter((r: any) => isOverdue(r)).length;
    const expPending = expReqs.filter((r: any) => r.status !== "completed" && !r.completed_at).length;
    const expOverdue = expReqs.filter((r: any) => isOverdue(r)).length;
    const consentGranted = consents.filter((c: any) => c.granted).length;
    const consentRate = consents.length > 0 ? Math.round((consentGranted / consents.length) * 100) : null;

    // Credenciais & integrações
    const integInactive = integrations.filter((i: any) => i.is_active === false).length;
    const integStale = integrations.filter((i: any) => !i.last_check_at || new Date(i.last_check_at).getTime() < now - 24 * 86400000).length;
    const integErrors = integrations.filter((i: any) => i.last_error).length;
    const waInactive = wa.filter((w: any) => w.is_active === false || w.status !== "connected").length;
    const waStale = wa.filter((w: any) => !w.last_validated_at || new Date(w.last_validated_at).getTime() < now - 7 * 86400000).length;

    // Domínios / SSL
    const sslExpSoon = domains.filter((d: any) => d.ssl_expires_at && d.ssl_expires_at <= in30 && d.ssl_expires_at >= new Date(now).toISOString()).length;
    const sslExpired = domains.filter((d: any) => d.ssl_expires_at && d.ssl_expires_at < new Date(now).toISOString()).length;
    const expiringDomains = domains
      .filter((d: any) => d.ssl_expires_at)
      .sort((a: any, b: any) => (a.ssl_expires_at < b.ssl_expires_at ? -1 : 1))
      .slice(0, 10)
      .map((d: any) => ({
        domain: d.domain,
        ssl_expires_at: d.ssl_expires_at,
        days: Math.round((new Date(d.ssl_expires_at).getTime() - now) / 86400000),
        status: d.status,
      }));

    // Audit volume e anomalia (vs período anterior)
    const auditVolume7 = audit7.length;
    const auditVolume30 = audit30.length;
    const auditVolumePrev30 = audit60.length;
    const auditTrend = auditVolumePrev30 > 0
      ? Math.round(((auditVolume30 - auditVolumePrev30) / auditVolumePrev30) * 100)
      : null;

    // Top ações destrutivas 30d
    const destructiveKeywords = ["delete", "remove", "suspend", "reset", "rotate", "purge", "drop"];
    const destructive = audit30.filter((a: any) => destructiveKeywords.some((k) => (a.action ?? "").toLowerCase().includes(k)));
    const destructiveByAction = new Map<string, number>();
    for (const a of destructive) {
      destructiveByAction.set(a.action, (destructiveByAction.get(a.action) ?? 0) + 1);
    }
    const topDestructive = [...destructiveByAction.entries()]
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top actors 7d
    const actorMap = new Map<string, number>();
    for (const a of audit7) {
      if (!a.user_id) continue;
      actorMap.set(a.user_id, (actorMap.get(a.user_id) ?? 0) + 1);
    }
    const topActors = [...actorMap.entries()]
      .map(([user_id, count]) => ({ user_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Roles
    const roleCount = new Map<string, number>();
    for (const r of roles) roleCount.set(r.role, (roleCount.get(r.role) ?? 0) + 1);
    const rolesBreakdown = [...roleCount.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
    const superAdmins = roleCount.get("super_admin") ?? roleCount.get("super-admin") ?? 0;

    // Alertas
    const alerts: Array<{ severity: "info" | "warn" | "danger"; message: string }> = [];
    if (delOverdue > 0) alerts.push({ severity: "danger", message: `${delOverdue} solicitação(ões) de exclusão LGPD vencida(s) (>15 dias).` });
    if (expOverdue > 0) alerts.push({ severity: "warn", message: `${expOverdue} solicitação(ões) de exportação vencida(s).` });
    if (sslExpired > 0) alerts.push({ severity: "danger", message: `${sslExpired} domínio(s) com SSL EXPIRADO.` });
    if (sslExpSoon > 0) alerts.push({ severity: "warn", message: `${sslExpSoon} domínio(s) com SSL expirando em 30d.` });
    if (integErrors > 0) alerts.push({ severity: "warn", message: `${integErrors} integração(ões) com erro registrado.` });
    if (waInactive > 0) alerts.push({ severity: "warn", message: `${waInactive} credencial(is) WhatsApp inativa(s).` });
    if (auditTrend !== null && auditTrend >= 100) alerts.push({ severity: "info", message: `Volume de audit logs +${auditTrend}% vs período anterior — investigar.` });
    if (superAdmins > 5) alerts.push({ severity: "warn", message: `${superAdmins} super_admins ativos — revisar princípio do menor privilégio.` });
    if (superAdmins === 0) alerts.push({ severity: "danger", message: `Nenhum super_admin definido em user_roles.` });

    return {
      kpis: {
        lgpdDelPending: delPending,
        lgpdDelOverdue: delOverdue,
        lgpdExpPending: expPending,
        lgpdExpOverdue: expOverdue,
        consentRate,
        integTotal: integrations.length,
        integInactive,
        integStale,
        integErrors,
        waInactive,
        waStale,
        sslExpSoon,
        sslExpired,
        auditVolume7,
        auditVolume30,
        auditTrend,
        superAdmins,
        suspensionsOpen: suspensions.length,
      },
      expiringDomains,
      topDestructive,
      topActors,
      rolesBreakdown,
      alerts,
      generatedAt: new Date().toISOString(),
    };
  });
