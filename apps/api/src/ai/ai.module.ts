import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseModule } from "../supabase/supabase.module";
import { SupportModule } from "../support/support.module";
import { TenantsModule } from "../tenants/tenants.module";
import { JourneysModule } from "../journeys/journeys.module";
import { JobsModule } from "../jobs/jobs.module";
import { AiController } from "./ai.controller";
import { AiEffectsController } from "./ai-effects.controller";
import { AiService } from "./ai.service";
import { AiPolicyService } from "./ai-policy.service";
import { AiPilotService } from "./ai-pilot.service";
import { AiTelemetryService } from "./ai-telemetry.service";
import { AiAgentService } from "./ai-agent.service";
import { AiEffectsService } from "./ai-effects.service";

@Module({
  imports: [
    SupabaseModule,
    SupportModule,
    TenantsModule,
    JourneysModule,
    JobsModule,
  ],
  controllers: [AiController, AiEffectsController],
  providers: [
    AiService,
    AiPolicyService,
    AiPilotService,
    AiTelemetryService,
    AiAgentService,
    AiEffectsService,
    SupabaseAuthGuard,
  ],
  exports: [
    AiService,
    AiPolicyService,
    AiTelemetryService,
    AiAgentService,
    AiEffectsService,
  ],
})
export class AiModule {}
