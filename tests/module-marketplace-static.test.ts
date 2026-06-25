import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("module marketplace guardrails", () => {
  it("exposes a Core-backed marketplace pricing function", () => {
    const source = readRepoFile("src/lib/modules.functions.ts");

    expect(source).toContain("listModuleMarketplacePricing");
    expect(source).toContain("monthly_price");
    expect(source).toContain("monthly_price_cents");
    expect(source).toContain("is_contractable");
  });

  it("keeps tenant module rollback tied to released module_versions", () => {
    const source = readRepoFile("src/lib/modules.functions.ts");

    expect(source).toContain("rollbackClientModuleVersion");
    expect(source).toContain('from("module_versions")');
    expect(source).toContain('action: "module.rollback"');
    expect(source).toContain("installed_version: data.version");
  });

  it("does not use the static R$ 497 catalog as the backend source of truth", () => {
    const source = readRepoFile("src/lib/modules.functions.ts");

    expect(source).not.toContain("MODULE_PRICE_CENTS");
    expect(source).not.toContain("CATALOG_MODULES");
  });
});
