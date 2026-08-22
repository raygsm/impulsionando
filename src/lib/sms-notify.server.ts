/**
 * SMS via Twilio — helper server-only com integração nativa.
 *
 * Requisitos:
 *   - TWILIO_ACCOUNT_SID
 *   - TWILIO_AUTH_TOKEN
 *   - TWILIO_FROM_PHONE
 *
 * Se algum estiver ausente, o helper retorna `{ ok: false, skipped: ... }`
 * em vez de lançar — não derruba o fluxo principal.
 */

function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

export function toE164Brazil(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("+") && /^\+\d{8,15}$/.test(trimmed)) return trimmed;
  const d = digitsOnly(trimmed);
  if (!d) return null;
  if (d.startsWith("55") && d.length >= 12) return `+${d}`;
  if (d.length === 11 || d.length === 10) return `+55${d}`;
  return null;
}

export interface SmsResult {
  ok: boolean;
  sid?: string;
  status?: number;
  error?: string;
  skipped?: string;
  simulated?: boolean;
}

export async function sendSms(args: {
  to: string;
  body: string;
}): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;
  if (!accountSid) return { ok: false, skipped: "twilio_account_sid_missing" };
  if (!authToken) return { ok: false, skipped: "twilio_auth_token_missing" };
  if (!fromPhone) return { ok: false, skipped: "twilio_from_missing" };

  const to = toE164Brazil(args.to);
  if (!to) return { ok: false, skipped: "invalid_to" };

  if (process.env.SMS_SIMULATE === "1") {
    console.log("[sms simulate]", { to, body: args.body.slice(0, 80) });
    return { ok: true, simulated: true };
  }

  try {
    const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: fromPhone,
          Body: args.body.slice(0, 1000),
        }),
      },
    );
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("[sms twilio] failed", res.status, json);
      return { ok: false, status: res.status, error: json?.message ?? "send_failed" };
    }
    return { ok: true, sid: json?.sid, status: res.status };
  } catch (e: any) {
    console.warn("[sms twilio] exception", e);
    return { ok: false, error: e?.message ?? "fetch_failed" };
  }
}
