import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { Webhook } from "npm:standardwebhooks@1.0.0";

type HookPayload = {
  user: { email?: string; new_email?: string };
  email_data: {
    token_hash: string;
    token_hash_new?: string;
    redirect_to?: string;
    site_url?: string;
    email_action_type: string;
  };
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const labels = (brand: string): Record<string, { subject: string; title: string; cta: string }> => ({
  signup: {
    subject: `Confirme seu cadastro — ${brand}`,
    title: "Confirme seu endereço de e-mail",
    cta: "Confirmar cadastro",
  },
  recovery: {
    subject: `Redefinição de senha — ${brand}`,
    title: "Redefina sua senha",
    cta: "Redefinir senha",
  },
  magiclink: {
    subject: `Seu acesso seguro — ${brand}`,
    title: `Acesse sua conta ${brand}`,
    cta: "Acessar com segurança",
  },
  invite: {
    subject: `Convite para ${brand}`,
    title: "Você recebeu um convite",
    cta: "Aceitar convite",
  },
  email_change: {
    subject: `Confirme a alteração de e-mail — ${brand}`,
    title: "Confirme seu novo endereço de e-mail",
    cta: "Confirmar alteração",
  },
});

function requiredSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_secret:${name}`);
  return value;
}

function verifiedPayload(req: Request, rawBody: string): HookPayload {
  const configured = requiredSecret("SEND_EMAIL_HOOK_SECRET");
  const secret = configured.replace(/^v1,whsec_/, "");
  const webhook = new Webhook(secret);
  return webhook.verify(rawBody, {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
  }) as HookPayload;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const rawBody = await req.text();
    const payload = verifiedPayload(req, rawBody);
    const emailData = payload.email_data;
    const redirect = new URL(emailData.redirect_to || emailData.site_url || "");

    // Fail closed: route only official Impulsionando origins accepted by Auth.
    // Tenant selection never trusts user metadata.
    const isOfficialOrigin = redirect.protocol === "https:"
      && (redirect.hostname === "impulsionando.com.br" || redirect.hostname.endsWith(".impulsionando.com.br"));
    if (!isOfficialOrigin) {
      return json({ error: "unconfigured_tenant_origin" }, 422);
    }

    const isChrismed = redirect.hostname === "chrismed.impulsionando.com.br";
    const brand = isChrismed ? "CHRISMED" : "Impulsionando";
    const senderEmail = requiredSecret(isChrismed ? "CHRISMED_SMTP_USERNAME" : "IMPULSIONANDO_SMTP_USERNAME");
    const senderPassword = requiredSecret(isChrismed ? "CHRISMED_SMTP_PASSWORD" : "IMPULSIONANDO_SMTP_PASSWORD");
    const replyTo = isChrismed ? "sac@chrismed.com.br" : "sac@impulsionando.com.br";

    const recipient = emailData.email_action_type === "email_change"
      ? payload.user.new_email || payload.user.email
      : payload.user.email;
    if (!recipient) return json({ error: "recipient_missing" }, 422);

    const actionType = emailData.email_action_type;
    const copy = labels(brand)[actionType];
    if (!copy) return json({ error: "unsupported_email_action" }, 422);

    const tokenHash = actionType === "email_change" && emailData.token_hash_new
      ? emailData.token_hash_new
      : emailData.token_hash;
    const supabaseUrl = requiredSecret("SUPABASE_URL");
    const actionUrl = new URL("/auth/v1/verify", supabaseUrl);
    actionUrl.searchParams.set("token", tokenHash);
    actionUrl.searchParams.set("type", actionType);
    actionUrl.searchParams.set("redirect_to", redirect.toString());

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: { user: senderEmail, pass: senderPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    const safeUrl = escapeHtml(actionUrl.toString());
    await transporter.sendMail({
      from: `"${brand}" <${senderEmail}>`,
      to: recipient,
      replyTo,
      subject: copy.subject,
      text: `${copy.title}\n\n${copy.cta}: ${actionUrl.toString()}\n\nSe você não solicitou esta ação, ignore esta mensagem.`,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f7f7;font-family:Arial,sans-serif;color:#153b3a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #dbe7e6"><tr><td style="padding:32px"><div style="font-size:24px;font-weight:700;color:#006b68">${escapeHtml(brand)}</div><h1 style="font-size:22px;margin:24px 0 12px">${escapeHtml(copy.title)}</h1><p style="line-height:1.6">Use o botão abaixo para concluir esta ação com segurança.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#006b68;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">${escapeHtml(copy.cta)}</a></p><p style="font-size:13px;line-height:1.5;color:#526665">Se você não solicitou esta ação, ignore esta mensagem.</p><p style="font-size:12px;color:#71807f;margin-top:28px">${escapeHtml(brand)} · ${escapeHtml(replyTo)}</p></td></tr></table></td></tr></table></body></html>`,
    });

    return json({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("auth-email-hook failure", { message });
    return json({ error: "email_delivery_failed" }, 500);
  }
});
