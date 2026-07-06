import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Diagnóstico das variáveis de ambiente do Supabase no servidor.
 * NÃO retorna valores — apenas presença, comprimento e primeiros caracteres
 * para permitir identificar rapidamente env vars ausentes ou trocadas.
 */
export const getSupabaseEnvDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  const check = (name: string) => {
    const v = process.env[name];
    return {
      name,
      present: typeof v === "string" && v.length > 0,
      length: v?.length ?? 0,
      preview: v ? `${v.slice(0, 8)}…` : null,
    };
  };
  return {
    timestamp: new Date().toISOString(),
    host: process.env.HOSTNAME ?? null,
    server: [
      check("SUPABASE_URL"),
      check("SUPABASE_PUBLISHABLE_KEY"),
      check("SUPABASE_ANON_KEY"),
      check("SUPABASE_PROJECT_ID"),
      check("SUPABASE_SERVICE_ROLE_KEY"),
    ],
  };
});

/**
 * Presença pública (não sensível) das env vars críticas — usado pelo banner
 * global para todos os usuários autenticados. Retorna apenas booleans.
 */
export const getPublicEnvHealth = createServerFn({ method: "GET" }).handler(async () => {
  return {
    server: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
    },
    host: typeof process.env.HOSTNAME === "string" ? process.env.HOSTNAME : null,
    checked_at: new Date().toISOString(),
  };
});

// Cooldown em memória por worker — evita spam de alertas repetidos.
let lastAlertAt = 0;
const ALERT_COOLDOWN_MS = 15 * 60_000; // 15 min

/**
 * Dispara alerta (webhook Slack/Discord/generic + e-mail via app queue) quando
 * SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY estão ausentes. Apenas admins/staff
 * chegam aqui (a rota /admin/env-diagnostics é gated no beforeLoad).
 */
export const triggerEnvAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { missing: string[]; host: string | null }) => data)
  .handler(async ({ data, context }) => {
    // Autoriza: apenas staff/admin
    const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    if (!staff) {
      const { data: admin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!admin) {
        return { sent: false, reason: "forbidden" as const };
      }
    }

    if (!data.missing.length) return { sent: false, reason: "no_missing" as const };

    const now = Date.now();
    if (now - lastAlertAt < ALERT_COOLDOWN_MS) {
      return { sent: false, reason: "cooldown" as const, retry_in_ms: ALERT_COOLDOWN_MS - (now - lastAlertAt) };
    }

    const webhookUrl = process.env.ENV_ALERT_WEBHOOK_URL;
    const host = data.host ?? "desconhecido";
    const message =
      `⚠️ *Impulsionando — env vars ausentes*\n` +
      `Host: \`${host}\`\n` +
      `Ausentes: ${data.missing.map((m) => `\`${m}\``).join(", ")}\n` +
      `Reportado por: ${context.userId}\n` +
      `Ação: reconectar domínio e republicar (Project Settings → Domains).`;

    const results: { webhook?: string; email?: string } = {};

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: message,
            content: message, // Discord
            attachments: [{ color: "#ef4444", text: message }],
          }),
        });
        results.webhook = res.ok ? "ok" : `http_${res.status}`;
      } catch (err) {
        results.webhook = `error:${(err as Error).message}`;
      }
    } else {
      results.webhook = "skipped_no_ENV_ALERT_WEBHOOK_URL";
    }

    // Best-effort e-mail via fila do app se domínio de e-mail estiver configurado.
    try {
      const { data: enq } = await context.supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          template: "env-alert",
          to: process.env.ENV_ALERT_EMAIL ?? "raygs@hotmail.com",
          subject: `[Impulsionando] Env vars ausentes em ${host}`,
          html: `<pre>${message.replace(/</g, "&lt;")}</pre>`,
        },
      });
      results.email = enq ? "enqueued" : "no_return";
    } catch (err) {
      results.email = `skipped:${(err as Error).message}`;
    }

    lastAlertAt = now;
    return { sent: true, ...results, cooldown_ms: ALERT_COOLDOWN_MS };
  });
