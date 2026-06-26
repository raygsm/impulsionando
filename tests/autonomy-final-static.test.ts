import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("final autonomy runbook", () => {
  it("keeps the official Supabase project locked in repo config", () => {
    const config = read("supabase/config.toml");

    expect(config).toContain('project_id = "arygtqrdpcdkwnuwsgmm"');
  });

  it("requires Supabase target and IPv4 pooler validation before migrations", () => {
    const workflow = read(".github/workflows/apply-supabase-migrations.yml");

    expect(workflow).toContain("Normalize Supabase target from repo config");
    expect(workflow).toContain("Verify Supabase target");
    expect(workflow).toContain("Verify Supabase pooler connection");
    expect(workflow).toContain("supabase db push --include-all");
  });

  it("requires publish gates before production publication", () => {
    const publishGate = read(".github/workflows/publish-gate.yml");

    expect(publishGate).toContain("Verify Supabase target");
    expect(publishGate).toContain("Production build (must succeed)");
    expect(publishGate).toContain("Run RLS / permission tests");
    expect(publishGate).toContain("Security scan (Supabase linter)");
  });

  it("documents deployment, N8N validation, and rollback without Lovable", () => {
    const runbook = read("docs/RUNBOOK_OPERACIONAL.md");

    expect(runbook).toContain("Deploy / Rollback independente do Lovable");
    expect(runbook).toContain("Publicar app na VPS/Hostinger");
    expect(runbook).toContain("Validar N8N");
    expect(runbook).toContain("Lovable nao e mecanismo de rollback do Core");
    expect(runbook).not.toContain("Lovable publica automaticamente");
    expect(runbook).not.toContain("Rollback: na UI Lovable");
  });

  it("documents Core AI and Lovable legacy boundaries in the handoff", () => {
    const handoff = read("docs/CORE_HANDOFF_AUTOSUFICIENCIA.md");

    expect(handoff).toContain("GitHub `main` e a fonte de verdade");
    expect(handoff).toContain("Supabase oficial `arygtqrdpcdkwnuwsgmm`");
    expect(handoff).toContain("CORE_AI_API_KEY");
    expect(handoff).toContain("LOVABLE_LEGACY_ENABLED=true");
  });
});
