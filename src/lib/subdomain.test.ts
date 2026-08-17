/**
 * Domain routing tests for canonical tenant hosts and clean tenant paths.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalTenantHostRedirect,
  deprecatedSubdomainRedirect,
  tenantLandingTargetForHost,
  tenantSubdomainTarget,
  toColorsInternalPathname,
  toWmpInternalPathname,
} from "./subdomain";

const base = { protocol: "https:", pathname: "/", search: "", hash: "" };

describe("canonicalTenantHostRedirect", () => {
  it("moves the CHRISMED landing from the apex to its tenant subdomain", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "impulsionando.com.br", pathname: "/chrismed" }))
      .toBe("https://chrismed.impulsionando.com.br/");
  });

  it("preserves CHRISMED nested paths, query and hash", () => {
    expect(canonicalTenantHostRedirect({
      ...base,
      hostname: "www.impulsionando.com.br",
      pathname: "/chrismed/agendar",
      search: "?utm_source=email",
      hash: "#form",
    })).toBe("https://chrismed.impulsionando.com.br/agendar?utm_source=email#form");
  });

  it("moves the legacy agenda host to the official tenant subdomain", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "agenda.chrismed.com.br", pathname: "/chrismed/contato" }))
      .toBe("https://chrismed.impulsionando.com.br/contato");
  });

  it("cleans the internal CHRISMED route from the canonical host", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "chrismed.impulsionando.com.br", pathname: "/chrismed" }))
      .toBe("https://chrismed.impulsionando.com.br/");
  });

  it("removes the internal CHRISMED prefix from nested canonical paths", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "chrismed.impulsionando.com.br", pathname: "/chrismed/agendar" }))
      .toBe("https://chrismed.impulsionando.com.br/agendar");
  });

  it("does not redirect an already public CHRISMED path", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "chrismed.impulsionando.com.br", pathname: "/agendar" }))
      .toBeNull();
  });

  it("redirects all former Colors aliases to colorssaude.com.br", () => {
    for (const hostname of [
      "colors.impulsionando.com.br",
      "colorssaude.impulsionando.com.br",
      "colors-saude.impulsionando.com.br",
      "colors.impulsionando.lovable.app",
      "colorsaude.lovable.app",
      "www.colorssaude.com.br",
    ]) {
      expect(canonicalTenantHostRedirect({ ...base, hostname }))
        .toBe("https://colorssaude.com.br/");
    }
  });

  it("redirects /colors from the Impulsionando apex to colorssaude.com.br", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "impulsionando.com.br", pathname: "/colors/agenda" }))
      .toBe("https://colorssaude.com.br/agenda");
  });
});

describe("Colors clean public path routing", () => {
  it("maps the Colors root on the sole canonical domain to its internal namespace", () => {
    expect(toColorsInternalPathname("colorssaude.com.br", "/")).toBe("/colors");
  });

  it("maps critical clean Colors pages to the internal namespace", () => {
    expect(toColorsInternalPathname("colorssaude.com.br", "/super-green-black")).toBe("/colors/super-green-black");
    expect(toColorsInternalPathname("colorssaude.com.br", "/agenda")).toBe("/colors/agenda");
    expect(toColorsInternalPathname("colorssaude.com.br", "/eventos")).toBe("/colors/eventos");
    expect(toColorsInternalPathname("colorssaude.com.br", "/suporte")).toBe("/colors/suporte");
    expect(toColorsInternalPathname("colorssaude.com.br", "/afiliados")).toBe("/colors/afiliados");
    expect(toColorsInternalPathname("colorssaude.com.br", "/rastreio")).toBe("/colors/rastreio");
    expect(toColorsInternalPathname("colorssaude.com.br", "/entrar")).toBe("/colors/entrar");
    expect(toColorsInternalPathname("colorssaude.com.br", "/criar-conta")).toBe("/colors/criar-conta");
  });

  it("does not double-prefix internal Colors routes", () => {
    expect(toColorsInternalPathname("colorssaude.com.br", "/colors/agenda")).toBe("/colors/agenda");
  });

  it("never rewrites Colors APIs or static assets", () => {
    expect(toColorsInternalPathname("colorssaude.com.br", "/api/public/webhooks/maisfy-colors")).toBe("/api/public/webhooks/maisfy-colors");
    expect(toColorsInternalPathname("colorssaude.com.br", "/assets/app.js")).toBe("/assets/app.js");
    expect(toColorsInternalPathname("colorssaude.com.br", "/robots.txt")).toBe("/robots.txt");
  });

  it("does not treat former Colors subdomains as active Colors hosts", () => {
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/agenda")).toBe("/agenda");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/agenda")).toBe("/agenda");
  });
});

describe("deprecatedSubdomainRedirect", () => {
  it("redirects former Colors hosts to colorssaude.com.br", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br" }))
      .toBe("https://colorssaude.com.br/");
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br" }))
      .toBe("https://colorssaude.com.br/");
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors-saude.impulsionando.com.br" }))
      .toBe("https://colorssaude.com.br/");
  });

  it("removes the internal /colors namespace from former hosts", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br", pathname: "/colors/super-green-black" }))
      .toBe("https://colorssaude.com.br/super-green-black");
  });

  it("returns null for the official Colors Saúde domain", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.com.br" })).toBeNull();
  });
});

describe("WMP clean public path routing", () => {
  it("maps the WMP root to its internal namespace", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/")).toBe("/wmp");
  });

  it("does not rewrite Colors Saúde", () => {
    expect(toWmpInternalPathname("colorssaude.com.br", "/djs")).toBe("/djs");
  });
});

describe("tenant landing resolution", () => {
  it("routes CHRISMED to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("chrismed.impulsionando.com.br")).toBe("/chrismed");
  });

  it("routes Colors Saúde only from colorssaude.com.br", () => {
    expect(tenantLandingTargetForHost("colorssaude.com.br")).toBe("/colors");
  });

  it("routes WMP to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("wmp.impulsionando.com.br")).toBe("/wmp");
  });

  it("uses the storefront for a tenant without a dedicated landing", () => {
    expect(tenantSubdomainTarget("cliente-novo")).toBe("/vitrine/cliente-novo");
  });

  it("does not treat the apex domain as a tenant", () => {
    expect(tenantLandingTargetForHost("impulsionando.com.br")).toBeNull();
  });
});
