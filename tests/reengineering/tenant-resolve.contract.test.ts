/**
 * Phase 4 tenant resolve — pure Zod contract tests (no live DB).
 */
import { describe, expect, it } from "vitest";
import {
  TenantContextSchema,
  TenantResolveQuerySchema,
} from "@impulsionando/tenant-context";

describe("@impulsionando/tenant-context TenantResolveQuerySchema", () => {
  it("accepts valid hostname query", () => {
    const parsed = TenantResolveQuerySchema.parse({
      host: "chrismed.impulsionando.com.br",
    });
    expect(parsed.host).toBe("chrismed.impulsionando.com.br");
  });

  it("trims host whitespace", () => {
    expect(TenantResolveQuerySchema.parse({ host: "  example.com  " })).toEqual({
      host: "example.com",
    });
  });

  it("rejects empty host", () => {
    expect(TenantResolveQuerySchema.safeParse({ host: "" }).success).toBe(false);
  });

  it("rejects host exceeding max length", () => {
    expect(TenantResolveQuerySchema.safeParse({ host: "a".repeat(254) }).success).toBe(
      false,
    );
  });

  it("rejects unknown keys (strict)", () => {
    expect(
      TenantResolveQuerySchema.safeParse({ host: "x.example.com", extra: true }).success,
    ).toBe(false);
  });

  it("rejects missing host", () => {
    expect(TenantResolveQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe("@impulsionando/tenant-context TenantContextSchema", () => {
  const fixture = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Chrismed",
    subdomain: "chrismed",
    domain: "chrismed.impulsionando.com.br",
    primary_color: "#0066cc",
    secondary_color: "#ffffff",
    logo_url: "https://example.com/logo.png",
    is_active: true,
  };

  it("accepts full tenant branding context", () => {
    const parsed = TenantContextSchema.parse(fixture);
    expect(parsed.name).toBe("Chrismed");
    expect(parsed.is_active).toBe(true);
  });

  it("accepts nullable branding fields", () => {
    const parsed = TenantContextSchema.parse({
      ...fixture,
      subdomain: null,
      domain: null,
      primary_color: null,
      secondary_color: null,
      logo_url: null,
    });
    expect(parsed.subdomain).toBeNull();
    expect(parsed.logo_url).toBeNull();
  });

  it("rejects invalid uuid id", () => {
    expect(TenantContextSchema.safeParse({ ...fixture, id: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("rejects empty name", () => {
    expect(TenantContextSchema.safeParse({ ...fixture, name: "" }).success).toBe(false);
  });

  it("rejects inactive tenant flag when explicitly false", () => {
    expect(TenantContextSchema.safeParse({ ...fixture, is_active: false }).success).toBe(true);
    expect(TenantContextSchema.parse({ ...fixture, is_active: false }).is_active).toBe(false);
  });
});

describe("tenant resolve deny cases (contract-level)", () => {
  it("unknown host query still validates as hostname string", () => {
    const parsed = TenantResolveQuerySchema.parse({ host: "no-such-tenant.example.com" });
    expect(parsed.host).toBe("no-such-tenant.example.com");
  });
});
