import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchTenantEntitlementsViaNest } from "@/lib/reengineering/tenant-api";

/**
 * Phase 4B strangler — server-side entitlements from Nest when PHASE3_API_BASE is set.
 * Falls back to null (caller keeps legacy client-side gate).
 */
export const fetchTenantEntitlements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { tenantId: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return null;
    return fetchTenantEntitlementsViaNest(data.tenantId, token);
  });
