import { NextResponse } from "next/server";
import { appWebEnv } from "@/lib/config/env";

export function GET() {
  const env = appWebEnv();
  return NextResponse.json({
    ready: true,
    service: "impulsionando-app-web",
    gitSha: env.gitSha,
  });
}
