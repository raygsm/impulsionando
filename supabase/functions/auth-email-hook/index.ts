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

const hasBrokenEncoding = (value: string) => /(?:\u00c3.|\u00c2.|\ufffd|\u00e2\u20ac)/u.test(value);

const labels = (brand: string): Record<string, { subject: string; title: string; cta: string }> => ({
  signup: {
    subject: `Confirme seu cadastro \u2014 ${brand}`,
    title: "Confirme seu endere\u00e7o de e-mail",
    cta: "Confirmar cadastro",
  },
  recovery: {
    subject: `Redefini\u00e7\u00e3o de senha \u2014 ${brand}`,
    title: "Redefina sua senha",
    cta: "Redefinir senha",
  },
  magiclink: {
    subject: `Seu acesso seguro \u2014 ${brand}`,
    title: `Acesse sua conta ${brand}`,
    cta: "Acessar com segurança",
  },
  invite: {
    subject: `Convite para ${brand}`,
    title: "Você recebeu um convite",
    cta: "Aceitar convite",
  },
  email_change: {
    subject: `Confirme a altera\u00e7\u00e3o de e-mail \u2014 ${brand}`,
    title: "Confirme seu novo endere\u00e7o de e-mail",
    cta: "Confirmar altera\u00e7\u00e3o",
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

    // Password recovery must always land on the dedicated password form,
    // even if an older caller still supplies /auth as its redirect target.
    const effectiveRedirect = actionType === "recovery"
      ? new URL("/reset-password", redirect.origin)
      : redirect;

    const tokenHash = actionType === "email_change" && emailData.token_hash_new
      ? emailData.token_hash_new
      : emailData.token_hash;
    const supabaseUrl = requiredSecret("SUPABASE_URL");
    const actionUrl = new URL("/auth/v1/verify", supabaseUrl);
    actionUrl.searchParams.set("token", tokenHash);
    actionUrl.searchParams.set("type", actionType);
    actionUrl.searchParams.set("redirect_to", effectiveRedirect.toString());

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
    const subject = copy.subject;
    const plainText = [
      brand,
      "",
      copy.title,
      "",
      "Recebemos uma solicita\u00e7\u00e3o relacionada ao acesso da sua conta.",
      `${copy.cta}: ${actionUrl.toString()}`,
      "",
      "Este link \u00e9 pessoal e tempor\u00e1rio. N\u00e3o o compartilhe.",
      "Se voc\u00ea n\u00e3o solicitou esta a\u00e7\u00e3o, ignore esta mensagem. Sua conta permanecer\u00e1 protegida.",
      "",
      `Precisa de ajuda? ${replyTo}`,
    ].join("\n");
    if (hasBrokenEncoding(subject) || hasBrokenEncoding(plainText)) {
      throw new Error("template_encoding_validation_failed");
    }
    await transporter.sendMail({
      from: `"${brand}" <${senderEmail}>`,
      to: recipient,
      replyTo,
      subject,
      text: plainText,
      html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#eef4f3;font-family:Arial,Helvetica,sans-serif;color:#173a39"><div style="display:none;max-height:0;overflow:hidden">A&ccedil;&atilde;o segura de acesso &agrave; sua conta ${escapeHtml(brand)}.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f3"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d8e5e3;border-radius:20px;overflow:hidden"><tr><td style="height:8px;background:#006b68;font-size:0">&nbsp;</td></tr><tr><td style="padding:34px 36px 14px"><div style="font-size:26px;line-height:1;font-weight:800;letter-spacing:.04em;color:#006b68">${escapeHtml(brand)}</div><div style="margin-top:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6a7f7d">Cuidado, confian&ccedil;a e seguran&ccedil;a</div></td></tr><tr><td style="padding:14px 36px 34px"><h1 style="margin:0 0 16px;font-size:25px;line-height:1.25;color:#143c3a">${escapeHtml(copy.title)}</h1><p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#385654">Recebemos uma solicita&ccedil;&atilde;o relacionada ao acesso da sua conta.</p><p style="margin:0 0 26px;font-size:16px;line-height:1.65;color:#385654">Clique no bot&atilde;o abaixo para continuar em ambiente seguro:</p><p style="margin:0 0 28px"><a href="${safeUrl}" style="display:inline-block;background:#006b68;color:#ffffff;text-decoration:none;padding:15px 24px;border-radius:999px;font-size:16px;font-weight:700">${escapeHtml(copy.cta)}</a></p><div style="padding:16px 18px;background:#f4f8f7;border-left:4px solid #f5b642;border-radius:8px"><p style="margin:0;font-size:14px;line-height:1.55;color:#405c5a"><strong>Seguran&ccedil;a:</strong> este link &eacute; pessoal e tempor&aacute;rio. N&atilde;o o compartilhe. Se voc&ecirc; n&atilde;o solicitou esta a&ccedil;&atilde;o, ignore esta mensagem; sua conta permanecer&aacute; protegida.</p></div><p style="margin:24px 0 8px;font-size:13px;line-height:1.5;color:#627775">Se o bot&atilde;o n&atilde;o funcionar, copie e cole este endere&ccedil;o no navegador:</p><p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5"><a href="${safeUrl}" style="color:#006b68">${safeUrl}</a></p></td></tr><tr><td style="padding:22px 36px;background:#f7faf9;border-top:1px solid #e1eae9"><p style="margin:0 0 6px;font-size:13px;color:#4e6664">Precisa de ajuda? <a href="mailto:${escapeHtml(replyTo)}" style="color:#006b68;font-weight:700">${escapeHtml(replyTo)}</a></p><p style="margin:0;font-size:11px;line-height:1.5;color:#7a8d8b">Mensagem transacional autom&aacute;tica da ${escapeHtml(brand)}. Por seguran&ccedil;a, nunca solicitamos sua senha por e-mail.</p></td></tr></table></td></tr></table></body></html>`,
    });

    return json({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const category = message.startsWith("missing_secret:")
      ? message
      : /signature|webhook|timestamp/i.test(message)
      ? "webhook_signature_invalid"
      : /auth|login|credential|535/i.test(message)
      ? "smtp_authentication_failed"
      : /connect|socket|timeout|network|tls/i.test(message)
      ? "smtp_connection_failed"
      : "email_delivery_failed";
    console.error("auth-email-hook failure", { category, message });
    const status = category.startsWith("missing_secret:")
      ? 501
      : category === "smtp_authentication_failed"
      ? 503
      : category === "smtp_connection_failed"
      ? 504
      : category === "webhook_signature_invalid"
      ? 401
      : 500;
    return json({ error: category }, status);
  }
});
