import { Module } from "@nestjs/common";
import { JourneysController } from "./journeys.controller";
import { JourneysService } from "./journeys.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { OutboxModule } from "../outbox/outbox.module";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [OutboxModule, TenantsModule],
  controllers: [JourneysController],
  providers: [JourneysService, SupabaseAuthGuard],
  exports: [JourneysService],
})
export class JourneysModule {}
