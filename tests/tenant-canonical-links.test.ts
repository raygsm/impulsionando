import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sourceFiles = globSync("src/**/*.{ts,tsx}", {
  exclude: ["src/routeTree.gen.ts", "src/**/*.test.{ts,tsx}"],
});

describe("tenant canonical links", () => {
  it("never repeats a tenant slug after its own subdomain", () => {
    const violations: string[] = [];
    const repeatedTenant = /https:\/\/([a-z0-9-]+)\.impulsionando\.com\.br\/\1(?:\/|[?'"#]|$)/gi;

    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      if (repeatedTenant.test(source)) violations.push(file);
      repeatedTenant.lastIndex = 0;
    }

    expect(violations).toEqual([]);
  });

  it("does not emit hard-navigation CHRISMED links with the internal prefix", () => {
    const violations: string[] = [];
    const files = globSync([
      "src/components/chrismed/**/*.{ts,tsx}",
      "src/routes/chrismed*.{ts,tsx}",
    ]);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (/href=["']\/chrismed(?:\/|["'])/.test(source)) violations.push(file);
    }

    expect(violations).toEqual([]);
  });

  it("keeps the CHRISMED shell and loaders independent from Lovable assets", () => {
    const files = [
      "src/components/chrismed/ChrismedShell.tsx",
      "src/components/chrismed/ChrismedPreloader.tsx",
      "src/components/app/RocketRouteLoader.tsx",
    ];
    const violations = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return source.includes(".asset.json") || source.includes("/__l5e/");
    });

    expect(violations).toEqual([]);
  });
});
