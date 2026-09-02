import { describe, expect, it } from "vitest";
import {
  ActiveTenantContextSchema,
  TenantMembershipSchema,
  resolveActiveTenant,
} from "@impulsionando/tenant-context";

const COMPANY_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("Phase 4B — tenant membership contract", () => {
  it("TM-01: host A + membership A → allow", () => {
    const result = resolveActiveTenant({
      hostTenantId: COMPANY_A,
      memberships: [{ companyId: COMPANY_A, roles: ["admin"] }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activeTenantId).toBe(COMPANY_A);
      expect(result.membership.roles).toEqual(["admin"]);
    }
  });

  it("TM-02: host B + membership A only → TENANT_MISMATCH", () => {
    const result = resolveActiveTenant({
      hostTenantId: COMPANY_B,
      memberships: [{ companyId: COMPANY_A, roles: ["user"] }],
    });
    expect(result).toEqual({ ok: false, code: "TENANT_MISMATCH" });
  });

  it("TM-03: valid host + no memberships → NO_MEMBERSHIP", () => {
    const result = resolveActiveTenant({
      hostTenantId: COMPANY_A,
      memberships: [],
    });
    expect(result).toEqual({ ok: false, code: "NO_MEMBERSHIP" });
  });

  it("TM-04: unknown host → TENANT_NOT_FOUND", () => {
    const result = resolveActiveTenant({
      hostTenantId: null,
      memberships: [{ companyId: COMPANY_A, roles: ["admin"] }],
    });
    expect(result).toEqual({ ok: false, code: "TENANT_NOT_FOUND" });
  });

  it("validates ActiveTenantContext envelope shape", () => {
    const parsed = ActiveTenantContextSchema.safeParse({
      host: "chrismed.impulsionando.com.br",
      tenant: {
        id: COMPANY_A,
        name: "Chrismed",
        subdomain: "chrismed",
        domain: "agenda.chrismed.com.br",
        primary_color: "#0066cc",
        secondary_color: "#ffffff",
        logo_url: null,
        is_active: true,
      },
      membership: { companyId: COMPANY_A, roles: ["admin"] },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects membership without roles", () => {
    const parsed = TenantMembershipSchema.safeParse({
      companyId: COMPANY_A,
      roles: [],
    });
    expect(parsed.success).toBe(false);
  });
});
