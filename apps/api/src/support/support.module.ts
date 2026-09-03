import { Module } from "@nestjs/common";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { OutboxModule } from "../outbox/outbox.module";

@Module({
  imports: [OutboxModule],
  controllers: [SupportController],
  providers: [SupportService, SupabaseAuthGuard],
  exports: [SupportService],
})
export class SupportModule {}
