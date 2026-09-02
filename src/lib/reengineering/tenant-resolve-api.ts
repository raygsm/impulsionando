/**
 * Phase 4 Tenant resolve API client — server fetch (strangler).
 * Contracts: @impulsionando/tenant-context TenantContext shape.
 */
import type { TenantContext } from "@impulsionando/tenant-context";
import { randomUUID } from "node:crypto";
import { phase3ApiBase } from "./support-api";

/** Server-side: GET resolve from Nest tenants API v1. */
export async function resolveTenantViaNest(
  host: string,
  opts?: { correlationId?: string },
): Promise<TenantContext | null> {
  const base = phase3ApiBase();
  if (!base) return null;

  const correlationId = opts?.correlationId ?? randomUUID();
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-correlation-id": correlationId,
  };

  let res: Response;
  try {
    res = await fetch(
      `${base}/api/v1/tenants/resolve?host=${encodeURIComponent(host)}`,
      { method: "GET", headers },
    );
  } catch (e) {
    console.error("[resolveTenantViaNest] fetch failed", e);
    return null;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    console.error("[resolveTenantViaNest] invalid_json", res.status);
    return null;
  }

  if (!res.ok) {
    const err = body as { error?: { message?: string; code?: string } };
    console.error(
      "[resolveTenantViaNest] nest error",
      err?.error?.code || res.status,
      err?.error?.message,
    );
    return null;
  }

  const data = (body as { data?: TenantContext | null }).data;
  if (data === null || data === undefined) return null;
  if (!data.id || !data.name) {
    console.error("[resolveTenantViaNest] invalid_envelope");
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain ?? null,
    domain: data.domain ?? null,
    primary_color: data.primary_color ?? null,
    secondary_color: data.secondary_color ?? null,
    logo_url: data.logo_url ?? null,
    is_active: data.is_active ?? true,
  };
}
