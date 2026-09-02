import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { TenantEntitlementsService } from "./tenant-entitlements.service";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantEntitlementsService, SupabaseAuthGuard],
  exports: [TenantsService, TenantEntitlementsService],
})
export class TenantsModule {}
