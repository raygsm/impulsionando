/**
 * Diagnóstico de integrações — testes reais.
 * N8N, GitHub, Supabase, Mercado Pago, E-mail, Z-API (WhatsApp), Webhooks gerais.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ProbeResult = {
  slug: string;
  name: string;
  ok: boolean;
  configured: boolean;
  missing: string[];
  duration_ms: number;
  details?: any;
  error?: string | null;
  checked_at: string;
};

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) {
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");
  }
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: string; ms: number }> {
  const t = Date.now();
  try {
    const result = await fn();
    return { result, ms: Date.now() - t };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e), ms: Date.now() - t };
  }
}

async function probeN8N(supabaseAdmin: any): Promise<ProbeResult> {
  const { data: integ } = await supabaseAdmin
    .from("core_integrations").select("config").eq("slug", "n8n").maybeSingle();
  const cfg = (integ?.config ?? {}) as any;
  const base = cfg.base_url as string | undefined;
  if (!base) {
    return { slug: "n8n", name: "N8N", ok: false, configured: false, missing: ["config.base_url"], duration_ms: 0, checked_at: new Date().toISOString(), error: "URL base não configurada" };
  }
  const r = await timed(() => fetch(base, { method: "GET" }));
  const webhooks = cfg.webhooks ?? {};
  const expected = [
    "new_customer", "payment_confirmed", "invoice_created", "appointment",
    "lead", "email", "whatsapp",
  ];
  const missingHooks = expected.filter((k) => !webhooks[k]);
  return {
    slug: "n8n",
    name: "N8N",
    ok: !r.error && (r.result as Response).status < 500,
    configured: true,
    missing: missingHooks.map((m) => `webhooks.${m}`),
    duration_ms: r.ms,
    details: { http_status: (r.result as Response | undefined)?.status, webhooks_configured: Object.keys(webhooks) },
    error: r.error ?? null,
    checked_at: new Date().toISOString(),
  };
}

async function probeGitHub(): Promise<ProbeResult> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // owner/name
  if (!token || !repo) {
    return { slug: "github", name: "GitHub", ok: false, configured: false, missing: [!token && "GITHUB_TOKEN", !repo && "GITHUB_REPO"].filter(Boolean) as string[], duration_ms: 0, checked_at: new Date().toISOString(), error: "Credenciais ausentes" };
  }
  const r = await timed(async () => {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "impulsionando-diag" },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body };
  });
  const result = r.result as any;
  return {
    slug: "github", name: "GitHub",
    ok: !!result?.ok,
    configured: true, missing: [],
    duration_ms: r.ms,
    details: { repo, last_commit: result?.body?.[0]?.sha?.slice(0, 7) ?? null, message: result?.body?.[0]?.commit?.message ?? null },
    error: r.error ?? (result?.ok ? null : `HTTP ${result?.status}`),
    checked_at: new Date().toISOString(),
  };
}

async function probeSupabase(supabaseAdmin: any): Promise<ProbeResult> {
  const r = await timed(async () => {
    const { count, error } = await supabaseAdmin
      .from("companies").select("id", { count: "exact", head: true });
    if (error) throw error;
    return { count };
  });
  return {
    slug: "supabase", name: "Supabase / Lovable Cloud",
    ok: !r.error, configured: true, missing: [],
    duration_ms: r.ms,
    details: r.result, error: r.error ?? null,
    checked_at: new Date().toISOString(),
  };
}

async function probeMercadoPago(): Promise<ProbeResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return { slug: "mercadopago", name: "Mercado Pago", ok: false, configured: false, missing: ["MERCADOPAGO_ACCESS_TOKEN"], duration_ms: 0, checked_at: new Date().toISOString(), error: "Token ausente" };
  }
  const r = await timed(async () => {
    const res = await fetch("https://api.mercadopago.com/users/me", { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body };
  });
  const result = r.result as any;
  return {
    slug: "mercadopago", name: "Mercado Pago",
    ok: !!result?.ok, configured: true, missing: [],
    duration_ms: r.ms,
    details: { account_id: result?.body?.id, nickname: result?.body?.nickname, site_id: result?.body?.site_id },
    error: r.error ?? (result?.ok ? null : result?.body?.message ?? `HTTP ${result?.status}`),
    checked_at: new Date().toISOString(),
  };
}

async function probeEmail(supabaseAdmin: any): Promise<ProbeResult> {
  const r = await timed(async () => {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("email_send_log")
      .select("status")
      .gte("created_at", since);
    if (error) throw error;
    const rows = data ?? [];
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
    return { last_24h: rows.length, by_status: by };
  });
  const r2 = r.result as any;
  const failed = (r2?.by_status?.failed ?? 0) + (r2?.by_status?.dlq ?? 0);
  return {
    slug: "email", name: "E-mail (Lovable)",
    ok: !r.error && failed === 0,
    configured: true, missing: [],
    duration_ms: r.ms,
    details: r2,
    error: r.error ?? (failed > 0 ? `${failed} falha(s) nas últimas 24h` : null),
    checked_at: new Date().toISOString(),
  };
}

async function probeZapi(supabaseAdmin: any): Promise<ProbeResult> {
  const instance = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  if (!instance || !token) {
    return { slug: "zapi", name: "WhatsApp / Z-API", ok: false, configured: false, missing: [!instance && "ZAPI_INSTANCE_ID", !token && "ZAPI_TOKEN"].filter(Boolean) as string[], duration_ms: 0, checked_at: new Date().toISOString(), error: "Credenciais Z-API ausentes" };
  }
  const r = await timed(async () => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/status`;
    const res = await fetch(url, { headers: clientToken ? { "Client-Token": clientToken } : {} });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body };
  });
  const result = r.result as any;
  return {
    slug: "zapi", name: "WhatsApp / Z-API",
    ok: !!result?.ok && (result?.body?.connected !== false),
    configured: true, missing: [],
    duration_ms: r.ms,
    details: result?.body,
    error: r.error ?? (result?.ok ? null : `HTTP ${result?.status}`),
    checked_at: new Date().toISOString(),
  };
}

async function probeWebhooks(supabaseAdmin: any): Promise<ProbeResult> {
  const r = await timed(async () => {
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("webhook_runs")
      .select("status")
      .gte("created_at", since);
    if (error) throw error;
    const rows = data ?? [];
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
    return { last_7d: rows.length, by_status: by };
  });
  const r2 = r.result as any;
  const failed = (r2?.by_status?.failed ?? 0) + (r2?.by_status?.error ?? 0);
  return {
    slug: "webhooks", name: "Webhooks gerais",
    ok: !r.error,
    configured: true, missing: [],
    duration_ms: r.ms,
    details: r2,
    error: r.error ?? (failed > 0 ? `${failed} execução(ões) com erro em 7d` : null),
    checked_at: new Date().toISOString(),
  };
}

export const runFullDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results = await Promise.all([
      probeN8N(supabaseAdmin),
      probeGitHub(),
      probeSupabase(supabaseAdmin),
      probeMercadoPago(),
      probeEmail(supabaseAdmin),
      probeZapi(supabaseAdmin),
      probeWebhooks(supabaseAdmin),
    ]);

    // Persist log
    await supabaseAdmin.from("core_integration_logs").insert(
      results.map((r) => ({
        integration_slug: r.slug,
        event_type: "diagnostic",
        status: r.ok ? "success" : "error",
        request: { kind: "full_diagnostic" },
        response: { details: r.details, missing: r.missing },
        error: r.error,
        duration_ms: r.duration_ms,
      })),
    );

    const summary = {
      ok: results.filter((r) => r.ok).map((r) => r.slug),
      failed: results.filter((r) => !r.ok).map((r) => ({ slug: r.slug, error: r.error, missing: r.missing })),
      generated_at: new Date().toISOString(),
    };

    return { results, summary };
  });

export const probeSingleIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ slug: z.enum(["n8n", "github", "supabase", "mercadopago", "email", "zapi", "webhooks"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    switch (data.slug) {
      case "n8n": return probeN8N(supabaseAdmin);
      case "github": return probeGitHub();
      case "supabase": return probeSupabase(supabaseAdmin);
      case "mercadopago": return probeMercadoPago();
      case "email": return probeEmail(supabaseAdmin);
      case "zapi": return probeZapi(supabaseAdmin);
      case "webhooks": return probeWebhooks(supabaseAdmin);
    }
  });
