/**
 * Server function que entrega alertas de queda de CTR / taxa de envio
 * do WhatsApp oficial via Slack (webhook) e/ou e-mail (Resend gateway).
 *
 * Variáveis de ambiente (opcionais — só dispara o canal configurado):
 *  - SLACK_ALERT_WEBHOOK_URL   → webhook do Slack
 *  - ALERT_EMAIL_TO            → destinatário do e-mail (ex.: ops@impulsionando.com.br)
 *  - ALERT_EMAIL_FROM          → remetente (default: alertas@impulsionando.com.br)
 *  - RESEND_API_KEY            → chave do connector Resend (gateway Lovable)
 *  - LOVABLE_API_KEY           → autenticação do gateway
 */
import { createServerFn } from "@tanstack/react-start";

export interface WhatsAppAlertInput {
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  minCtr: number;
  minSendRate: number;
  windowHours: number;
  origin?: string;
  ctaHash?: string;
  path?: string;
  /** Título já renderizado a partir do template do admin. */
  title?: string;
  /** Corpo já renderizado a partir do template do admin. */
  body?: string;
}

function validate(input: unknown): WhatsAppAlertInput {
  const o = input as WhatsAppAlertInput;
  if (!o || typeof o !== "object") throw new Error("payload inválido");
  return o;
}

function buildMessage(d: WhatsAppAlertInput) {
  if (d.title && d.body) return { title: d.title, body: d.body };
  const reasons: string[] = [];
  if (d.ctrBelow) reasons.push(`CTR ${d.ctr.toFixed(1)}% < limite ${d.minCtr}%`);
  if (d.sendBelow) reasons.push(`Envio ${d.sendRate.toFixed(1)}% < limite ${d.minSendRate}%`);
  const title = d.title ?? `⚠️ WhatsApp Oficial — performance abaixo do limite`;
  const body =
    d.body ??
    `${reasons.join(" | ")}\n` +
      `Janela: ${d.windowHours}h · Impr ${d.impressions} · Cliques ${d.clicks} · Envios ${d.sends}` +
      (d.ctaHash ? `\nCTA hash: ${d.ctaHash}` : "") +
      (d.path ? `\nRota: ${d.path}` : "");
  return { title, body };
}

async function sendSlack(webhook: string, title: string, body: string) {
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `*${title}*\n${body}` }),
  });
}

async function sendEmail(to: string, from: string, title: string, body: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) return;
  await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: title,
      text: body,
      html: `<p><strong>${title}</strong></p><pre>${body}</pre>`,
    }),
  });
}

export const notifyWhatsAppAlert = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const { title, body } = buildMessage(data);
    const slack = process.env.SLACK_ALERT_WEBHOOK_URL;
    const emailTo = process.env.ALERT_EMAIL_TO;
    const emailFrom = process.env.ALERT_EMAIL_FROM || "alertas@impulsionando.com.br";
    const channels: string[] = [];
    try {
      if (slack) {
        await sendSlack(slack, title, body);
        channels.push("slack");
      }
      if (emailTo) {
        await sendEmail(emailTo, emailFrom, title, body);
        channels.push("email");
      }
    } catch (err) {
      return {
        ok: false,
        channels,
        error: err instanceof Error ? err.message : "unknown",
      };
    }
    return { ok: true, channels, configured: channels.length > 0 };
  });
