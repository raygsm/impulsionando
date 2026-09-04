import { z } from "zod";

export const AppWebEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  GIT_SHA: z.string().min(1).optional(),
  GITHUB_SHA: z.string().min(1).optional(),
  APP_WEB_PORT: z.string().optional(),
  NEST_API_BASE: z.string().optional(),
  PHASE3_API_BASE: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_NEST_API_BASE: z.string().optional(),
});

export type AppWebEnv = {
  gitSha: string;
  port: number;
  nestApiBase: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim().replace(/\/$/, "");
  }
  return "";
}

/** Parse env. Missing public keys do not crash health probes; auth routes fail closed. */
export function loadAppWebEnv(raw: NodeJS.ProcessEnv = process.env): AppWebEnv {
  const parsed = AppWebEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid app-web environment variable names: ${names}`);
  }
  const e = parsed.data;
  return {
    gitSha: firstNonEmpty(e.GIT_SHA, e.GITHUB_SHA) || "unknown",
    port: Number(e.APP_WEB_PORT || "3320") || 3320,
    nestApiBase: firstNonEmpty(e.NEST_API_BASE, e.PHASE3_API_BASE, e.NEXT_PUBLIC_NEST_API_BASE),
    supabaseUrl: firstNonEmpty(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_URL),
    supabaseAnonKey: firstNonEmpty(
      e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      e.SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function missingAuthEnvNames(env: AppWebEnv): string[] {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}
