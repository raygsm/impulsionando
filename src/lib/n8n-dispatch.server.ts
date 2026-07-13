/**
 * Dispatcher server-only para workflows N8N assinados com HMAC.
 * Usa IMPULSIONANDO_WEBHOOK_SECRET (compartilhado com o Function "Verify HMAC"
 * dos workflows). N8N_BASE_URL deve apontar para a instância (ex.:
 * https://n8n.impulsionando.com.br). O path é `/webhook/<slug>`.
 */
import { createHmac } from "crypto";

export async function dispatchN8nSigned(
  slug: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const base = process.env.N8N_BASE_URL?.replace(/\/$/, "");
  const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET;
  if (!base) return { ok: false, status: 0, error: "N8N_BASE_URL not set" };
  if (!secret) return { ok: false, status: 0, error: "IMPULSIONANDO_WEBHOOK_SECRET not set" };

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const resp = await fetch(`${base}/webhook/${slug}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-impulsionando-signature": signature,
      },
      body,
    });
    return { ok: resp.ok, status: resp.status, error: resp.ok ? undefined : await resp.text().catch(() => undefined) };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message ?? String(e) };
  }
}
