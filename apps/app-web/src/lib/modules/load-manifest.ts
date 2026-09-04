import { cache } from "react";
import { headers } from "next/headers";
import { ApiClientError } from "@impulsionando/api-client";
import type { DashboardManifest } from "@impulsionando/contracts";
import { nestClient } from "@/lib/api/server";
import { composeDashboardManifest } from "@/lib/modules/manifest";
import type { RoleFixture } from "@/lib/modules/catalog";

export type ManifestLoad =
  | { ok: true; manifest: DashboardManifest; tenantId: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "degraded" | "not_configured"; message: string };

export const loadDashboardManifest = cache(async (accessToken: string | null): Promise<ManifestLoad> => {
  if (!accessToken) return { ok: false, reason: "unauthenticated", message: "Sessão ausente" };

  const api = nestClient(accessToken);
  if (!api.client.baseUrl) {
    return { ok: false, reason: "not_configured", message: "NEST_API_BASE não configurado" };
  }

  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0];

  try {
    const ctx = await api.tenants.context(host, accessToken);
    const tenantId = ctx.data.tenant.id;
    const [config, entitlements] = await Promise.all([
      api.tenants.config(tenantId, accessToken),
      api.tenants.entitlements(tenantId, accessToken),
    ]);
    let agent = null;
    try {
      agent = (await api.ai.agent(tenantId, accessToken)).data;
    } catch {
      agent = null;
    }
    const role: RoleFixture = ctx.data.membership.roles.some((r) => /admin|owner|master/i.test(r))
      ? "owner_admin"
      : ctx.data.membership.roles.some((r) => /financ/i.test(r))
        ? "finance_limited"
        : "manager_operator";
    return {
      ok: true,
      tenantId,
      manifest: composeDashboardManifest({
        config: config.data,
        entitlements: entitlements.data,
        agent,
        role,
      }),
    };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.unauthenticated) return { ok: false, reason: "unauthenticated", message: err.message };
      if (err.forbidden) return { ok: false, reason: "forbidden", message: err.message };
      return { ok: false, reason: "degraded", message: err.message };
    }
    return { ok: false, reason: "degraded", message: err instanceof Error ? err.message : "Falha desconhecida" };
  }
});
