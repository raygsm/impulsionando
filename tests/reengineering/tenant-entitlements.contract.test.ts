import { describe, expect, it } from "vitest";
import {
  TenantConfigV1Schema,
  TenantEntitlementsV1Schema,
  featureFlagKey,
  mergeModuleLimits,
  resolveEffectiveFlags,
  resolveEffectiveModules,
  resolveFlagValue,
} from "@impulsionando/contracts";

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("Phase 4B — tenant entitlements contract", () => {
  it("TE-01: intersects enabled modules with plan modules", () => {
    expect(resolveEffectiveModules(["crm", "support", "billing"], ["crm", "support"])).toEqual([
      "crm",
      "support",
    ]);
  });

  it("TE-02: no plan → enabled modules only", () => {
    expect(resolveEffectiveModules(["crm", "support"], [])).toEqual(["crm", "support"]);
  });

  it("TE-03: resolves flags with override precedence", () => {
    const flags = resolveEffectiveFlags(
      [
        { key: "beta_nav", module_slug: "crm", default_value: false },
        { key: "legacy_mode", module_slug: null, default_value: true },
      ],
      [{ flag_key: "beta_nav", module_slug: "crm", value: true }],
    );
    expect(flags).toEqual({
      "crm.beta_nav": true,
      legacy_mode: true,
    });
  });

  it("TE-04: unknown flag key defaults to deny", () => {
    const flags = resolveEffectiveFlags(
      [{ key: "known", module_slug: null, default_value: true }],
      [],
    );
    expect(resolveFlagValue(flags, "unknown.flag")).toBe(false);
    expect(resolveFlagValue(flags, "known")).toBe(true);
  });

  it("TE-05: featureFlagKey builds module-scoped keys", () => {
    expect(featureFlagKey("crm", "beta_nav")).toBe("crm.beta_nav");
    expect(featureFlagKey(null, "platform_mode")).toBe("platform_mode");
  });

  it("TE-06: mergeModuleLimits groups by module slug", () => {
    expect(
      mergeModuleLimits([
        { module_slug: "crm", limits: { seats: 5 } },
        { module_slug: "support", limits: { tickets: 100 } },
      ]),
    ).toEqual({
      crm: { seats: 5 },
      support: { tickets: 100 },
    });
  });

  it("validates TenantConfigV1 envelope", () => {
    const parsed = TenantConfigV1Schema.safeParse({
      schemaVersion: 1,
      id: TENANT_ID,
      name: "Chrismed",
      subdomain: "chrismed",
      domain: "agenda.chrismed.com.br",
      is_active: true,
      branding: {
        logo_url: null,
        primary_color: "#0066cc",
        secondary_color: "#ffffff",
        tagline: null,
      },
      locale: {
        country_code: "BR",
        locale: "pt-BR",
        currency_code: "BRL",
        phone_country_code: "+55",
        timezone: "America/Sao_Paulo",
      },
      niche: { niche_id: null, subnicho_slug: null, segment: null },
      releaseChannel: "stable",
    });
    expect(parsed.success).toBe(true);
  });

  it("validates TenantEntitlementsV1 envelope", () => {
    const parsed = TenantEntitlementsV1Schema.safeParse({
      schemaVersion: 1,
      tenantId: TENANT_ID,
      planCode: "PRO",
      contractStatus: "active",
      modules: ["crm", "support"],
      limits: { crm: { seats: 10 } },
      financialStatus: "current",
      flags: { "crm.beta_nav": false },
    });
    expect(parsed.success).toBe(true);
  });
});
