/**
 * Onda C — Credenciais próprias de Mercado Pago por cliente.
 * Admin do tenant grava; leitura mascarada para membros.
 * Onda D — Validação de token, teste de webhook e trilha de auditoria
 * para produção.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SaveInput = z.object({
  company_id: z.string().uuid(),
  environment: z.enum(["sandbox", "production"]),
  access_token: z.string().min(10).max(300),
  public_key: z.string().min(10).max(200),
  webhook_secret: z.string().max(300).optional().nullable(),
  user_id_mp: z.string().max(80).optional().nullable(),
});

async function validateMpAccessToken(token: string): Promise<{
  ok: boolean; http_status: number | null; error: string | null; methods_count: number | null;
}> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) {
      const body = (await r.text()).slice(0, 200);
      return { ok: false, http_status: r.status, error: body, methods_count: null };
    }
    const j = (await r.json()) as unknown;
    return { ok: true, http_status: r.status, error: null, methods_count: Array.isArray(j) ? j.length : 0 };
  } catch (e) {
    return { ok: false, http_status: null, error: e instanceof Error ? e.message.slice(0, 200) : "fetch_failed", methods_count: null };
  }
}

export const saveMpagoCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveInput.parse(data))
  .handler(async ({ data, context }) => {
    // Estado anterior (para auditoria)
    const { data: before } = await (context.supabase as any)
      .from("mpago_credentials")
      .select("environment,public_key,active,user_id_mp,webhook_secret_name")
      .eq("company_id", data.company_id)
      .eq("environment", data.environment)
      .maybeSingle();

    // Bloqueio de produção: token precisa ser válido no MP.
    if (data.environment === "production") {
      const check = await validateMpAccessToken(data.access_token);
      if (!check.ok) {
        throw new Error(
          `Access token de produção inválido (HTTP ${check.http_status ?? "?"}). ` +
          `Mercado Pago respondeu: ${check.error ?? "sem detalhes"}. ` +
          `A ativação foi bloqueada para evitar credencial quebrada.`,
        );
      }
    }

    const { data: id, error } = await (context.supabase as any).rpc("save_mpago_credentials", {
      p_company_id: data.company_id,
      p_environment: data.environment,
      p_access_token: data.access_token,
      p_public_key: data.public_key,
      p_webhook_secret: data.webhook_secret ?? null,
      p_user_id_mp: data.user_id_mp ?? null,
    });
    if (error) throw new Error(error.message);

    // Trilha de auditoria — não incluir segredos, apenas metadados.
    const after = {
      environment: data.environment,
      public_key: data.public_key,
      user_id_mp: data.user_id_mp ?? null,
      webhook_configured: !!(data.webhook_secret && data.webhook_secret.length > 0),
      access_token_rotated: true,
      active: true,
    };
    const beforeMeta = before ? {
      environment: before.environment,
      public_key: before.public_key,
      user_id_mp: before.user_id_mp,
      webhook_configured: !!before.webhook_secret_name,
      active: before.active,
    } : null;
    const changed: string[] = [];
    if (!beforeMeta) changed.push("created");
    else {
      if (beforeMeta.public_key !== after.public_key) changed.push("public_key");
      if (beforeMeta.user_id_mp !== after.user_id_mp) changed.push("user_id_mp");
      if (beforeMeta.webhook_configured !== after.webhook_configured) changed.push("webhook_secret");
      if (beforeMeta.active !== after.active) changed.push("active");
      changed.push("access_token");
    }

    await (context.supabase as any).from("audit_logs").insert({
      user_id: context.userId,
      action: beforeMeta ? "mpago_credentials.update" : "mpago_credentials.create",
      entity: "mpago_credentials",
      entity_id: id as string,
      before: beforeMeta,
      after,
      metadata: { company_id: data.company_id, environment: data.environment, changed },
      category: "payments",
      severity: data.environment === "production" ? "warning" : "info",
    });

    return { id: id as string };
  });

export const getMpagoCredentialsMasked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ company_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase as any).rpc("get_mpago_credentials_masked", {
      p_company_id: data.company_id,
    });
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<{
      environment: string; public_key_masked: string | null;
      access_token_configured: boolean; webhook_configured: boolean;
      user_id_mp: string | null; active: boolean; updated_at: string;
    }> };
  });

/**
 * Teste de configuração do webhook para o cliente:
 * - Revela o access_token via RPC service-definer.
 * - Valida o token chamando /v1/payment_methods.
 * - Faz POST no webhook público do cliente com um payload synthetic
 *   e retorna o HTTP status (o handler local valida a assinatura HMAC).
 */
export const testMpagoWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    company_id: z.string().uuid(),
    environment: z.enum(["sandbox", "production"]),
    webhook_url: z.string().url(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;

    // Precisa ser admin do tenant — as próprias RLS/RPC já garantem;
    // fazemos gate extra checando role.
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Somente administradores podem testar o webhook.");

    const tokenName = `mpago:${data.company_id}:${data.environment}:access_token`;
    const whSecretName = `mpago:${data.company_id}:${data.environment}:webhook_secret`;

    const [{ data: token }, { data: whSecret }] = await Promise.all([
      sb.rpc("reveal_secret_value", { p_name: tokenName }),
      sb.rpc("reveal_secret_value", { p_name: whSecretName }),
    ]);

    const tokenCheck = token
      ? await validateMpAccessToken(token as string)
      : { ok: false, http_status: null, error: "access_token não cadastrado", methods_count: null };

    // POST synthetic no webhook do próprio cliente.
    let webhookStatus: number | null = null;
    let webhookError: string | null = null;
    let webhookBody: string | null = null;
    const payload = JSON.stringify({
      type: "test.ping",
      action: "impulsionando.diagnostic",
      data: { id: "diagnostic", ts: new Date().toISOString() },
    });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-impulsionando-test": "true",
      };
      if (whSecret) {
        // HMAC-SHA256 do body — o handler valida com o mesmo esquema.
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", enc.encode(whSecret as string),
          { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
        );
        const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
        const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        headers["x-signature"] = `sha256=${hex}`;
      }
      const r = await fetch(data.webhook_url, {
        method: "POST", headers, body: payload, signal: ctrl.signal,
      });
      clearTimeout(timer);
      webhookStatus = r.status;
      webhookBody = (await r.text()).slice(0, 300);
    } catch (e) {
      webhookError = e instanceof Error ? e.message.slice(0, 200) : "fetch_failed";
    }

    const result = {
      token: tokenCheck,
      webhook: {
        url: data.webhook_url,
        secret_configured: !!whSecret,
        http_status: webhookStatus,
        body: webhookBody,
        error: webhookError,
        // 2xx e 401 (assinatura inválida rejeitada) contam como "endpoint respondeu".
        reachable: webhookStatus !== null,
      },
      ts: new Date().toISOString(),
    };

    await sb.from("audit_logs").insert({
      user_id: context.userId,
      action: "mpago_credentials.test_webhook",
      entity: "mpago_credentials",
      entity_id: null,
      metadata: {
        company_id: data.company_id,
        environment: data.environment,
        token_ok: tokenCheck.ok,
        webhook_status: webhookStatus,
        webhook_secret_configured: !!whSecret,
      },
      category: "payments",
      severity: "info",
    });

    return result;
  });

export const listMpagoAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    company_id: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase as any)
      .from("audit_logs")
      .select("id,action,user_email,user_id,metadata,before,after,severity,created_at")
      .eq("entity", "mpago_credentials")
      .contains("metadata", { company_id: data.company_id })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<{
      id: string; action: string; user_email: string | null; user_id: string | null;
      metadata: any; before: any; after: any; severity: string | null; created_at: string;
    }> };
  });
