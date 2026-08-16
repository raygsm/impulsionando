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
});

describe("Colors clean public path routing", () => {
  it("maps the Colors root to its internal namespace", () => {
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/")).toBe("/colors");
  });

  it("maps critical clean Colors pages to the internal namespace", () => {
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/super-green-black")).toBe("/colors/super-green-black");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/agenda")).toBe("/colors/agenda");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/eventos")).toBe("/colors/eventos");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/suporte")).toBe("/colors/suporte");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/afiliados")).toBe("/colors/afiliados");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/rastreio")).toBe("/colors/rastreio");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/entrar")).toBe("/colors/entrar");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/criar-conta")).toBe("/colors/criar-conta");
  });

  it("does not double-prefix internal Colors routes", () => {
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/colors/agenda")).toBe("/colors/agenda");
  });

  it("never rewrites Colors APIs or static assets", () => {
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/api/public/webhooks/maisfy-colors")).toBe("/api/public/webhooks/maisfy-colors");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/assets/app.js")).toBe("/assets/app.js");
    expect(toColorsInternalPathname("colorssaude.impulsionando.com.br", "/robots.txt")).toBe("/robots.txt");
  });

  it("does not rewrite another tenant host", () => {
    expect(toColorsInternalPathname("wmp.impulsionando.com.br", "/agenda")).toBe("/agenda");
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

  it("keeps global auth, dashboard and password routes outside the WMP namespace", () => {
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/auth")).toBe("/auth");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/dashboard")).toBe("/dashboard");
    expect(toWmpInternalPathname("wmp.impulsionando.com.br", "/seguranca/senha")).toBe("/seguranca/senha");
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
    expect(toWmpInternalPathname("colorssaude.impulsionando.com.br", "/djs")).toBe("/djs");
  });
});

describe("deprecatedSubdomainRedirect", () => {
  it("redirects the former Colors host to the canonical Colors Saúde host", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br" }))
      .toBe("https://colorssaude.impulsionando.com.br/");
  });

  it("removes the internal /colors namespace from the former host", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br", pathname: "/colors/super-green-black" }))
      .toBe("https://colorssaude.impulsionando.com.br/super-green-black");
  });

  it("preserves query and hash on the canonical Colors Saúde URL", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colors.impulsionando.com.br",
      pathname: "/colors",
      search: "?utm_source=email&utm_campaign=x",
      hash: "#produtos",
    })).toBe("https://colorssaude.impulsionando.com.br/?utm_source=email&utm_campaign=x#produtos");
  });

  it("covers the colors-saude alias", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors-saude.impulsionando.com.br" }))
      .toBe("https://colorssaude.impulsionando.com.br/");
  });

  it("returns null for the official Colors Saúde host", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br" }))
      .toBeNull();
  });

  it("returns null for a host outside the root domain", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.outro-dominio.com" }))
      .toBeNull();
  });

  it("preserves http:// when the original request is http", () => {
    expect(deprecatedSubdomainRedirect({ ...base, protocol: "http:", hostname: "colors.impulsionando.com.br" }))
      .toBe("http://colorssaude.impulsionando.com.br/");
  });
});

describe("tenant landing resolution", () => {
  it("routes CHRISMED to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("chrismed.impulsionando.com.br")).toBe("/chrismed");
  });

  it("routes Colors Saúde to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("colorssaude.impulsionando.com.br")).toBe("/colors");
  });

  it("routes WMP to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("wmp.impulsionando.com.br")).toBe("/wmp");
  });

  it("routes the private Tour host to its dedicated landing", () => {
    expect(tenantLandingTargetForHost("tour.impulsionando.com.br")).toBe("/tour");
    expect(tenantLandingTargetForHost("impulsionando-tour.impulsionando.com.br")).toBe("/tour");
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
