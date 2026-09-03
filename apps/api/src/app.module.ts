import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AiModule } from "./ai/ai.module";
import { JobsModule } from "./jobs/jobs.module";
import { JourneysModule } from "./journeys/journeys.module";
import { OpsModule } from "./ops/ops.module";
import { OutboxModule } from "./outbox/outbox.module";
import { SupportModule } from "./support/support.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { TenantsModule } from "./tenants/tenants.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    SupabaseModule,
    SupportModule,
    TenantsModule,
    JobsModule,
    OutboxModule,
    WebhooksModule,
    JourneysModule,
    OpsModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
