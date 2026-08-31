import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { SupportModule } from "./support/support.module";

@Module({
  imports: [SupportModule],
  controllers: [HealthController],
})
export class AppModule {}
