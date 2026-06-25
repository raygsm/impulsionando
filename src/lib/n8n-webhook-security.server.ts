import { createHmac, timingSafeEqual } from "crypto";

export const N8N_SIGNATURE_HEADER = "x-impulsionando-signature";

export type N8nAutomationScope = "tenant" | "core";

export function signN8nPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyN8nSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const normalized = signature.replace(/^sha256=/i, "").trim();
  const expected = signN8nPayload(rawBody, secret);
  const received = Buffer.from(normalized, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export function assertN8nTenantScope(input: {
  scope?: N8nAutomationScope | null;
  tenant_id?: string | null;
  company_id?: string | null;
}) {
  const scope = input.scope ?? "tenant";
  const tenantId = input.tenant_id ?? input.company_id ?? null;

  if (scope === "tenant" && !tenantId) {
    throw new Error("tenant_id_required");
  }

  return { scope, tenantId };
}
