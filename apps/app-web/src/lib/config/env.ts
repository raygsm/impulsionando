import { loadAppWebEnv, type AppWebEnv } from "@impulsionando/config";

export function appWebEnv(): AppWebEnv {
  return loadAppWebEnv(process.env);
}

export function healthPayload() {
  const env = appWebEnv();
  return {
    ok: true,
    status: "ok",
    service: "impulsionando-app-web",
    runtime: "app-web",
    phase: "8a-nextjs-proposed",
    gitSha: env.gitSha,
    framework: "nextjs",
    adr: "ADR-009-proposed",
  };
}
