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
  /** Quais canais despachar. Default: ambos se configurados. */
  channels?: { slack?: boolean; email?: boolean };
}

export interface ChannelResult {
  channel: "slack" | "email";
  status: "sent" | "failed" | "skipped";
  error?: string;
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
  const r = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `*${title}*\n${body}` }),
  });
  if (!r.ok) throw new Error(`slack http ${r.status}`);
}

async function sendEmail(to: string, from: string, title: string, body: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) throw new Error("RESEND not configured");
  const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from, to: [to], subject: title, text: body,
      html: `<p><strong>${title}</strong></p><pre>${body}</pre>`,
    }),
  });
  if (!r.ok) throw new Error(`resend http ${r.status}`);
}

export const notifyWhatsAppAlert = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const { title, body } = buildMessage(data);
    const slack = process.env.SLACK_ALERT_WEBHOOK_URL;
    const emailTo = process.env.ALERT_EMAIL_TO;
    const emailFrom = process.env.ALERT_EMAIL_FROM || "alertas@impulsionando.com.br";
    const wantSlack = data.channels?.slack ?? true;
    const wantEmail = data.channels?.email ?? true;
    const results: ChannelResult[] = [];

    if (wantSlack) {
      if (!slack) results.push({ channel: "slack", status: "skipped", error: "SLACK_ALERT_WEBHOOK_URL ausente" });
      else {
        try { await sendSlack(slack, title, body); results.push({ channel: "slack", status: "sent" }); }
        catch (err) { results.push({ channel: "slack", status: "failed", error: err instanceof Error ? err.message : "unknown" }); }
      }
    }
    if (wantEmail) {
      if (!emailTo) results.push({ channel: "email", status: "skipped", error: "ALERT_EMAIL_TO ausente" });
      else {
        try { await sendEmail(emailTo, emailFrom, title, body); results.push({ channel: "email", status: "sent" }); }
        catch (err) { results.push({ channel: "email", status: "failed", error: err instanceof Error ? err.message : "unknown" }); }
      }
    }

    const channels = results.filter((r) => r.status === "sent").map((r) => r.channel);
    const anyFailed = results.some((r) => r.status === "failed");
    const ok = !anyFailed && channels.length > 0;
    const firstError = results.find((r) => r.error)?.error;
    return { ok, channels, results, error: firstError };
  });
