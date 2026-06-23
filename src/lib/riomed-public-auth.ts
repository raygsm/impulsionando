import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifica HMAC-SHA256 sobre o body cru com IMPULSIONANDO_WEBHOOK_SECRET
 * (header `x-impulsionando-signature`). Fallback: apikey === SUPABASE_PUBLISHABLE_KEY.
 * Mesma convenção usada em /api/public/hooks/n8n-log.
 */
export function verifyRiomedWebhook(request: Request, rawBody: string): boolean {
  const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
  const sig = request.headers.get("x-impulsionando-signature");
  if (secret && sig) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (anon) {
    const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
    const auth = request.headers.get("authorization");
    if (apikey === anon || auth?.toLowerCase() === `bearer ${anon.toLowerCase()}`) return true;
  }
  return false;
}

export const RIOMED_COMPANY_ID = "5bdcdef4-f0dc-4453-b935-a192ad514938";
