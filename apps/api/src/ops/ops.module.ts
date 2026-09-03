import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseModule } from "../supabase/supabase.module";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";

@Module({
  imports: [SupabaseModule],
  controllers: [OpsController],
  providers: [OpsService, SupabaseAuthGuard],
  exports: [OpsService],
})
export class OpsModule {}
