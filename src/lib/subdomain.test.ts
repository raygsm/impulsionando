/**
 * Domain routing tests for canonical tenant hosts and clean tenant paths.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalTenantHostRedirect,
  getTenantSubdomain,
  isImpulsionandoPlatformHost,
  tenantLandingTargetForHost,
  tenantSubdomainTarget,
  toColorsInternalPathname,
  toWmpInternalPathname,
  wmpHostLockTarget,
  wmpRedirectLeavesCanonicalHost,
} from "./subdomain";

const base = { protocol: "https:", pathname: "/", search: "", hash: "" };
const COLORS = "colorssaude.impulsionando.com.br";
const WMP = "wmp.impulsionando.com.br";

describe("canonicalTenantHostRedirect", () => {
  it("moves the CHRISMED landing from the apex to its tenant subdomain", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "impulsionando.com.br", pathname: "/chrismed" })).toBe("https://chrismed.impulsionando.com.br/");
  });
  it("preserves CHRISMED nested paths, query and hash", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "www.impulsionando.com.br", pathname: "/chrismed/agendar", search: "?utm_source=email", hash: "#form" })).toBe("https://chrismed.impulsionando.com.br/agendar?utm_source=email#form");
  });
  it("moves the legacy agenda host to the official tenant subdomain", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "agenda.chrismed.com.br", pathname: "/chrismed/contato" })).toBe("https://chrismed.impulsionando.com.br/contato");
  });
  it("cleans the internal CHRISMED route from the canonical host", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "chrismed.impulsionando.com.br", pathname: "/chrismed" })).toBe("https://chrismed.impulsionando.com.br/");
  });
  it("does not redirect an already public CHRISMED path", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "chrismed.impulsionando.com.br", pathname: "/agendar" })).toBeNull();
  });
  it("never canonicalizes the WMP host to another domain", () => {
    for (const pathname of ["/", "/wmp", "/djs", "/empresas", "/orcamento", "/onde-estou"]) expect(canonicalTenantHostRedirect({ ...base, hostname: WMP, pathname })).toBeNull();
  });
  it("never canonicalizes the Colors Saúde host to another domain", () => {
    for (const pathname of ["/", "/colors", "/super-green-black", "/agenda", "/eventos", "/suporte", "/afiliados", "/rastreio"]) expect(canonicalTenantHostRedirect({ ...base, hostname: COLORS, pathname })).toBeNull();
  });
  it("keeps the apex /colors fallback on impulsionando.com.br", () => {
    expect(canonicalTenantHostRedirect({ ...base, hostname: "impulsionando.com.br", pathname: "/colors" })).toBeNull();
    expect(canonicalTenantHostRedirect({ ...base, hostname: "impulsionando.com.br", pathname: "/colors/agenda" })).toBeNull();
  });
  it("does not redirect deprecated Impulsionando Colors aliases", () => {
    for (const hostname of ["colors.impulsionando.com.br", "colors-saude.impulsionando.com.br"]) expect(canonicalTenantHostRedirect({ ...base, hostname })).toBeNull();
  });
});

describe("Colors clean public path routing", () => {
  it("maps the Colors root on the canonical host to its internal namespace", () => expect(toColorsInternalPathname(COLORS, "/")).toBe("/colors"));
  it("maps critical clean Colors pages to the internal namespace", () => {
    expect(toColorsInternalPathname(COLORS, "/super-green-black")).toBe("/colors/super-green-black");
    expect(toColorsInternalPathname(COLORS, "/agenda")).toBe("/colors/agenda");
    expect(toColorsInternalPathname(COLORS, "/eventos")).toBe("/colors/eventos");
    expect(toColorsInternalPathname(COLORS, "/suporte")).toBe("/colors/suporte");
    expect(toColorsInternalPathname(COLORS, "/afiliados")).toBe("/colors/afiliados");
    expect(toColorsInternalPathname(COLORS, "/rastreio")).toBe("/colors/rastreio");
    expect(toColorsInternalPathname(COLORS, "/entrar")).toBe("/colors/entrar");
    expect(toColorsInternalPathname(COLORS, "/criar-conta")).toBe("/colors/criar-conta");
  });
  it("does not double-prefix internal Colors routes", () => expect(toColorsInternalPathname(COLORS, "/colors/agenda")).toBe("/colors/agenda"));
  it("never rewrites Colors APIs or static assets", () => {
    expect(toColorsInternalPathname(COLORS, "/api/public/webhooks/maisfy-colors")).toBe("/api/public/webhooks/maisfy-colors");
    expect(toColorsInternalPathname(COLORS, "/assets/app.js")).toBe("/assets/app.js");
    expect(toColorsInternalPathname(COLORS, "/robots.txt")).toBe("/robots.txt");
  });
});

describe("WMP clean public path routing", () => {
  it("maps the WMP root to its internal namespace", () => expect(toWmpInternalPathname(WMP, "/")).toBe("/wmp"));
  it("locks every public WMP route to a same-host internal path", () => {
    expect(wmpHostLockTarget(WMP, "/")).toBe("/wmp");
    expect(wmpHostLockTarget(WMP, "/djs")).toBe("/wmp/djs");
    expect(wmpHostLockTarget(WMP, "/empresas")).toBe("/wmp/empresas");
    expect(wmpHostLockTarget(WMP, "/orcamento")).toBe("/wmp/orcamento");
    expect(wmpHostLockTarget(WMP, "/onde-estou")).toBe("/wmp/onde-estou");
  });
  it("never returns a cross-domain target from the WMP host lock", () => {
    for (const pathname of ["/", "/djs", "/empresas", "/orcamento", "/parceiro", "/onde-estou"]) {
      const target = wmpHostLockTarget(WMP, pathname);
      expect(target).not.toContain("impulsionando.com.br");
      expect(target).not.toMatch(/^https?:\/\//);
    }
  });
  it("leaves global Core and internal WMP routes alone", () => {
    expect(wmpHostLockTarget(WMP, "/auth")).toBeNull();
    expect(wmpHostLockTarget(WMP, "/dashboard")).toBeNull();
    expect(wmpHostLockTarget(WMP, "/wmp/djs")).toBeNull();
  });
  it("allows same-host and relative WMP redirects, and blocks cross-domain ones", () => {
    expect(wmpRedirectLeavesCanonicalHost("/wmp", WMP)).toBe(false);
    expect(wmpRedirectLeavesCanonicalHost("https://wmp.impulsionando.com.br/wmp", WMP)).toBe(false);
    expect(wmpRedirectLeavesCanonicalHost("https://impulsionando.com.br/", WMP)).toBe(true);
    expect(wmpRedirectLeavesCanonicalHost("https://chrismed.impulsionando.com.br/", WMP)).toBe(true);
  });
});

describe("tenant landing resolution", () => {
  it("routes CHRISMED to its dedicated landing", () => expect(tenantLandingTargetForHost("chrismed.impulsionando.com.br")).toBe("/chrismed"));
  it("routes Colors Saúde from its canonical subdomain", () => expect(tenantLandingTargetForHost(COLORS)).toBe("/colors"));
  it("routes WMP to its dedicated landing", () => expect(tenantLandingTargetForHost(WMP)).toBe("/wmp"));
  it("routes CSI to its dedicated landing", () => expect(tenantLandingTargetForHost("csi.impulsionando.com.br")).toBe("/csi"));
  it("routes CSI staging rehearsal host to /csi", () => expect(tenantLandingTargetForHost("stg.csi.impulsionando.com.br")).toBe("/csi"));
  it("uses the storefront for a tenant without a dedicated landing", () => expect(tenantSubdomainTarget("cliente-novo")).toBe("/vitrine/cliente-novo"));
  it("does not treat the apex domain as a tenant", () => expect(tenantLandingTargetForHost("impulsionando.com.br")).toBeNull());
  it("does not treat bare platform staging apex as a tenant landing", () => {
    expect(tenantLandingTargetForHost("stg.impulsionando.com.br")).toBeNull();
  });
});

describe("stg.<tenant> host recognition", () => {
  it("maps stg.csi… to slug csi (not stg)", () => {
    expect(getTenantSubdomain("stg.csi.impulsionando.com.br")).toEqual({
      slug: "csi",
      host: "stg.csi.impulsionando.com.br",
      rootDomain: "impulsionando.com.br",
    });
  });
  it("maps other stg.<tenant> rehearsal hosts to the tenant slug", () => {
    expect(getTenantSubdomain("stg.wmp.impulsionando.com.br")?.slug).toBe("wmp");
    expect(getTenantSubdomain("stg.chrismed.impulsionando.com.br")?.slug).toBe("chrismed");
    expect(tenantLandingTargetForHost("stg.wmp.impulsionando.com.br")).toBe("/wmp");
  });
  it("does not treat bare stg.impulsionando.com.br as a tenant", () => {
    expect(getTenantSubdomain("stg.impulsionando.com.br")).toBeNull();
  });
  it("does not invent a tenant from stg.<reserved>", () => {
    expect(getTenantSubdomain("stg.api.impulsionando.com.br")).toBeNull();
    expect(getTenantSubdomain("stg.www.impulsionando.com.br")).toBeNull();
  });
  it("keeps prod single-label tenant hosts unchanged", () => {
    expect(getTenantSubdomain("csi.impulsionando.com.br")?.slug).toBe("csi");
    expect(getTenantSubdomain("wmp.impulsionando.com.br")?.slug).toBe("wmp");
  });
});

describe("platform core hosts", () => {
  it("treats apex, www and app as core — not unknown tenants", () => {
    expect(isImpulsionandoPlatformHost("impulsionando.com.br")).toBe(true);
    expect(isImpulsionandoPlatformHost("www.impulsionando.com.br")).toBe(true);
    expect(isImpulsionandoPlatformHost("app.impulsionando.com.br")).toBe(true);
    expect(isImpulsionandoPlatformHost("admin.impulsionando.com.br")).toBe(true);
    expect(isImpulsionandoPlatformHost("stg.impulsionando.com.br")).toBe(true);
  });
  it("does not treat customer tenant hosts as core", () => {
    expect(isImpulsionandoPlatformHost("chrismed.impulsionando.com.br")).toBe(false);
    expect(isImpulsionandoPlatformHost("riomed.impulsionando.com.br")).toBe(false);
    expect(isImpulsionandoPlatformHost("wmp.impulsionando.com.br")).toBe(false);
    expect(isImpulsionandoPlatformHost("stg.csi.impulsionando.com.br")).toBe(false);
  });
});
