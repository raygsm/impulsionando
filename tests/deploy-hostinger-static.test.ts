import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const compose = readFileSync("deploy/hostinger/docker-compose.yml", "utf8");
const dockerfile = readFileSync("Dockerfile", "utf8");
const dockerignore = readFileSync(".dockerignore", "utf8");

describe("Hostinger deployment package", () => {
  it("keeps Lovable disabled in production containers", () => {
    expect(dockerfile).toContain("LOVABLE_LEGACY_ENABLED=false");
    expect(compose).toContain('LOVABLE_LEGACY_ENABLED: "false"');
  });

  it("routes core, app, and tenant domains through Traefik", () => {
    expect(compose).toContain("impulsionando.com.br");
    expect(compose).toContain("www.impulsionando.com.br");
    expect(compose).toContain("app.impulsionando.com.br");
    expect(compose).toContain("HostRegexp");
  });

  it("does not copy local env files into the Docker build context", () => {
    expect(dockerignore).toContain(".env");
    expect(dockerignore).toContain(".env.*");
    expect(dockerignore).toContain("!.env.example");
  });
});
