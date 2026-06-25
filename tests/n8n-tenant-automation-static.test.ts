import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("N8N tenant automation guardrails", () => {
  it("requires signed N8N callbacks and tenant scope for client workflows", () => {
    const helper = readRepoFile("src/lib/n8n-webhook-security.server.ts");
    const callback = readRepoFile("src/routes/api/public/webhooks/n8n-callback.ts");
    const logHook = readRepoFile("src/routes/api/public/hooks/n8n-log.ts");

    expect(helper).toContain("N8N_SIGNATURE_HEADER");
    expect(helper).toContain("signN8nPayload");
    expect(helper).toContain("verifyN8nSignature");
    expect(helper).toContain("tenant_id_required");
    expect(callback).toContain("assertN8nTenantScope");
    expect(callback).toContain("verifyN8nSignature");
    expect(logHook).toContain("assertN8nTenantScope");
    expect(logHook).toContain("verifyN8nSignature");
    expect(logHook).not.toContain("fallbackApiKey");
    expect(logHook).not.toContain("SUPABASE_ANON_KEY");
  });

  it("signs Core-to-N8N dispatches and logs with database-safe values", () => {
    const dispatch = readRepoFile("src/routes/api/public/cron/funnel-dispatch.ts");

    expect(dispatch).toContain("signN8nPayload");
    expect(dispatch).toContain("IMPULSIONANDO_WEBHOOK_SECRET not configured");
    expect(dispatch).toContain('scope: "tenant"');
    expect(dispatch).toContain("tenant_id: row.company_id");
    expect(dispatch).toContain('status: status === "sent" ? "ok" : "failed"');
    expect(dispatch).toContain('channel: "api"');
    expect(dispatch).not.toContain('channel: "http"');
  });

  it("documents the N8N operating contract without anon-key fallback", () => {
    const envExample = readRepoFile(".env.example");
    const readme = readRepoFile("docs/n8n/README.md");
    const niches = readRepoFile("docs/n8n/niches/README.md");

    expect(envExample).toContain("IMPULSIONANDO_API_BASE=");
    expect(envExample).toContain("IMPULSIONANDO_WEBHOOK_SECRET=");
    expect(readme).toContain('scope": "tenant"');
    expect(readme).toContain("Nao existe fallback por chave anon");
    expect(readme).toContain("Fluxos de cliente precisam enviar");
    expect(niches).toContain('scope: "tenant"');
    expect(niches).toContain("tenant_id");
  });
});
