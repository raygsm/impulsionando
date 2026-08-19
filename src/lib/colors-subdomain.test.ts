import { describe, expect, it } from "vitest";
import { canonicalTenantHostRedirect, deprecatedSubdomainRedirect, toColorsInternalPathname } from "./subdomain";

const COLORS = "colorssaude.impulsionando.com.br";
const base = { protocol: "https:", pathname: "/", search: "", hash: "" };

describe("Colors sole canonical host", () => {
  it("maps the canonical Colors root to its internal namespace", () => {
    expect(toColorsInternalPathname(COLORS, "/")).toBe("/colors");
  });

  it("maps critical clean Colors pages only on the canonical host", () => {
    expect(toColorsInternalPathname(COLORS, "/super-green-black")).toBe("/colors/super-green-black");
    expect(toColorsInternalPathname(COLORS, "/agenda")).toBe("/colors/agenda");
    expect(toColorsInternalPathname(COLORS, "/eventos")).toBe("/colors/eventos");
    expect(toColorsInternalPathname(COLORS, "/suporte")).toBe("/colors/suporte");
    expect(toColorsInternalPathname(COLORS, "/afiliados")).toBe("/colors/afiliados");
    expect(toColorsInternalPathname(COLORS, "/rastreio")).toBe("/colors/rastreio");
    expect(toColorsInternalPathname(COLORS, "/entrar")).toBe("/colors/entrar");
    expect(toColorsInternalPathname(COLORS, "/criar-conta")).toBe("/colors/criar-conta");
  });

  it("never redirects the canonical Colors host", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: COLORS })).toBeNull();
  });

  it("treats every former Colors alias as non-canonical and non-redirecting", () => {
    for (const host of [
      "colors.impulsionando.com.br",
      "colors-saude.impulsionando.com.br",
      "colorsaude.impulsionando.com.br",
      "colors.impulsionando.lovable.app",
      "colorsaude.lovable.app",
      "colorssaude.com.br",
      "grupocolors.com.br",
    ]) {
      expect(toColorsInternalPathname(host, "/agenda")).toBe("/agenda");
      expect(canonicalTenantHostRedirect({ ...base, hostname: host })).toBeNull();
      expect(deprecatedSubdomainRedirect({ ...base, hostname: host })).toBeNull();
    }
  });

  it("never rewrites APIs or static assets", () => {
    expect(toColorsInternalPathname(COLORS, "/api/public/webhooks/maisfy-colors")).toBe("/api/public/webhooks/maisfy-colors");
    expect(toColorsInternalPathname(COLORS, "/assets/app.js")).toBe("/assets/app.js");
    expect(toColorsInternalPathname(COLORS, "/robots.txt")).toBe("/robots.txt");
  });
});
