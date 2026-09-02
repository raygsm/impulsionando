import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { SupportModule } from "./support/support.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [SupabaseModule, SupportModule, TenantsModule],
  controllers: [HealthController],
})
export class AppModule {}
