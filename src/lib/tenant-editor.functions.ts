/**
 * Server fns para o editor de tenants em /admin/tenants-editor.
 * Somente admins do core podem listar/atualizar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminOrAudit } from "@/lib/security-audit.server";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
