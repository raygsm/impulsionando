import { Controller, Get, Inject } from "@nestjs/common";
import { SupabaseService } from "./supabase/supabase.service";

@Controller("health")
export class HealthController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

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
    const configured = this.supabase.configured();
    return {
      ready: configured,
      service: "impulsionando-api",
      supabaseConfigured: configured,
    };
  }
}
