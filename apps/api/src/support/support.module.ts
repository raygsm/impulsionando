import { Module } from "@nestjs/common";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupabaseAuthGuard],
})
export class SupportModule {}
