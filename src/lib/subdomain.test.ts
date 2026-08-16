/**
 * Domain routing tests for canonical tenant hosts and WMP clean paths.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalTenantHostRedirect,
  deprecatedSubdomainRedirect,
  tenantLandingTargetForHost,
  tenantSubdomainTarget,
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
});

describe("WMP clean public path routing", () => {
  it("maps the WMP root to its internal namespace", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/")).toBe("/wmp");
  });

  it("maps clean public WMP pages to the internal namespace", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/djs")).toBe("/wmp/djs");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/empresas")).toBe("/wmp/empresas");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/orcamento")).toBe("/wmp/orcamento");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/parceiro/cadastro")).toBe("/wmp/parceiro/cadastro");
  });

  it("keeps global auth and password recovery routes outside the WMP namespace", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/auth")).toBe("/auth");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/reset-password")).toBe("/reset-password");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/reset-password-sent")).toBe("/reset-password-sent");
  });

  it("does not double-prefix internal WMP routes", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/wmp/djs")).toBe("/wmp/djs");
  });

  it("never rewrites APIs or static assets", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/api/wmp/millito/chat")).toBe("/api/wmp/millito/chat");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/assets/app.js")).toBe("/assets/app.js");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/robots.txt")).toBe("/robots.txt");
  });

  it("does not rewrite another tenant host", () => {
    expect(toWmpInternalPathname("colors.impulsionando.com.br", "/djs")).toBe("/djs");
  });
});

describe("deprecatedSubdomainRedirect", () => {
  it("root do subdomínio legado", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br" }))
      .toBe("https://colors.impulsionando.com.br/");
  });

  it("preserva path", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br", pathname: "/colors/super-green-black" }))
      .toBe("https://colors.impulsionando.com.br/colors/super-green-black");
  });

  it("preserva query e hash", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colorssaude.impulsionando.com.br",
      pathname: "/colors",
      search: "?utm_source=email&utm_campaign=x",
      hash: "#produtos",
    })).toBe("https://colors.impulsionando.com.br/colors?utm_source=email&utm_campaign=x#produtos");
  });

  it("cobre também o alias colors-saude", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors-saude.impulsionando.com.br" }))
      .toBe("https://colors.impulsionando.com.br/");
  });

  it("retorna null para subdomínio oficial", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br" }))
      .toBeNull();
  });

  it("retorna null para host fora do domínio raiz", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.outro-dominio.com" }))
      .toBeNull();
  });

  it("mantém http:// quando o request original é http", () => {
    expect(deprecatedSubdomainRedirect({ ...base, protocol: "http:", hostname: "colorssaude.impulsionando.com.br" }))
      .toBe("http://colors.impulsionando.com.br/");
  });
});

describe("tenant landing resolution", () => {
  it("routes CHRISMED to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("chrismed.impulsionando.com.br")).toBe("/chrismed");
  });

  it("routes WMP to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("wmp.impulsionando.com.br")).toBe("/wmp");
  });

  it("keeps the legacy CHRISMED domain compatible", () => {
    expect(tenantLandingTargetForHost("agenda.chrismed.com.br")).toBe("/chrismed");
  });

  it("uses the storefront for a tenant without a dedicated landing", () => {
    expect(tenantSubdomainTarget("cliente-novo")).toBe("/vitrine/cliente-novo");
  });

  it("does not treat the apex domain as a tenant", () => {
    expect(tenantLandingTargetForHost("impulsionando.com.br")).toBeNull();
  });
});
