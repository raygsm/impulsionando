/**
 * Phase 4B Nest tenant API clients — config, entitlements, membership context.
 */
import type { TenantConfigV1, TenantEntitlementsV1 } from "@impulsionando/contracts";
import type { ActiveTenantContext } from "@impulsionando/tenant-context";
import { randomUUID } from "node:crypto";
import { phase3ApiBase } from "./support-api";

async function nestGet<T>(
  path: string,
  accessToken: string,
  opts?: { correlationId?: string },
): Promise<T | null> {
  const base = phase3ApiBase();
  if (!base) return null;

  const correlationId = opts?.correlationId ?? randomUUID();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        "x-correlation-id": correlationId,
      },
    });
  } catch (e) {
    console.error("[tenant-api] fetch failed", path, e);
    return null;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return null;
  }

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string } };
    console.error("[tenant-api]", path, err?.error?.code || res.status);
    return null;
  }

  return (body as { data?: T }).data ?? null;
}

export async function fetchTenantConfigViaNest(
  tenantId: string,
  accessToken: string,
): Promise<TenantConfigV1 | null> {
  return nestGet<TenantConfigV1>(`/api/v1/tenants/${tenantId}/config`, accessToken);
}

export async function fetchTenantEntitlementsViaNest(
  tenantId: string,
  accessToken: string,
): Promise<TenantEntitlementsV1 | null> {
  return nestGet<TenantEntitlementsV1>(`/api/v1/tenants/${tenantId}/entitlements`, accessToken);
}

export async function fetchTenantContextViaNest(
  host: string,
  accessToken: string,
): Promise<ActiveTenantContext | null> {
  const data = await nestGet<{ host: string; tenant: ActiveTenantContext["tenant"]; membership: ActiveTenantContext["membership"] }>(
    `/api/v1/tenants/context?host=${encodeURIComponent(host)}`,
    accessToken,
  );
  if (!data) return null;
  return { host: data.host, tenant: data.tenant, membership: data.membership };
}

export type TenantAliasRow = {
  alias_slug: string;
  alias_kind: string;
  is_canonical: boolean;
};

export async function fetchTenantAliasesViaNest(
  tenantId: string,
  accessToken: string,
): Promise<TenantAliasRow[] | null> {
  return nestGet<TenantAliasRow[]>(`/api/v1/tenants/${tenantId}/aliases`, accessToken);
}
