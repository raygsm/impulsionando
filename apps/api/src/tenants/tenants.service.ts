import { Inject, Injectable } from "@nestjs/common";
import type { TenantContext, TenantMembership, TenantMembershipRole } from "@impulsionando/tenant-context";
import { resolveActiveTenant } from "@impulsionando/tenant-context";
import { SupabaseService } from "../supabase/supabase.service";

export class TenantAccessDeniedError extends Error {
  constructor(readonly code: "NO_MEMBERSHIP" | "TENANT_MISMATCH") {
    super(code);
  }
}

@Injectable()
export class TenantsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async resolveByHost(host: string): Promise<TenantContext | null> {
    const { data: rows, error } = await this.supabase
      .admin()
      .rpc("resolve_tenant_by_host", { _host: host });

    if (error) {
      if (error.code === "PGRST202") {
        throw new Error("TENANT_RESOLVE_RPC_MISSING");
      }
      throw new Error(
        `TENANT_RESOLVE_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;

    return {
      id: row.id as string,
      name: row.name as string,
      subdomain: (row.subdomain as string | null) ?? null,
      domain: (row.domain as string | null) ?? null,
      primary_color: (row.primary_color as string | null) ?? null,
      secondary_color: (row.secondary_color as string | null) ?? null,
      logo_url: (row.logo_url as string | null) ?? null,
      is_active: (row.is_active as boolean | undefined) ?? true,
    };
  }

  async loadMemberships(userId: string): Promise<TenantMembership[]> {
    const { data, error } = await this.supabase
      .admin()
      .from("user_roles")
      .select("company_id, role")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`TENANT_MEMBERSHIP_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`);
    }

    const byCompany = new Map<string, TenantMembershipRole[]>();
    for (const row of data ?? []) {
      const companyId = row.company_id as string;
      const role = row.role as TenantMembershipRole;
      const roles = byCompany.get(companyId) ?? [];
      if (!roles.includes(role)) roles.push(role);
      byCompany.set(companyId, roles);
    }

    return [...byCompany.entries()].map(([companyId, roles]) => ({
      companyId,
      roles,
    }));
  }

  async resolveActiveContext(host: string, userId: string) {
    const tenant = await this.resolveByHost(host);
    const memberships = await this.loadMemberships(userId);
    const decision = resolveActiveTenant({
      hostTenantId: tenant?.id ?? null,
      memberships,
    });

    return { tenant, memberships, decision };
  }

  async assertMembership(userId: string, tenantId: string): Promise<TenantMembership> {
    const memberships = await this.loadMemberships(userId);
    const decision = resolveActiveTenant({
      hostTenantId: tenantId,
      memberships,
    });
    if (!decision.ok) {
      throw new TenantAccessDeniedError(
        decision.code === "NO_MEMBERSHIP" ? "NO_MEMBERSHIP" : "TENANT_MISMATCH",
      );
    }
    return decision.membership;
  }

  async listAliases(tenantId: string) {
    const { data, error } = await this.supabase
      .admin()
      .from("core_tenant_slug_aliases")
      .select("alias_slug, alias_kind, is_canonical")
      .eq("company_id", tenantId)
      .order("is_canonical", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return [];
      }
      throw new Error(`TENANT_ALIASES_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`);
    }

    return (data ?? []).map((row) => ({
      alias_slug: row.alias_slug as string,
      alias_kind: row.alias_kind as string,
      is_canonical: (row.is_canonical as boolean | undefined) ?? false,
    }));
  }
}
