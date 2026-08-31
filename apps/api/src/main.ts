import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.setGlobalPrefix("api/v1");

  const port = Number(process.env.API_PORT || 3100);
  await app.listen({ port, host: "0.0.0.0" });
  // eslint-disable-next-line no-console
  console.log(`@impulsionando/api listening on :${port} (Phase 3 Support pilot)`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
