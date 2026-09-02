import { Inject, Injectable } from "@nestjs/common";
import type { TenantContext } from "@impulsionando/tenant-context";
import { SupabaseService } from "../supabase/supabase.service";

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
}
