import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("tenant provisioning guardrails", () => {
  it("does not use invalid company_kind tenant anymore", () => {
    const files = [
      "src/lib/tenant-provisioning.functions.ts",
      "src/lib/factory.functions.ts",
    ].map(readRepoFile);

    for (const source of files) {
      expect(source).not.toMatch(/company_kind:\s*['"]tenant['"]/);
      expect(source).not.toMatch(/\.eq\(['"]company_kind['"],\s*['"]tenant['"]\)/);
    }
  });

  it("provisions tenant identity in both creation paths", () => {
    const legacyProvisioning = readRepoFile("src/lib/tenant-provisioning.functions.ts");
    const factoryProvisioning = readRepoFile("src/lib/factory.functions.ts");

    expect(legacyProvisioning).toContain("provision_tenant_identity");
    expect(factoryProvisioning).toContain("provision_tenant_identity");
  });

  it("links tenant admin with an explicit profile_id", () => {
    const legacyProvisioning = readRepoFile("src/lib/tenant-provisioning.functions.ts");
    const factoryProvisioning = readRepoFile("src/lib/factory.functions.ts");

    expect(legacyProvisioning).toContain("profile_id: gestor.id");
    expect(factoryProvisioning).toContain("profile_id: gestor.id");
  });

  it("stores selected tenant plan as a billing contract", () => {
    const legacyProvisioning = readRepoFile("src/lib/tenant-provisioning.functions.ts");

    expect(legacyProvisioning).toContain("from('billing_contracts')");
    expect(legacyProvisioning).not.toContain("from('core_company_plans').insert");
  });
});
