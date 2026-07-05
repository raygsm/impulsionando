/**
 * Server fns para o editor de tenants em /admin/tenants-editor.
 * Somente admins do core podem listar/atualizar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminOrAudit } from "@/lib/security-audit.server";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type TenantRow = {
  id: string;
  name: string;
  trade_name: string | null;
  public_slug: string | null;
  subdomain: string | null;
  domain: string | null;
  segment: string | null;
  address_city: string | null;
  address_state: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  tagline: string | null;
  vitrine_enabled: boolean;
  status: string;
  environment: string;
};

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies",
      metadata: { source: "tenants-editor" },
    });
    const { data, error } = await context.supabase
      .from("companies")
      .select(
        "id,name,trade_name,public_slug,subdomain,domain,segment,address_city,address_state,whatsapp,phone,email,website,logo_url,tagline,vitrine_enabled,status,environment",
      )
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);
    return { tenants: (data ?? []) as TenantRow[] };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  public_slug: z.string().trim().min(2).max(60).regex(SLUG_RE, "Slug: use apenas a-z, 0-9 e hífen").nullable().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  trade_name: z.string().trim().max(200).nullable().optional(),
  segment: z.string().trim().max(80).nullable().optional(),
  address_city: z.string().trim().max(120).nullable().optional(),
  address_state: z.string().trim().max(2).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email("E-mail inválido").max(160).nullable().optional().or(z.literal("")),
  website: z.string().trim().url("URL inválida").max(400).nullable().optional().or(z.literal("")),
  logo_url: z.string().trim().url("URL inválida").max(600).nullable().optional().or(z.literal("")),
  tagline: z.string().trim().max(240).nullable().optional(),
  domain: z.string().trim().max(200).nullable().optional(),
  vitrine_enabled: z.boolean().optional(),
});

export const updateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateSchema.parse(data))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies",
      entityId: data.id,
      metadata: { source: "tenants-editor", op: "update" },
    });

    const { id, ...rawPatch } = data;
    // Normaliza strings vazias em null (para campos opcionais)
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawPatch)) {
      if (v === undefined) continue;
      patch[k] = v === "" ? null : v;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (context.supabase
      .from("companies")
      .update(patch as any)
      .eq("id", id)
      .select("id,public_slug,domain,vitrine_enabled,logo_url,whatsapp,email,website")
      .single());
    if (error) throw new Error(error.message);
    return { tenant: updated };
  });

/**
 * Faz uma sondagem HTTP real (server-side, sem CORS) contra o host informado
 * para diagnosticar se o subdomínio responde e para onde. Retorna status,
 * headers relevantes, tempo de resposta e URL final após redirects.
 */
export const probeSubdomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      host: z.string().trim().min(3).max(253),
      path: z.string().trim().max(400).optional(),
    }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies",
      metadata: { source: "tenants-editor", op: "probe-subdomain", host: data.host },
    });

    const path = data.path?.startsWith("/") ? data.path : `/${data.path ?? ""}`;
    const url = `https://${data.host}${path}`;
    const started = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Impulsionando-SubdomainProbe/1.0" },
      });
      clearTimeout(timeout);
      const elapsed = Date.now() - started;

      const headers: Record<string, string> = {};
      for (const key of ["content-type", "server", "x-powered-by", "cf-ray", "location"]) {
        const v = res.headers.get(key);
        if (v) headers[key] = v;
      }

      let bodyPreview: string | null = null;
      try {
        const text = await res.text();
        bodyPreview = text.slice(0, 400);
      } catch { /* ignore */ }

      const diagnosis =
        res.status >= 200 && res.status < 400
          ? "OK — host responde. Verifique se o conteúdo carregado é a app Impulsionando."
          : res.status === 404
            ? "404 — o host resolveu, mas a app não conhece esta rota/host. Falta adicionar o wildcard no Publish/Custom Domain."
            : res.status === 502 || res.status === 503
              ? "Erro de gateway — DNS OK, mas o backend está indisponível."
              : `HTTP ${res.status} — resposta inesperada.`;

      return {
        ok: res.ok,
        url,
        finalUrl: res.url,
        status: res.status,
        statusText: res.statusText,
        elapsedMs: elapsed,
        headers,
        bodyPreview,
        diagnosis,
      };
    } catch (e) {
      const msg = (e as Error).message;
      const isDns = /getaddrinfo|ENOTFOUND|ENOENT|EAI_AGAIN/i.test(msg);
      const isCert = /certificate|SSL|TLS/i.test(msg);
      const isTimeout = /abort|timeout/i.test(msg);
      return {
        ok: false,
        url,
        finalUrl: null,
        status: null,
        statusText: null,
        elapsedMs: Date.now() - started,
        headers: {} as Record<string, string>,
        bodyPreview: null,
        diagnosis: isDns
          ? "DNS não resolveu — falta o registro A wildcard *.impulsionando.com.br → 185.158.133.1."
          : isCert
            ? "TLS/certificado inválido — o wildcard ainda não foi provisionado (aguarde ou reconecte o domínio)."
            : isTimeout
              ? "Timeout — DNS pode ter resolvido mas o servidor não respondeu em 8s."
              : `Falha de rede: ${msg}`,
      };
    }
  });

// ---------------------------------------------------------------------------
// Sugestões de defaults para preencher campos faltantes da vitrine.
// ---------------------------------------------------------------------------

export type TenantSuggestion = {
  field: keyof TenantRow;
  currentValue: string | boolean | null;
  suggestedValue: string | boolean;
  reason: string;
  autoApplyable: boolean;
};

function buildSuggestions(t: TenantRow): TenantSuggestion[] {
  const suggestions: TenantSuggestion[] = [];
  const base = (t.trade_name || t.name || "").trim();
  const slug = t.public_slug || (base ? slugify(base) : "");

  if (!t.public_slug && slug) {
    suggestions.push({
      field: "public_slug",
      currentValue: t.public_slug,
      suggestedValue: slug,
      reason: `Derivado de "${base}".`,
      autoApplyable: true,
    });
  }
  if (!t.trade_name && t.name) {
    suggestions.push({
      field: "trade_name",
      currentValue: t.trade_name,
      suggestedValue: t.name,
      reason: "Usa o nome legal como nome fantasia.",
      autoApplyable: true,
    });
  }
  const targetDomain = slug ? `${slug}.impulsionando.com.br` : "";
  if (!t.domain && targetDomain) {
    suggestions.push({
      field: "domain",
      currentValue: t.domain,
      suggestedValue: targetDomain,
      reason: "Padrão do ecossistema Impulsionando.",
      autoApplyable: true,
    });
  }
  if (!t.tagline && base) {
    suggestions.push({
      field: "tagline",
      currentValue: t.tagline,
      suggestedValue: `${base} — parceiro do ecossistema Impulsionando.`,
      reason: "Placeholder curto para o card da vitrine.",
      autoApplyable: true,
    });
  }
  if (!t.segment) {
    suggestions.push({
      field: "segment",
      currentValue: t.segment,
      suggestedValue: "geral",
      reason: "Categoria genérica para não deixar o card sem rótulo.",
      autoApplyable: true,
    });
  }
  if (t.public_slug && !t.vitrine_enabled && t.status === "active") {
    suggestions.push({
      field: "vitrine_enabled",
      currentValue: t.vitrine_enabled,
      suggestedValue: true,
      reason: "Slug OK e tenant ativo — pronto para publicar na vitrine.",
      autoApplyable: false,
    });
  }
  // Campos que exigem intervenção humana — apenas marcam o gap.
  if (!t.whatsapp) suggestions.push({ field: "whatsapp", currentValue: null, suggestedValue: "", reason: "Obrigatório — precisa ser informado manualmente (DDI+DDD).", autoApplyable: false });
  if (!t.logo_url) suggestions.push({ field: "logo_url", currentValue: null, suggestedValue: "", reason: "Recomendado — fornecer URL do logo (https://…).", autoApplyable: false });
  if (!t.website) suggestions.push({ field: "website", currentValue: null, suggestedValue: "", reason: "Recomendado — informar site oficial.", autoApplyable: false });

  return suggestions;
}

export const suggestTenantDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies", entityId: data.id, metadata: { source: "tenants-editor", op: "suggest" },
    });
    const { data: row, error } = await context.supabase
      .from("companies")
      .select("id,name,trade_name,public_slug,subdomain,domain,segment,address_city,address_state,whatsapp,phone,email,website,logo_url,tagline,vitrine_enabled,status,environment")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { suggestions: buildSuggestions(row as TenantRow) };
  });

export const applyTenantDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    fields: z.array(z.string()).min(1),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies", entityId: data.id, metadata: { source: "tenants-editor", op: "apply-defaults", fields: data.fields },
    });
    const { data: row, error: readErr } = await context.supabase
      .from("companies")
      .select("id,name,trade_name,public_slug,subdomain,domain,segment,address_city,address_state,whatsapp,phone,email,website,logo_url,tagline,vitrine_enabled,status,environment")
      .eq("id", data.id).single();
    if (readErr) throw new Error(readErr.message);
    const suggestions = buildSuggestions(row as TenantRow);
    const allow = new Set(data.fields);
    const patch: Record<string, string | boolean> = {};
    for (const s of suggestions) {
      if (!s.autoApplyable) continue;
      if (!allow.has(String(s.field))) continue;
      patch[s.field as string] = s.suggestedValue as string | boolean;
    }
    if (Object.keys(patch).length === 0) return { applied: 0, patch: {} as Record<string, string | boolean> };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase.from("companies").update(patch as any).eq("id", data.id));
    if (error) throw new Error(error.message);
    return { applied: Object.keys(patch).length, patch };
  });

// ---------------------------------------------------------------------------
// Histórico de sondagens de subdomínio (persistência).
// ---------------------------------------------------------------------------

const probeSaveSchema = z.object({
  companyId: z.string().uuid(),
  host: z.string(),
  path: z.string().default("/"),
  url: z.string(),
  finalUrl: z.string().nullable(),
  status: z.number().int().nullable(),
  statusText: z.string().nullable(),
  ok: z.boolean(),
  elapsedMs: z.number().int().nullable(),
  headers: z.record(z.string(), z.string()).default({}),
  bodyPreview: z.string().nullable(),
  diagnosis: z.string().nullable(),
  attempt: z.number().int().min(1).max(20).default(1),
  triggeredBy: z.enum(["manual", "auto-retry", "export"]).default("manual"),
});

export const saveProbeResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => probeSaveSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "tenant_subdomain_probes", entityId: data.companyId, metadata: { source: "tenants-editor", op: "save-probe" },
    });
    const { error } = await context.supabase.from("tenant_subdomain_probes").insert({
      company_id: data.companyId,
      host: data.host,
      path: data.path,
      url: data.url,
      final_url: data.finalUrl,
      status: data.status,
      status_text: data.statusText,
      ok: data.ok,
      elapsed_ms: data.elapsedMs,
      headers: data.headers,
      body_preview: data.bodyPreview,
      diagnosis: data.diagnosis,
      attempt: data.attempt,
      triggered_by: data.triggeredBy,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProbeHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(15),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "tenant_subdomain_probes", entityId: data.companyId, metadata: { source: "tenants-editor", op: "list-probes" },
    });
    const { data: rows, error } = await context.supabase
      .from("tenant_subdomain_probes")
      .select("id,host,path,url,final_url,status,status_text,ok,elapsed_ms,diagnosis,attempt,triggered_by,created_at")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { history: rows ?? [] };
  });

// ---------------------------------------------------------------------------
// Exportação consolidada — validação + último diagnóstico por tenant.
// ---------------------------------------------------------------------------

export const exportTenantsDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      entity: "companies", metadata: { source: "tenants-editor", op: "export-diagnostic" },
    });

    const { data: tenants, error } = await context.supabase
      .from("companies")
      .select("id,name,trade_name,public_slug,subdomain,domain,segment,address_city,address_state,whatsapp,phone,email,website,logo_url,tagline,vitrine_enabled,status,environment")
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);

    const ids = (tenants ?? []).map((t) => t.id);
    const lastProbes: Record<string, {
      status: number | null; ok: boolean; elapsed_ms: number | null;
      diagnosis: string | null; final_url: string | null; created_at: string;
    }> = {};

    if (ids.length > 0) {
      const { data: probes } = await context.supabase
        .from("tenant_subdomain_probes")
        .select("company_id,status,ok,elapsed_ms,diagnosis,final_url,created_at")
        .in("company_id", ids)
        .order("created_at", { ascending: false });
      for (const p of probes ?? []) {
        if (!lastProbes[p.company_id]) {
          lastProbes[p.company_id] = {
            status: p.status,
            ok: p.ok,
            elapsed_ms: p.elapsed_ms,
            diagnosis: p.diagnosis,
            final_url: p.final_url,
            created_at: p.created_at,
          };
        }
      }
    }

    const rows = (tenants ?? []).map((t) => {
      const requiredMissing: string[] = [];
      const recommendedMissing: string[] = [];
      if (!t.public_slug) requiredMissing.push("public_slug");
      if (!t.name) requiredMissing.push("name");
      if (!t.whatsapp) requiredMissing.push("whatsapp");
      if (!t.vitrine_enabled) requiredMissing.push("vitrine_enabled");
      if (!t.trade_name) recommendedMissing.push("trade_name");
      if (!t.segment) recommendedMissing.push("segment");
      if (!t.address_city) recommendedMissing.push("address_city");
      if (!t.address_state) recommendedMissing.push("address_state");
      if (!t.logo_url) recommendedMissing.push("logo_url");
      if (!t.website) recommendedMissing.push("website");
      if (!t.tagline) recommendedMissing.push("tagline");

      const expectedDomain = t.public_slug ? `${t.public_slug}.impulsionando.com.br` : "";
      const domainMatches = !!expectedDomain && (t.domain ?? "").toLowerCase() === expectedDomain;
      const probe = lastProbes[t.id] ?? null;

      return {
        id: t.id,
        name: t.name,
        trade_name: t.trade_name,
        public_slug: t.public_slug,
        domain: t.domain,
        expected_domain: expectedDomain,
        domain_matches_expected: domainMatches,
        vitrine_enabled: t.vitrine_enabled,
        status: t.status,
        environment: t.environment,
        segment: t.segment,
        city: t.address_city,
        state: t.address_state,
        whatsapp: t.whatsapp,
        email: t.email,
        website: t.website,
        logo_url: t.logo_url,
        tagline: t.tagline,
        card_ready: requiredMissing.length === 0,
        required_missing: requiredMissing,
        recommended_missing: recommendedMissing,
        last_probe_status: probe?.status ?? null,
        last_probe_ok: probe?.ok ?? null,
        last_probe_elapsed_ms: probe?.elapsed_ms ?? null,
        last_probe_diagnosis: probe?.diagnosis ?? null,
        last_probe_final_url: probe?.final_url ?? null,
        last_probe_at: probe?.created_at ?? null,
      };
    });

    return { generatedAt: new Date().toISOString(), rows };
  });

