import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateJsonLd } from "@/lib/seo-jsonld";

const OFFICIAL_HOSTS = new Set([
  "impulsionando.com.br",
  "www.impulsionando.com.br",
]);

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export interface RouteAuditInput {
  route: string; // canonical logical route, ex: "/servicos"
  url: string; // URL absoluta a auditar
}

export interface AuditIssue {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
}

async function followRedirects(startUrl: string, max = 5) {
  const chain: Array<{ status: number; url: string; location?: string }> = [];
  let current = startUrl;
  for (let i = 0; i < max; i++) {
    const res = await fetch(current, { redirect: "manual" });
    const loc = res.headers.get("location") ?? undefined;
    chain.push({ status: res.status, url: current, location: loc });
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    return { chain, finalUrl: current, finalStatus: res.status, finalRes: res };
  }
  return { chain, finalUrl: current, finalStatus: 0, finalRes: null as Response | null };
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  return html.match(re)?.[1] ?? null;
}

function extractCanonical(html: string): string | null {
  return (
    html.match(
      /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    )?.[1] ?? null
  );
}

export const auditRouteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RouteAuditInput) => {
    if (!d?.url) throw new Error("url obrigatório");
    if (!d?.route) throw new Error("route obrigatório");
    try {
      new URL(d.url);
    } catch {
      throw new Error("url inválida");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const issues: AuditIssue[] = [];
    const { chain, finalUrl, finalStatus, finalRes } = await followRedirects(
      data.url,
    );

    // Redirect / status checks
    if (finalStatus === 0 || !finalRes) {
      issues.push({
        level: "error",
        code: "unreachable",
        message: "URL não respondeu após redirects.",
      });
    } else if (finalStatus >= 400) {
      issues.push({
        level: "error",
        code: `http_${finalStatus}`,
        message: `Página retornou HTTP ${finalStatus}.`,
      });
    }
    if (chain.length > 2) {
      issues.push({
        level: "warning",
        code: "redirect_chain",
        message: `Cadeia de ${chain.length} redirects — colapse para no máximo 1.`,
      });
    }

    // Host / oficial-domain check
    try {
      const host = new URL(finalUrl).hostname;
      if (!OFFICIAL_HOSTS.has(host) && !host.endsWith(".impulsionando.com.br")) {
        issues.push({
          level: "warning",
          code: "non_official_host",
          message: `Host final "${host}" não é um domínio oficial Impulsionando.`,
        });
      }
    } catch {
      /* ignore */
    }

    const html = finalRes && finalStatus < 400 ? await finalRes.text() : "";
    const canonicalDeclared = html ? extractCanonical(html) : null;
    const robotsMeta = html ? extractMeta(html, "robots") : null;

    // Canonical checks
    let canonicalEffective: string | null = null;
    let canonicalOk: boolean | null = null;
    if (html) {
      if (!canonicalDeclared) {
        issues.push({
          level: "error",
          code: "canonical_missing",
          message: "Página não declara <link rel='canonical'>.",
        });
      } else {
        try {
          canonicalEffective = new URL(canonicalDeclared, finalUrl).toString();
          canonicalOk = canonicalEffective === finalUrl;
          if (!canonicalOk) {
            issues.push({
              level: "warning",
              code: "canonical_mismatch",
              message: `Canonical (${canonicalEffective}) difere da URL final (${finalUrl}).`,
            });
          }
          const canonHost = new URL(canonicalEffective).hostname;
          if (
            !OFFICIAL_HOSTS.has(canonHost) &&
            !canonHost.endsWith(".impulsionando.com.br")
          ) {
            issues.push({
              level: "error",
              code: "canonical_non_official",
              message: `Canonical aponta para host não oficial: ${canonHost}.`,
            });
          }
        } catch {
          issues.push({
            level: "error",
            code: "canonical_invalid",
            message: `Canonical não é URL válida: ${canonicalDeclared}`,
          });
        }
      }
      if (robotsMeta && /noindex/i.test(robotsMeta)) {
        issues.push({
          level: "warning",
          code: "noindex",
          message: `Página marcada como noindex (${robotsMeta}).`,
        });
      }
    }

    // JSON-LD validation
    const jsonldResults = html ? validateJsonLd(html) : [];
    const jsonldErrors = jsonldResults.reduce(
      (n, r) => n + r.issues.filter((i) => i.level === "error").length,
      0,
    );
    const jsonldWarnings = jsonldResults.reduce(
      (n, r) => n + r.issues.filter((i) => i.level === "warning").length,
      0,
    );
    if (html && jsonldResults.length === 0) {
      issues.push({
        level: "info",
        code: "jsonld_absent",
        message: "Nenhum bloco JSON-LD detectado na página.",
      });
    }

    // Score (100 - penalidades)
    const errors = issues.filter((i) => i.level === "error").length;
    const warnings = issues.filter((i) => i.level === "warning").length;
    const score = Math.max(
      0,
      100 - errors * 25 - warnings * 8 - jsonldErrors * 5 - jsonldWarnings * 2,
    );

    const row = {
      route: data.route,
      url: data.url,
      final_url: finalUrl,
      status_code: finalStatus || null,
      canonical_declared: canonicalDeclared,
      canonical_effective: canonicalEffective,
      canonical_ok: canonicalOk,
      robots_meta: robotsMeta,
      redirect_chain: chain as unknown as any,
      jsonld_blocks: jsonldResults as unknown as any,
      jsonld_errors: jsonldErrors,
      jsonld_warnings: jsonldWarnings,
      issues: issues as unknown as any,
      score,
      created_by: context.userId,
    };

    const { data: inserted, error } = await context.supabase
      .from("seo_route_audits")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const listRouteAuditsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("seo_route_audits")
      .select(
        "id, route, url, final_url, status_code, canonical_ok, score, jsonld_errors, jsonld_warnings, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
