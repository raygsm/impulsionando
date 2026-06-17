/**
 * WhatsApp via Z-API — helper server-only.
 *
 * Usa a instância Z-API configurada nos secrets (ZAPI_INSTANCE_ID,
 * ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN) e envia mensagens de texto
 * simples. Falhas são logadas e retornadas como `{ ok: false }` em vez
 * de lançar exceções, para nunca derrubar o fluxo principal.
 */

function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Normaliza para o formato esperado pela Z-API: 55DDDNUMERO. */
export function normalizeBrazilPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const d = digitsOnly(raw);
  if (!d) return null;
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length === 11 || d.length === 10) return `55${d}`;
  return null;
}

export interface ZapiResult {
  ok: boolean;
  status?: number;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export async function sendWhatsappText(args: {
  to: string;
  message: string;
  /** Quando true, não chama a Z-API (modo simulação/teste). */
  simulate?: boolean;
}): Promise<ZapiResult> {
  const phone = normalizeBrazilPhone(args.to);
  if (!phone) return { ok: false, error: "invalid_phone" };

  const instance = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_INSTANCE_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  if (!instance || !token || !clientToken) {
    return { ok: false, error: "zapi_not_configured" };
  }
  if (args.simulate) {
    return { ok: true, simulated: true };
  }
  try {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({ phone, message: args.message }),
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* keep null */
    }
    if (!res.ok) {
      console.warn("zapi send failed", { status: res.status, body: text.slice(0, 500) });
      return { ok: false, status: res.status, error: text.slice(0, 200) };
    }
    return { ok: true, status: res.status, messageId: json?.messageId ?? json?.id };
  } catch (e: any) {
    console.warn("zapi network failure", e);
    return { ok: false, error: e?.message ?? "network_error" };
  }
}
