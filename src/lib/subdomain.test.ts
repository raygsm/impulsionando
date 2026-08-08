/**
 * Testes de deprecatedSubdomainRedirect — garantem que qualquer path do
 * host legado é redirecionado para o subdomínio oficial preservando
 * pathname, search e hash.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalTenantHostRedirect,
  chrismedInternalPathForPublicPath,
  deprecatedSubdomainRedirect,
  tenantInternalPathForPublicPath,
  tenantLandingTargetForHost,
  tenantPublicPathForInternalPath,
  tenantSubdomainTarget,
} from "./subdomain";

const base = { protocol: "https:", pathname: "/", search: "", hash: "" };

describe("canonicalTenantHostRedirect", () => {
  it("moves the CHRISMED landing from the apex to its tenant subdomain", () => {
    expect(canonicalTenantHostRedirect({
      ...base,
      hostname: "impulsionando.com.br",
      pathname: "/chrismed",
    })).toBe("https://chrismed.impulsionando.com.br/");
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
    expect(canonicalTenantHostRedirect({
      ...base,
      hostname: "agenda.chrismed.com.br",
      pathname: "/chrismed/contato",
    })).toBe("https://chrismed.impulsionando.com.br/contato");
  });

  it("cleans the internal CHRISMED route from the canonical host", () => {
    expect(canonicalTenantHostRedirect({
      ...base,
      hostname: "chrismed.impulsionando.com.br",
      pathname: "/chrismed",
    })).toBe("https://chrismed.impulsionando.com.br/");
  });

  it("removes the internal prefix from nested paths at the canonical host", () => {
    expect(canonicalTenantHostRedirect({
      ...base,
      hostname: "chrismed.impulsionando.com.br",
      pathname: "/chrismed/agendar",
    })).toBe("https://chrismed.impulsionando.com.br/agendar");
  });
});

describe("chrismedInternalPathForPublicPath", () => {
  it("maps clean public paths to the internal CHRISMED route tree", () => {
    expect(chrismedInternalPathForPublicPath("/internacional")).toBe("/chrismed/internacional");
    expect(chrismedInternalPathForPublicPath("/agendar")).toBe("/chrismed/agendar");
  });

  it("keeps standalone and infrastructure paths untouched", () => {
    expect(chrismedInternalPathForPublicPath("/auth")).toBeNull();
    expect(chrismedInternalPathForPublicPath("/alth")).toBeNull();
    expect(chrismedInternalPathForPublicPath("/_build/app.js")).toBeNull();
    expect(chrismedInternalPathForPublicPath("/api/public/health")).toBeNull();
  });
});

describe("dedicated tenant clean paths", () => {
  it("maps clean CHRISMED pages to the internal route tree", () => {
    expect(tenantInternalPathForPublicPath(
      "chrismed.impulsionando.com.br",
      "/agendar",
    )).toBe("/chrismed/agendar");
    expect(tenantPublicPathForInternalPath(
      "chrismed.impulsionando.com.br",
      "/chrismed/agendar",
    )).toBe("/agendar");
  });

  it("applies the same invariant to other dedicated clients", () => {
    expect(tenantInternalPathForPublicPath(
      "colors.impulsionando.com.br",
      "/entrar",
    )).toBe("/colors/entrar");
    expect(tenantPublicPathForInternalPath(
      "wmp.impulsionando.com.br",
      "/wmp/eventos",
    )).toBe("/eventos");
  });

  it("never rewrites infrastructure or standalone authentication paths", () => {
    expect(tenantInternalPathForPublicPath(
      "chrismed.impulsionando.com.br",
      "/api/public/health",
    )).toBeNull();
    expect(tenantInternalPathForPublicPath(
      "colors.impulsionando.com.br",
      "/auth",
    )).toBeNull();
  });

  it("does not invent nested routes for generic storefront tenants", () => {
    expect(tenantInternalPathForPublicPath(
      "cliente-novo.impulsionando.com.br",
      "/produto",
    )).toBeNull();
  });
});

describe("deprecatedSubdomainRedirect", () => {
  it("root do subdomínio legado", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br" }))
      .toBe("https://colors.impulsionando.com.br/");
  });

  it("preserva path", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colorssaude.impulsionando.com.br",
      pathname: "/colors/super-green-black",
    })).toBe("https://colors.impulsionando.com.br/super-green-black");
  });

  it("preserva query e hash", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colorssaude.impulsionando.com.br",
      pathname: "/colors",
      search: "?utm_source=email&utm_campaign=x",
      hash: "#produtos",
    })).toBe("https://colors.impulsionando.com.br/?utm_source=email&utm_campaign=x#produtos");
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
    expect(deprecatedSubdomainRedirect({
      ...base,
      protocol: "http:",
      hostname: "colorssaude.impulsionando.com.br",
    })).toBe("http://colors.impulsionando.com.br/");
  });
});

describe("tenant landing resolution", () => {
  it("routes CHRISMED to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("chrismed.impulsionando.com.br")).toBe("/chrismed");
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
