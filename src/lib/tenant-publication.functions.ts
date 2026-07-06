/**
 * Módulo Core → Publicação — server fns.
 *
 * Executa as 6 validações (domínio, DNS, SSL, Supabase, GitHub, envs) e
 * persiste o estado por tenant em `core_tenant_publication_state`.
 * Toda ação sensível é auditada em `audit_logs`.
 *
 * RLS já restringe a admins (has_role); ainda assim reforçamos com
 * `assertCoreHealthAccess` para respostas 403 claras.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCoreHealthAccess } from "@/lib/core-rbac.functions";

const LOVABLE_IP = "185.158.133.1";
const LOVABLE_HOST = "impulsionando.lovable.app";
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const REQUIRED_ENVS = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export type CheckResult = { ok: boolean; detail?: string; checked_at: string };
export type ValidationDetail = {
  domain?: CheckResult;
  dns?: CheckResult;
  ssl?: CheckResult;
  supabase?: CheckResult;
  github?: CheckResult;
  env?: CheckResult;
};

async function resolveDns(host: string, type: "A" | "CNAME" | "TXT"): Promise<string[]> {
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
      { headers: { accept: "application/dns-json" } },
    );
    const j: any = await r.json();
    return (j.Answer ?? []).map((a: any) => String(a.data).replace(/\.$/, "").replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

async function checkDomain(domain: string | null): Promise<CheckResult> {
  const at = new Date().toISOString();
  if (!domain) return { ok: false, detail: "Nenhum domínio configurado no cadastro do tenant", checked_at: at };
  if (!DOMAIN_RE.test(domain)) return { ok: false, detail: `Formato inválido: ${domain}`, checked_at: at };
  return { ok: true, detail: domain, checked_at: at };
}

async function checkDns(domain: string | null): Promise<CheckResult> {
  const at = new Date().toISOString();
  if (!domain) return { ok: false, detail: "Domínio não configurado", checked_at: at };
  const [a, c, txt, caa] = await Promise.all([
    resolveDns(domain, "A"),
    resolveDns(domain, "CNAME"),
    resolveDns(`_lovable.${domain}`, "TXT"),
    resolveDns(domain, "CAA" as any),
  ]);
  const pointsA = a.includes(LOVABLE_IP);
  const pointsCname = c.some((v) => v === LOVABLE_HOST);
  const hasTxt = txt.some((v) => v.startsWith("lovable_verify="));
  // CAA é opcional. Se existir, precisa autorizar letsencrypt.org (SSL Lovable).
  const caaBlocksLE =
    caa.length > 0 &&
    !caa.some((v) => /issue\s+"?letsencrypt\.org"?/i.test(v) || /issuewild\s+"?letsencrypt\.org"?/i.test(v));
  if (!pointsA && !pointsCname) {
    const seen = [...a, ...c].join(", ") || "nenhum registro";
    return { ok: false, detail: `A/CNAME não apontam para Lovable (visto: ${seen})`, checked_at: at };
  }
  if (!hasTxt) return { ok: false, detail: "TXT _lovable ausente ou não propagado", checked_at: at };
  if (caaBlocksLE)
    return { ok: false, detail: "CAA presente mas não autoriza letsencrypt.org (bloqueia SSL)", checked_at: at };
  const caaNote = caa.length > 0 ? " + CAA→LE" : "";
  return {
    ok: true,
    detail: (pointsA ? "A → Lovable" : "CNAME (proxy)") + " + TXT ok" + caaNote,
    checked_at: at,
  };
}

async function checkSsl(domain: string | null): Promise<CheckResult> {
  const at = new Date().toISOString();
  if (!domain) return { ok: false, detail: "Domínio não configurado", checked_at: at };
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(`https://${domain}/`, { method: "HEAD", signal: controller.signal, redirect: "manual" });
    clearTimeout(t);
    if (r.status === 421 || r.status === 526 || r.status === 525) {
      return { ok: false, detail: `HTTPS respondeu ${r.status} (SSL/binding pendente)`, checked_at: at };
    }
    if (r.status >= 500) return { ok: false, detail: `HTTPS ${r.status}`, checked_at: at };
    return { ok: true, detail: `HTTPS ${r.status}`, checked_at: at };
  } catch (e: any) {
    return { ok: false, detail: `Falha TLS/HTTPS: ${e?.message ?? "erro"}`, checked_at: at };
  }
}

async function checkSupabase(
  supabase: any,
  domain: string | null,
  companyId: string,
): Promise<CheckResult> {
  const at = new Date().toISOString();
  if (!domain) return { ok: false, detail: "Sem domínio para resolver", checked_at: at };
  const { data, error } = await supabase.rpc("resolve_tenant_by_host", { _host: domain });
  if (error) return { ok: false, detail: `RPC erro: ${error.message}`, checked_at: at };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, detail: "RPC não retornou tenant para este domínio", checked_at: at };
  if (row.id !== companyId) return { ok: false, detail: `RPC devolveu outro tenant (${row.id})`, checked_at: at };
  return { ok: true, detail: `Resolve → ${row.name}`, checked_at: at };
}

function checkEnvs(): CheckResult {
  const at = new Date().toISOString();
  const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
  if (missing.length > 0) return { ok: false, detail: `Ausentes: ${missing.join(", ")}`, checked_at: at };
  return { ok: true, detail: `${REQUIRED_ENVS.length} envs presentes`, checked_at: at };
}

async function checkGithub(): Promise<CheckResult> {
  const at = new Date().toISOString();
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/name"
  if (!token || !repo) return { ok: true, detail: "GitHub não configurado (skip)", checked_at: at };
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/commits/main/status`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
    });
    if (!r.ok) return { ok: false, detail: `GitHub API ${r.status}`, checked_at: at };
    const j: any = await r.json();
    if (j.state === "success") return { ok: true, detail: `main: ${j.state}`, checked_at: at };
    return { ok: false, detail: `main: ${j.state}`, checked_at: at };
  } catch (e: any) {
    return { ok: false, detail: `GitHub erro: ${e?.message ?? "erro"}`, checked_at: at };
  }
}

export const validateTenantPublication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreHealthAccess(context);
    const { supabase, userId } = context;

    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, domain, subdomain")
      .eq("id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!company) throw new Error("Tenant não encontrado");

    const [domain, dns, ssl, sb, gh] = await Promise.all([
      checkDomain(company.domain),
      checkDns(company.domain),
      checkSsl(company.domain),
      checkSupabase(supabase, company.domain, company.id),
      checkGithub(),
    ]);
    const env = checkEnvs();

    const detail: ValidationDetail = { domain, dns, ssl, supabase: sb, github: gh, env };
    const now = new Date().toISOString();

    const { data: updated, error: upErr } = await supabase
      .from("core_tenant_publication_state")
      .upsert(
        {
          company_id: company.id,
          domain_ok: domain.ok,
          dns_ok: dns.ok,
          ssl_ok: ssl.ok,
          supabase_ok: sb.ok,
          github_ok: gh.ok,
          env_ok: env.ok,
          validation_detail: detail as any,
          validated_at: now,
        },
        { onConflict: "company_id" },
      )
      .select("*")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);

    await supabase.from("audit_logs").insert({
      company_id: company.id,
      user_id: userId,
      action: "tenant.publication.validated",
      entity: "core_tenant_publication_state",
      entity_id: company.id,
      after: detail as any,
      metadata: { source: "core/publicacao" },
    });

    return { state: updated, detail };
  });

export const approveTenantPublication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; snapshotId?: string | null }) =>
    z.object({ companyId: z.string().uuid(), snapshotId: z.string().max(200).nullable().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCoreHealthAccess(context);
    const { supabase, userId } = context;

    const { data: prev } = await supabase
      .from("core_tenant_publication_state")
      .select("*")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (!prev) throw new Error("Rode a validação antes de aprovar");
    const allOk = prev.domain_ok && prev.dns_ok && prev.ssl_ok && prev.supabase_ok && prev.env_ok;
    if (!allOk) throw new Error("Nem todas as validações estão verdes");

    const now = new Date().toISOString();
    const snapshotId = data.snapshotId ?? `manual-${now}`;

    const { data: updated, error } = await supabase
      .from("core_tenant_publication_state")
      .update({
        approved_at: now,
        approved_by: userId,
        previous_snapshot_id: prev.snapshot_id ?? null,
        snapshot_id: snapshotId,
      })
      .eq("company_id", data.companyId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      company_id: data.companyId,
      user_id: userId,
      action: "tenant.publication.approved",
      entity: "core_tenant_publication_state",
      entity_id: data.companyId,
      before: prev as any,
      after: updated as any,
      metadata: { snapshot_id: snapshotId, source: "core/publicacao" },
    });
    return { ok: true, state: updated };
  });

export const rollbackTenantPublication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreHealthAccess(context);
    const { supabase, userId } = context;

    const { data: prev } = await supabase
      .from("core_tenant_publication_state")
      .select("*")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (!prev) throw new Error("Nada a reverter");
    if (!prev.previous_snapshot_id) throw new Error("Não há snapshot anterior para rollback");

    const { data: updated, error } = await supabase
      .from("core_tenant_publication_state")
      .update({
        snapshot_id: prev.previous_snapshot_id,
        previous_snapshot_id: prev.snapshot_id,
        approved_at: null,
        approved_by: null,
      })
      .eq("company_id", data.companyId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      company_id: data.companyId,
      user_id: userId,
      action: "tenant.publication.rolled_back",
      entity: "core_tenant_publication_state",
      entity_id: data.companyId,
      before: prev as any,
      after: updated as any,
      metadata: { source: "core/publicacao" },
    });
    return { ok: true, state: updated };
  });

export const listTenantPublications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCoreHealthAccess(context);
    const { supabase } = context;
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, domain, subdomain, environment, is_active")
      .eq("is_active", true)
      .eq("is_master", false)
      .neq("environment", "demo")
      .order("name");
    if (error) throw new Error(error.message);

    const ids = (companies ?? []).map((c) => c.id);
    const { data: states } = await supabase
      .from("core_tenant_publication_state")
      .select("*")
      .in("company_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const byId = new Map((states ?? []).map((s: any) => [s.company_id, s]));

    return (companies ?? []).map((c) => ({ company: c, state: byId.get(c.id) ?? null }));
  });
