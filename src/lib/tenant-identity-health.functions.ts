import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tenant Identity & Branding Cockpit — Fase 82.
 * Companies (tenants do core Impulsionando), identity (domínio/DNS/SSL),
 * email aliases, settings, units, niches/macro/subnichos e log de migração.
 */
export const getTenantIdentityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [coRes, idRes, alRes, stRes, unRes, mgRes, niRes, maRes, suRes, smRes] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, is_active, is_demo, is_master, status, company_kind, status_commercial, status_financial, status_technical, environment, release_channel, vitrine_enabled, subdomain, domain, primary_color, logo_url, migration_status, niche_id, subnicho_slug, created_at, consolidated_at").limit(20000),
      supabaseAdmin.from("core_tenant_identity").select("id, company_id, subdomain, custom_domain, dns_status, ssl_status, ssl_expires_at, provisioned_at, dns_last_checked_at, created_at").limit(20000),
      supabaseAdmin.from("core_tenant_email_aliases").select("id, company_id, purpose, dns_status, is_active, is_default, created_at").limit(20000),
      supabaseAdmin.from("company_settings").select("id, company_id, category, key, value_type").limit(50000),
      supabaseAdmin.from("company_units").select("id, company_id, is_active, state").limit(20000),
      supabaseAdmin.from("companies_migration_log").select("id, company_id, step, status, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("niches").select("id, slug, name, is_active, macro_slug").limit(2000),
      supabaseAdmin.from("core_macro_nichos").select("id, slug, nome").limit(500),
      supabaseAdmin.from("core_subnichos").select("id, macro_id, slug, nome").limit(2000),
      supabaseAdmin.from("core_smoke_runs").select("id, niche_slug, success, duration_ms, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = coRes.error || idRes.error || alRes.error || stRes.error || unRes.error || mgRes.error || niRes.error || maRes.error || suRes.error || smRes.error;
    if (err) throw new Error(err.message);

    const co = coRes.data ?? [];
    const id = idRes.data ?? [];
    const al = alRes.data ?? [];
    const st = stRes.data ?? [];
    const un = unRes.data ?? [];
    const mg = mgRes.data ?? [];
    const ni = niRes.data ?? [];
    const ma = maRes.data ?? [];
    const su = suRes.data ?? [];
    const sm = smRes.data ?? [];

    const bucket = <T,>(arr: T[], key: (x: T) => string | null | undefined, top = 12) => {
      const m = new Map<string, number>();
      for (const x of arr) { const k = (key(x) ?? "—") || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, top);
    };

    // Companies
    const coActive = co.filter((c: any) => c.is_active).length;
    const coDemo = co.filter((c: any) => c.is_demo).length;
    const coMaster = co.filter((c: any) => c.is_master).length;
    const coReal = co.filter((c: any) => !c.is_demo).length;
    const coConsolidated = co.filter((c: any) => c.consolidated_at).length;
    const coVitrine = co.filter((c: any) => c.vitrine_enabled).length;
    const coBranded = co.filter((c: any) => c.primary_color && c.logo_url).length;
    const coKinds = bucket(co, (c: any) => c.company_kind);
    const coStatus = bucket(co, (c: any) => c.status);
    const coStatusTech = bucket(co, (c: any) => c.status_technical);
    const coStatusComm = bucket(co, (c: any) => c.status_commercial);
    const coStatusFin = bucket(co, (c: any) => c.status_financial);
    const coEnv = bucket(co, (c: any) => c.environment);
    const coChannel = bucket(co, (c: any) => c.release_channel);

    // Niche distribution (resolve niche_id → slug, fallback subnicho_slug)
    const nicheById = new Map(ni.map((n: any) => [n.id, n]));
    const coNichesMap = new Map<string, number>();
    for (const c of co as any[]) {
      const n = c.niche_id ? nicheById.get(c.niche_id) : null;
      const slug = n ? n.slug : (c.subnicho_slug || "—");
      coNichesMap.set(slug, (coNichesMap.get(slug) ?? 0) + 1);
    }
    const coByNiche = Array.from(coNichesMap, ([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    // Identity / DNS / SSL
    const idCustom = id.filter((x: any) => x.custom_domain).length;
    const idProvisioned = id.filter((x: any) => x.provisioned_at).length;
    const idDns = bucket(id, (x: any) => x.dns_status);
    const idSsl = bucket(id, (x: any) => x.ssl_status);
    const now = Date.now();
    const sslExpiringSoon = id.filter((x: any) => x.ssl_expires_at && new Date(x.ssl_expires_at).getTime() - now < 30 * 86400000 && new Date(x.ssl_expires_at).getTime() > now).length;
    const sslExpired = id.filter((x: any) => x.ssl_expires_at && new Date(x.ssl_expires_at).getTime() < now).length;
    const companiesWithoutIdentity = co.filter((c: any) => !id.find((x: any) => x.company_id === c.id)).length;

    // Email aliases
    const alActive = al.filter((a: any) => a.is_active).length;
    const alDefault = al.filter((a: any) => a.is_default).length;
    const alByPurpose = bucket(al, (a: any) => a.purpose);
    const alDns = bucket(al, (a: any) => a.dns_status);

    // Settings
    const stByCat = bucket(st, (s: any) => s.category);
    const settingsPerCompany = (() => {
      const m = new Map<string, number>();
      for (const s of st as any[]) m.set(s.company_id, (m.get(s.company_id) ?? 0) + 1);
      return m.size ? Array.from(m.values()).reduce((a, b) => a + b, 0) / m.size : 0;
    })();

    // Units
    const unActive = un.filter((u: any) => u.is_active).length;
    const unByState = bucket(un, (u: any) => u.state);

    // Migration log
    const mgByStep = bucket(mg, (x: any) => x.step);
    const mgByStatus = bucket(mg, (x: any) => x.status);
    const mgFailed = mg.filter((x: any) => (x.status ?? "").toLowerCase().includes("fail") || (x.status ?? "").toLowerCase().includes("error")).length;

    // Smoke runs por nicho
    const smSuccess = sm.filter((s: any) => s.success).length;
    const smByNiche = (() => {
      const m = new Map<string, { count: number; ok: number; sumMs: number }>();
      for (const s of sm as any[]) {
        const k = s.niche_slug || "—";
        const cur = m.get(k) ?? { count: 0, ok: 0, sumMs: 0 };
        cur.count++;
        if (s.success) cur.ok++;
        cur.sumMs += Number(s.duration_ms || 0);
        m.set(k, cur);
      }
      return Array.from(m, ([k, v]) => ({ k, count: v.count, ok: v.ok, avgMs: v.count ? v.sumMs / v.count : 0 })).sort((a, b) => b.count - a.count).slice(0, 15);
    })();

    return {
      window: { days: data.days, sinceIso },
      generatedAt: new Date().toISOString(),
      companies: {
        total: co.length, active: coActive, demo: coDemo, real: coReal, master: coMaster,
        consolidated: coConsolidated, vitrine: coVitrine, branded: coBranded,
        kinds: coKinds, statuses: coStatus, statusTech: coStatusTech, statusComm: coStatusComm, statusFin: coStatusFin,
        env: coEnv, channels: coChannel, byNiche: coByNiche,
      },
      identity: {
        total: id.length, customDomains: idCustom, provisioned: idProvisioned,
        sslExpiringSoon, sslExpired, withoutIdentity: companiesWithoutIdentity,
        dnsStatuses: idDns, sslStatuses: idSsl,
      },
      aliases: { total: al.length, active: alActive, defaults: alDefault, byPurpose: alByPurpose, dnsStatuses: alDns },
      settings: { total: st.length, avgPerCompany: settingsPerCompany, byCategory: stByCat },
      units: { total: un.length, active: unActive, byState: unByState },
      migration: { total: mg.length, failed: mgFailed, bySteps: mgByStep, byStatus: mgByStatus },
      taxonomy: { niches: ni.length, activeNiches: ni.filter((n: any) => n.is_active).length, macros: ma.length, subnichos: su.length },
      smoke: { total: sm.length, success: smSuccess, byNiche: smByNiche },
    };
  });
