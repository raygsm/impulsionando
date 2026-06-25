import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("Lovable legacy isolation", () => {
  it("documents Core AI and Lovable legacy environment variables", () => {
    const env = read(".env.example");

    expect(env).toContain("CORE_AI_API_KEY=");
    expect(env).toContain("CORE_AI_BASE_URL=");
    expect(env).toContain("LOVABLE_LEGACY_ENABLED=");
  });

  it("routes AI through the Core gateway resolver", () => {
    const gateway = read("src/lib/ai-gateway.server.ts");

    expect(gateway).toContain("resolveCoreAiGateway");
    expect(gateway).toContain("resolveCoreAiRestConfig");
    expect(gateway).toContain("CORE_AI_API_KEY");
    expect(gateway).toContain("getLovableLegacyApiKey");
  });

  it("keeps Lovable e-mail endpoints gated behind legacy mode", () => {
    const routes = [
      "src/routes/lovable/email/auth/preview.ts",
      "src/routes/lovable/email/auth/webhook.ts",
      "src/routes/lovable/email/queue/process.ts",
      "src/routes/lovable/email/suppression.ts",
      "src/routes/lovable/email/transactional/preview.ts",
      "src/routes/lovable/email/transactional/send.ts",
    ];

    for (const route of routes) {
      const source = read(route);
      expect(source).toContain("assertLovableLegacyEnabled");
      expect(source).toContain("Lovable legacy disabled");
    }
  });

  it("prevents business AI code from reading LOVABLE_API_KEY directly", () => {
    const files = [
      "src/lib/ai-generator.functions.ts",
      "src/lib/executive-briefing.functions.ts",
      "src/lib/support-pro.functions.ts",
      "src/lib/talentos-ai.functions.ts",
      "src/lib/tenant-insights.functions.ts",
      "src/lib/riomed-ai.functions.ts",
      "src/lib/riomed-automation.functions.ts",
      "src/lib/riomed-marketing.functions.ts",
      "src/lib/riomed-search.functions.ts",
      "src/routes/api/public/cron/support-tick.ts",
      "src/routes/lovable/email/auth/preview.ts",
      "src/routes/lovable/email/auth/webhook.ts",
      "src/routes/lovable/email/queue/process.ts",
      "src/routes/lovable/email/suppression.ts",
      "src/routes/lovable/email/transactional/preview.ts",
      "src/routes/lovable/email/transactional/send.ts",
    ];

    for (const file of files) {
      expect(read(file)).not.toContain("process.env.LOVABLE_API_KEY");
    }
  });
});
