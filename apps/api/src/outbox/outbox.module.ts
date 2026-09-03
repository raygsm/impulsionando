import { Module } from "@nestjs/common";
import { SupabaseModule } from "../supabase/supabase.module";
import { OutboxService } from "./outbox.service";

@Module({
  imports: [SupabaseModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
