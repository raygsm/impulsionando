/**
 * SMS via Twilio (Connector Gateway) — helper server-only.
 *
 * Requisitos:
 *   - LOVABLE_API_KEY  → autenticação do gateway (auto-provisionado).
 *   - TWILIO_API_KEY   → connection key do Twilio no gateway.
 *   - TWILIO_FROM_PHONE → número Twilio remetente (E.164: +15551234567).
 *
 * Se algum estiver ausente, o helper retorna `{ ok: false, skipped: ... }`
 * em vez de lançar — não derruba o fluxo principal.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Normaliza para E.164 BR (+55DDDNUMERO). */
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
  const lovableKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  const fromPhone = process.env.TWILIO_FROM_PHONE;
  if (!lovableKey) return { ok: false, skipped: "lovable_api_key_missing" };
  if (!twilioKey) return { ok: false, skipped: "twilio_api_key_missing" };
  if (!fromPhone) return { ok: false, skipped: "twilio_from_missing" };

  const to = toE164Brazil(args.to);
  if (!to) return { ok: false, skipped: "invalid_to" };

  // Modo simulação local (testes/preview).
  if (process.env.SMS_SIMULATE === "1") {
    console.log("[sms simulate]", { to, body: args.body.slice(0, 80) });
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: args.body.slice(0, 1000),
      }),
    });
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
