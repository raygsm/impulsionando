import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      service: "impulsionando-api",
      phase: 3,
      pilot: "support",
      gitSha: process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown",
    };
  }

  @Get("ready")
  getReady() {
    const hasStagingUrl = Boolean(process.env.SUPABASE_URL);
    return {
      ready: hasStagingUrl,
      service: "impulsionando-api",
      supabaseConfigured: hasStagingUrl,
    };
  }
}
