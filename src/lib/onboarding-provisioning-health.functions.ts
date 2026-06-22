import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Onboarding & Tenant Provisioning Cockpit — Fase 76.
 * Consolida checklist de onboarding, requests de domínio/email,
 * identidade de tenant (DNS/SSL), aliases de e-mail, migrações e contratos.
 */
export const getOnboardingProvisioningHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [chkRes, domRes, emailRes, identRes, aliasRes, migRes, docRes, sigRes] = await Promise.all([
      supabaseAdmin.from("onboarding_checklist").select("id, company_id, item_key, status, completed_at, created_at").limit(50000),
      supabaseAdmin.from("onboarding_domain_requests").select("id, company_id, mode, requested_value, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("onboarding_email_requests").select("id, company_id, address_prefix, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_tenant_identity").select("id, company_id, full_domain, custom_domain, dns_status, ssl_status, provisioned_at, ssl_expires_at").limit(20000),
      supabaseAdmin.from("core_tenant_email_aliases").select("id, company_id, purpose, dns_status, is_active, is_default").limit(50000),
      supabaseAdmin.from("companies_migration_log").select("id, company_id, step, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("contract_documents").select("id, company_id, status, generated_at, sent_at, signed_at, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("contract_signatures").select("id, contract_document_id, status, signed_at, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = chkRes.error || domRes.error || emailRes.error || identRes.error || aliasRes.error || migRes.error || docRes.error || sigRes.error;
    if (err) throw new Error(err.message);

    const checklist = chkRes.data ?? [];
    const domReqs = domRes.data ?? [];
    const emailReqs = emailRes.data ?? [];
    const identities = identRes.data ?? [];
    const aliases = aliasRes.data ?? [];
    const migrations = migRes.data ?? [];
    const contracts = docRes.data ?? [];
    const signatures = sigRes.data ?? [];

    // Checklist: completion rate per company
    const companies = new Map<string, { total: number; done: number }>();
    for (const c of checklist) {
      const k = c.company_id || "—";
      const cur = companies.get(k) ?? { total: 0, done: 0 };
      cur.total++;
      if (c.status === "completed" || c.status === "done" || c.completed_at) cur.done++;
      companies.set(k, cur);
    }
    const companiesCount = companies.size;
    const fullyOnboarded = Array.from(companies.values()).filter((v) => v.total > 0 && v.done === v.total).length;
    const avgCompletion = companiesCount
      ? Array.from(companies.values()).reduce((s, v) => s + (v.total ? v.done / v.total : 0), 0) / companiesCount
      : 0;

    // Checklist items breakdown
    const itemMap = new Map<string, { total: number; done: number }>();
    for (const c of checklist) {
      const k = c.item_key || "—";
      const cur = itemMap.get(k) ?? { total: 0, done: 0 };
      cur.total++;
      if (c.status === "completed" || c.status === "done" || c.completed_at) cur.done++;
      itemMap.set(k, cur);
    }
    const itemBreakdown = Array.from(itemMap, ([item, v]) => ({ item, total: v.total, done: v.done, pct: v.total ? v.done / v.total : 0 }))
      .sort((a, b) => b.total - a.total).slice(0, 20);

    // Domain requests
    const domStatus = new Map<string, number>();
    for (const d of domReqs) { const k = d.status || "—"; domStatus.set(k, (domStatus.get(k) ?? 0) + 1); }
    const domStatusList = Array.from(domStatus, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const domModeMap = new Map<string, number>();
    for (const d of domReqs) { const k = d.mode || "—"; domModeMap.set(k, (domModeMap.get(k) ?? 0) + 1); }
    const domModes = Array.from(domModeMap, ([mode, count]) => ({ mode, count })).sort((a, b) => b.count - a.count);

    // Email requests
    const emailStatus = new Map<string, number>();
    for (const e of emailReqs) { const k = e.status || "—"; emailStatus.set(k, (emailStatus.get(k) ?? 0) + 1); }
    const emailStatusList = Array.from(emailStatus, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Tenant identities
    const provisioned = identities.filter((i) => i.provisioned_at).length;
    const customDomains = identities.filter((i) => i.custom_domain).length;
    const dnsMap = new Map<string, number>();
    for (const i of identities) { const k = i.dns_status || "pending"; dnsMap.set(k, (dnsMap.get(k) ?? 0) + 1); }
    const dnsList = Array.from(dnsMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const sslMap = new Map<string, number>();
    for (const i of identities) { const k = i.ssl_status || "pending"; sslMap.set(k, (sslMap.get(k) ?? 0) + 1); }
    const sslList = Array.from(sslMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const now = Date.now();
    const sslExpiringSoon = identities.filter((i) => {
      if (!i.ssl_expires_at) return false;
      const ms = new Date(i.ssl_expires_at).getTime() - now;
      return ms > 0 && ms < 30 * 86400000;
    }).length;

    // Aliases
    const aliasesActive = aliases.filter((a) => a.is_active).length;
    const aliasPurposeMap = new Map<string, number>();
    for (const a of aliases) { const k = a.purpose || "—"; aliasPurposeMap.set(k, (aliasPurposeMap.get(k) ?? 0) + 1); }
    const aliasPurposes = Array.from(aliasPurposeMap, ([purpose, count]) => ({ purpose, count })).sort((a, b) => b.count - a.count);
    const aliasDnsMap = new Map<string, number>();
    for (const a of aliases) { const k = a.dns_status || "pending"; aliasDnsMap.set(k, (aliasDnsMap.get(k) ?? 0) + 1); }
    const aliasDns = Array.from(aliasDnsMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Migrations
    const migStatusMap = new Map<string, number>();
    for (const m of migrations) { const k = m.status || "—"; migStatusMap.set(k, (migStatusMap.get(k) ?? 0) + 1); }
    const migStatusList = Array.from(migStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const migStepMap = new Map<string, number>();
    for (const m of migrations) { const k = m.step || "—"; migStepMap.set(k, (migStepMap.get(k) ?? 0) + 1); }
    const migSteps = Array.from(migStepMap, ([step, count]) => ({ step, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    // Contracts
    const contractsSigned = contracts.filter((c) => c.signed_at).length;
    const contractsSent = contracts.filter((c) => c.sent_at && !c.signed_at).length;
    const contractsPending = contracts.filter((c) => !c.sent_at && !c.signed_at).length;
    const contractStatusMap = new Map<string, number>();
    for (const c of contracts) { const k = c.status || "—"; contractStatusMap.set(k, (contractStatusMap.get(k) ?? 0) + 1); }
    const contractStatusList = Array.from(contractStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Tempo médio gerado→assinado (em horas)
    const signedWithTimes = contracts.filter((c) => c.signed_at && c.generated_at);
    const avgSignHours = signedWithTimes.length
      ? signedWithTimes.reduce((s, c) => s + (new Date(c.signed_at!).getTime() - new Date(c.generated_at!).getTime()), 0) / signedWithTimes.length / 3600000
      : 0;

    const sigCount = signatures.length;
    const sigCompleted = signatures.filter((s) => s.status === "completed" || s.status === "signed" || s.signed_at).length;

    return {
      window: { days: data.days },
      onboarding: {
        companies: companiesCount,
        fullyOnboarded,
        avgCompletion,
        items: itemBreakdown,
      },
      domains: {
        requests: domReqs.length,
        statusBreakdown: domStatusList,
        modes: domModes,
      },
      emails: {
        requests: emailReqs.length,
        statusBreakdown: emailStatusList,
        aliases: aliases.length,
        aliasesActive,
        aliasPurposes,
        aliasDns,
      },
      tenants: {
        total: identities.length,
        provisioned,
        customDomains,
        dnsBreakdown: dnsList,
        sslBreakdown: sslList,
        sslExpiringSoon,
      },
      migrations: {
        events: migrations.length,
        statusBreakdown: migStatusList,
        steps: migSteps,
      },
      contracts: {
        total: contracts.length,
        signed: contractsSigned,
        sent: contractsSent,
        pending: contractsPending,
        statusBreakdown: contractStatusList,
        avgSignHours,
        signatures: sigCount,
        signaturesCompleted: sigCompleted,
      },
      generatedAt: new Date().toISOString(),
    };
  });
