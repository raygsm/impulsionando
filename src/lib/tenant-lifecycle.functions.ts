import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tenant Lifecycle Cockpit — Fase 40.
 * Onboarding, trials, contratos próximos do vencimento, suspensões, migrations.
 */
export const getTenantLifecycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = new Date();
    const nowIso = now.toISOString();
    const in7Iso = new Date(now.getTime() + 7 * 86400000).toISOString();
    const in30Iso = new Date(now.getTime() + 30 * 86400000).toISOString();
    const last30Iso = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [companiesRes, checklistRes, trialsRes, contractsRes, suspRes, migRes, domainRes, emailRes] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, name, is_active, is_demo, status, created_at, migration_status")
        .neq("is_demo", true)
        .limit(5000),
      supabaseAdmin
        .from("onboarding_checklist")
        .select("company_id, item_key, status, completed_at, updated_at")
        .limit(20000),
      supabaseAdmin
        .from("trial_subscriptions")
        .select("id, company_id, contact_name, contact_company, contact_email, chosen_plan, status, started_at, ends_at, extended_days")
        .limit(5000),
      supabaseAdmin
        .from("billing_contracts")
        .select("id, company_id, status, next_due_date, recurring_amount, last_paid_at, start_date")
        .limit(10000),
      supabaseAdmin
        .from("billing_suspensions")
        .select("id, company_id, contract_id, reason, suspended_at, reactivated_at")
        .order("suspended_at", { ascending: false })
        .limit(2000),
      supabaseAdmin
        .from("companies_migration_log")
        .select("company_id, step, status, created_at")
        .gte("created_at", last30Iso)
        .limit(5000),
      supabaseAdmin
        .from("onboarding_domain_requests")
        .select("id, company_id, requested_value, status, created_at")
        .neq("status", "completed")
        .limit(500),
      supabaseAdmin
        .from("onboarding_email_requests")
        .select("id, company_id, full_address, status, created_at")
        .neq("status", "completed")
        .limit(500),
    ]);

    const companies = companiesRes.data ?? [];
    const checklist = checklistRes.data ?? [];
    const trials = trialsRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const susp = suspRes.data ?? [];
    const migs = migRes.data ?? [];
    const domainReqs = domainRes.data ?? [];
    const emailReqs = emailRes.data ?? [];

    const compMap = new Map(companies.map((c) => [c.id, c]));
    const totalTenants = companies.length;

    // ---- Onboarding por tenant ----
    const checklistByTenant = new Map<string, { total: number; done: number; lastUpdate: string | null }>();
    for (const c of checklist) {
      if (!c.company_id) continue;
      const cur = checklistByTenant.get(c.company_id) ?? { total: 0, done: 0, lastUpdate: null };
      cur.total++;
      if (c.status === "done" || c.status === "completed" || c.completed_at) cur.done++;
      const u = c.updated_at ?? c.completed_at ?? null;
      if (u && (!cur.lastUpdate || u > cur.lastUpdate)) cur.lastUpdate = u;
      checklistByTenant.set(c.company_id, cur);
    }
    const onboardingInProgress = Array.from(checklistByTenant.entries())
      .map(([cid, v]) => ({
        companyId: cid,
        companyName: compMap.get(cid)?.name ?? "—",
        total: v.total,
        done: v.done,
        pct: v.total ? (v.done / v.total) * 100 : 0,
        lastUpdate: v.lastUpdate,
      }))
      .filter((x) => x.pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 25);

    const onboardingCompleted = Array.from(checklistByTenant.values()).filter((v) => v.total > 0 && v.done === v.total).length;
    const onboardingActive = Array.from(checklistByTenant.values()).filter((v) => v.total > 0 && v.done < v.total).length;

    // ---- Trials ----
    const trialsActive = trials.filter((t) => t.status === "active" || t.status === "ongoing");
    const trialsConverted = trials.filter((t) => t.status === "converted").length;
    const trialsExpired = trials.filter((t) => t.status === "expired").length;
    const trialsExpiringSoon = trialsActive
      .filter((t) => t.ends_at && t.ends_at <= in7Iso && t.ends_at >= nowIso)
      .sort((a, b) => (a.ends_at ?? "").localeCompare(b.ends_at ?? ""))
      .slice(0, 25);

    // ---- Contratos ----
    const activeContracts = contracts.filter((c) => c.status === "active" || c.status === "ativo");
    const dueSoonContracts = activeContracts
      .filter((c) => c.next_due_date && c.next_due_date <= in7Iso)
      .sort((a, b) => (a.next_due_date ?? "").localeCompare(b.next_due_date ?? ""))
      .map((c) => ({
        id: c.id,
        companyId: c.company_id,
        companyName: compMap.get(c.company_id!)?.name ?? "—",
        nextDueDate: c.next_due_date,
        recurringAmount: Number(c.recurring_amount ?? 0),
        lastPaidAt: c.last_paid_at,
      }))
      .slice(0, 25);
    const dueIn30 = activeContracts.filter((c) => c.next_due_date && c.next_due_date <= in30Iso).length;
    const mrrActive = activeContracts.reduce((s, c) => s + Number(c.recurring_amount ?? 0), 0);

    // ---- Suspensões ativas ----
    const activeSusp = susp.filter((s) => !s.reactivated_at);
    const reactivated30 = susp.filter((s) => s.reactivated_at && s.reactivated_at >= last30Iso).length;
    const recentSusp = activeSusp.slice(0, 15).map((s) => ({
      id: s.id,
      companyId: s.company_id,
      companyName: compMap.get(s.company_id!)?.name ?? "—",
      reason: s.reason ?? "—",
      suspendedAt: s.suspended_at,
    }));

    // ---- Migrações em andamento ----
    const migByTenant = new Map<string, { steps: number; lastStatus: string | null; lastAt: string | null }>();
    for (const m of migs) {
      if (!m.company_id) continue;
      const cur = migByTenant.get(m.company_id) ?? { steps: 0, lastStatus: null, lastAt: null };
      cur.steps++;
      if (!cur.lastAt || (m.created_at ?? "") > cur.lastAt) {
        cur.lastAt = m.created_at;
        cur.lastStatus = m.status;
      }
      migByTenant.set(m.company_id, cur);
    }
    const migrationsInProgress = Array.from(migByTenant.entries())
      .map(([cid, v]) => ({
        companyId: cid,
        companyName: compMap.get(cid)?.name ?? "—",
        steps: v.steps,
        lastStatus: v.lastStatus,
        lastAt: v.lastAt,
      }))
      .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
      .slice(0, 15);

    // ---- Novos tenants 30d ----
    const newTenants30 = companies.filter((c) => c.created_at >= last30Iso).length;

    return {
      totals: {
        tenants: totalTenants,
        activeTenants: companies.filter((c) => c.is_active).length,
        newTenants30,
        onboardingActive,
        onboardingCompleted,
        trialsActive: trialsActive.length,
        trialsConverted,
        trialsExpired,
        contractsActive: activeContracts.length,
        dueIn7: dueSoonContracts.length,
        dueIn30,
        mrrActive,
        suspActive: activeSusp.length,
        reactivated30,
        domainPending: domainReqs.length,
        emailPending: emailReqs.length,
      },
      onboardingInProgress,
      trialsExpiringSoon: trialsExpiringSoon.map((t) => ({
        id: t.id,
        companyId: t.company_id,
        companyName: compMap.get(t.company_id!)?.name ?? t.contact_company ?? t.contact_name ?? "—",
        contactEmail: t.contact_email,
        chosenPlan: t.chosen_plan,
        endsAt: t.ends_at,
        extendedDays: t.extended_days,
      })),
      dueSoonContracts,
      recentSusp,
      migrationsInProgress,
      onboardingRequests: {
        domains: domainReqs.slice(0, 10).map((d) => ({ ...d, companyName: compMap.get(d.company_id!)?.name ?? "—" })),
        emails: emailReqs.slice(0, 10).map((e) => ({ ...e, companyName: compMap.get(e.company_id!)?.name ?? "—" })),
      },
    };
  });
