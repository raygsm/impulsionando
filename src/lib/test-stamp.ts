/**
 * TESTE IMPULSIONANDO — Selo padronizado (P6.8-C)
 *
 * Toda comunicação disparada em jornadas de DEMO / TESTE / TRIAL
 * (email, WhatsApp, in-app, N8N) deve conter este selo, de forma
 * clara, para que o lead entenda que está em ambiente de avaliação
 * do produto Impulsionando — nunca em produção real de terceiros.
 *
 * Uso:
 *   import { TEST_STAMP, applyTestStamp, isTestStampContext } from "@/lib/test-stamp";
 *
 *   const body = applyTestStamp("email", "Olá, seu teste começou...");
 *   // → prefixo + assinatura padronizada
 *
 * Regras:
 *  - NUNCA aplicar em comunicações de cliente pago (assinatura ativa).
 *  - Bypass automático para contas master: raygs@hotmail.com e
 *    raygsmonnerat@gmail.com (usadas para QA sem poluir templates).
 *  - Idempotente: chamar 2x não duplica o selo.
 */

export const TEST_STAMP_LABEL = "TESTE IMPULSIONANDO";
export const TEST_STAMP = `[${TEST_STAMP_LABEL}]`;

const MASTER_BYPASS_EMAILS = new Set([
  "raygs@hotmail.com",
  "raygsmonnerat@gmail.com",
]);

export type TestStampChannel = "email" | "whatsapp" | "sms" | "inapp" | "n8n";

export interface TestStampContext {
  channel: TestStampChannel;
  recipientEmail?: string | null;
  isPaidClient?: boolean;
  isDemo?: boolean;
  isTrial?: boolean;
}

/**
 * Decide se o contexto atual deve receber o selo TESTE IMPULSIONANDO.
 */
export function isTestStampContext(ctx: TestStampContext): boolean {
  if (ctx.isPaidClient) return false;
  const email = (ctx.recipientEmail ?? "").trim().toLowerCase();
  if (email && MASTER_BYPASS_EMAILS.has(email)) return false;
  return Boolean(ctx.isDemo || ctx.isTrial);
}

const CHANNEL_SIGNATURE: Record<TestStampChannel, string> = {
  email:
    "\n\n— Esta é uma comunicação do ambiente de TESTE IMPULSIONANDO. " +
    "Você não é cobrado por esta interação. Para virar cliente, responda esta mensagem ou acesse impulsionando.com.br.",
  whatsapp:
    "\n\n_Mensagem do ambiente TESTE IMPULSIONANDO — sem cobrança. Quer virar cliente? Responda aqui._",
  sms:
    " (Teste Impulsionando)",
  inapp:
    "",
  n8n:
    "\n\n[fluxo: TESTE IMPULSIONANDO]",
};

/**
 * Aplica o selo TESTE IMPULSIONANDO ao corpo/texto.
 * Idempotente: se já houver o selo, não duplica.
 */
export function applyTestStamp(
  channel: TestStampChannel,
  body: string,
  opts?: { subject?: string },
): { body: string; subject?: string } {
  const hasStamp = body.includes(TEST_STAMP_LABEL);
  const signature = CHANNEL_SIGNATURE[channel] ?? "";
  const nextBody = hasStamp
    ? body
    : `${TEST_STAMP} ${body}${signature}`;

  let nextSubject = opts?.subject;
  if (nextSubject && !nextSubject.includes(TEST_STAMP_LABEL)) {
    nextSubject = `${TEST_STAMP} ${nextSubject}`;
  }

  return { body: nextBody, subject: nextSubject };
}

/**
 * Retorna o selo pronto para renderização em UI (badge/chip).
 */
export function getTestStampBadge(): {
  label: string;
  tone: "warning";
  helper: string;
} {
  return {
    label: TEST_STAMP_LABEL,
    tone: "warning",
    helper:
      "Você está em ambiente de teste. Nenhuma cobrança será realizada até assinar um plano.",
  };
}
