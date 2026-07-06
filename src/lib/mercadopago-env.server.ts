/**
 * Server-only resolver das credenciais Mercado Pago.
 *
 * Ordem de precedência (Sandbox tem prioridade em preview / dev):
 *   1. MPAGO_CORE_SANDBOX_*   (Sandbox — homologação)
 *   2. MPAGO_CORE_*           (Produção)
 *   3. MERCADOPAGO_*          (legado)
 *
 * O ACCESS_TOKEN nunca deve sair deste módulo em direção ao cliente.
 * Leia sempre dentro de handlers (Worker injeta env por-request).
 */

function pick(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

export function getMpAccessToken(): string | undefined {
  return pick(
    "MPAGO_CORE_SANDBOX_ACCESS_TOKEN",
    "MPAGO_CORE_ACCESS_TOKEN",
    "MERCADOPAGO_ACCESS_TOKEN",
  );
}

export function getMpPublicKey(): string | undefined {
  return pick(
    "MPAGO_CORE_SANDBOX_PUBLIC_KEY",
    "MPAGO_CORE_PUBLIC_KEY",
    "MERCADOPAGO_PUBLIC_KEY",
  );
}

export function getMpWebhookSecret(): string | undefined {
  return pick("MPAGO_CORE_WEBHOOK_SECRET", "MERCADOPAGO_WEBHOOK_SECRET");
}

export function getMpEnvironment(): "sandbox" | "production" | "unknown" | "missing" {
  const t = getMpAccessToken();
  if (!t) return "missing";
  if (t.startsWith("TEST-")) return "sandbox";
  if (t.startsWith("APP_USR-")) {
    // Se veio do slot SANDBOX explícito, tratar como sandbox mesmo com prefixo APP_USR
    // (contas de teste do MP também podem receber tokens APP_USR).
    if (process.env.MPAGO_CORE_SANDBOX_ACCESS_TOKEN?.trim() === t) return "sandbox";
    return "production";
  }
  return "unknown";
}

export function mpCredentialsConfigured(): boolean {
  return !!getMpAccessToken() && !!getMpPublicKey();
}
