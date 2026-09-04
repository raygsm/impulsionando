import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  transpilePackages: [
    "@impulsionando/api-client",
    "@impulsionando/auth",
    "@impulsionando/config",
    "@impulsionando/contracts",
    "@impulsionando/tenant-context",
  ],
  env: {
    GIT_SHA: process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown",
  },
};

export default nextConfig;
