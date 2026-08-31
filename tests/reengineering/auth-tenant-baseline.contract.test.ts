/**
 * P1-J — Auth/tenant baseline contract suite.
 *
 * Encodes T-01…T-10, R-01…R-12, and Support A1–A12 expected outcomes without
 * Nest or live Supabase. Live staging checks are gated behind AUTH_TENANT_BASELINE_LIVE
 * so default `npm test` never needs secrets.
 *
 * Plan: docs/reengineering/04-migration/phase-1/AUTH-TENANT-BASELINE-TESTS.md
 */
import { describe, expect, it } from "vitest";

type Decision = "allow" | "deny";

type CaseRow = {
  id: string;
  decision: Decision;
  /** Stable rule the case encodes (string contract, not runtime AuthZ). */
  rule: string;
};

const TENANT_CASES: CaseRow[] = [
  { id: "T-01", decision: "allow", rule: "host∩membership A → active tenant A" },
  { id: "T-02", decision: "deny", rule: "member A must not read tenant B resource" },
  { id: "T-03", decision: "deny", rule: "client company_id=B never authorizes write onto B" },
  { id: "T-04", decision: "deny", rule: "valid session without host membership → deny private" },
  { id: "T-05", decision: "deny", rule: "membership without capability → deny" },
  { id: "T-06", decision: "deny", rule: "missing/expired/forged session → deny" },
  {
    id: "T-07",
    decision: "deny",
    rule: "anon attribution uses hostname; forged body company_id=B ignored",
  },
  {
    id: "T-08",
    decision: "allow",
    rule: "service_role only in authorized server process + audit",
  },
  { id: "T-09", decision: "deny", rule: "platform actor without explicit platform policy on B" },
  {
    id: "T-10",
    decision: "deny",
    rule: "vertical membership must translate to company_id; no alternate-id bypass",
  },
];

const RBAC_CASES: CaseRow[] = [
  { id: "R-01", decision: "allow", rule: "actor in A with capability → allow A" },
  { id: "R-02", decision: "deny", rule: "actor in A against B id → deny" },
  { id: "R-03", decision: "deny", rule: "create/move into B from A → deny" },
  { id: "R-04", decision: "deny", rule: "authenticated, no membership → deny" },
  { id: "R-05", decision: "deny", rule: "wrong role/capability → deny" },
  { id: "R-06", decision: "deny", rule: "anon on protected use case → deny" },
  { id: "R-07", decision: "allow", rule: "platform_admin with required cap → allow + audit" },
  { id: "R-08", decision: "deny", rule: "platform_admin without required cap → deny" },
  { id: "R-09", decision: "deny", rule: "master observer write → deny" },
  { id: "R-10", decision: "allow", rule: "machine valid scoped credential → allow + audit" },
  { id: "R-11", decision: "deny", rule: "machine bad/replayed credential → deny" },
  { id: "R-12", decision: "allow", rule: "privileged service path requires audit trail" },
];

const SUPPORT_CASES: CaseRow[] = [
  { id: "A1", decision: "allow", rule: "public create valid payload" },
  { id: "A2", decision: "deny", rule: "public create invalid → VALIDATION_FAILED" },
  { id: "A3", decision: "deny", rule: "forged company_id in body never authorizes" },
  { id: "A4", decision: "deny", rule: "list without session → UNAUTHENTICATED" },
  { id: "A5", decision: "allow", rule: "list A with support.ticket.read → A rows only" },
  { id: "A6", decision: "deny", rule: "list A aiming at B → zero B rows" },
  { id: "A7", decision: "deny", rule: "list no membership/capability → FORBIDDEN" },
  { id: "A8", decision: "allow", rule: "update-status own tenant + cap → allow + audit" },
  { id: "A9", decision: "deny", rule: "update-status other tenant → FORBIDDEN|NOT_FOUND" },
  { id: "A10", decision: "deny", rule: "update-status without operator cap → FORBIDDEN" },
  { id: "A11", decision: "deny", rule: "illegal status transition → CONFLICT|VALIDATION_FAILED" },
  {
    id: "A12",
    decision: "deny",
    rule: "platform cross-tenant list deny by default unless explicit platform scope",
  },
];

/** Dominant key belief for Phase 1 contracts (persistence language). */
const DOMINANT_TENANT_KEY = "company_id";

const SUPPORT_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "CONFLICT",
] as const;

type ActorKind =
  | "anon"
  | "member"
  | "professional"
  | "tenant_admin"
  | "platform_admin"
  | "machine";

type AuthzInput = {
  actor: ActorKind;
  hasSession: boolean;
  membershipCompanyId: string | null;
  activeTenantCompanyId: string | null;
  clientHintCompanyId: string | null;
  capabilities: string[];
  requiredCapability: string | null;
  resourceCompanyId: string | null;
  /** Hostname-resolved tenant for public attribution */
  hostCompanyId: string | null;
};

/**
 * Minimal pure policy stub encoding P1-C/P1-D deny-by-default.
 * Not production AuthZ — contract executable for Phase 1 baseline.
 */
function decide(input: AuthzInput): Decision {
  const {
    actor,
    hasSession,
    membershipCompanyId,
    activeTenantCompanyId,
    clientHintCompanyId,
    capabilities,
    requiredCapability,
    resourceCompanyId,
    hostCompanyId,
  } = input;

  // Client hint never authorizes.
  if (
    clientHintCompanyId &&
    activeTenantCompanyId &&
    clientHintCompanyId !== activeTenantCompanyId
  ) {
    return "deny";
  }
  if (
    clientHintCompanyId &&
    hostCompanyId &&
    !hasSession &&
    clientHintCompanyId !== hostCompanyId
  ) {
    // Public path: forged body tenant ignored → treat as host attribution (allow create elsewhere).
    // For protected reads/writes this is deny.
    if (requiredCapability) return "deny";
  }

  if (actor === "anon") {
    if (requiredCapability) return "deny";
    return "allow"; // public create-shaped path only when no capability required
  }

  if (!hasSession) return "deny";

  if (actor === "platform_admin") {
    if (!requiredCapability) return "deny";
    return capabilities.includes(requiredCapability) ? "allow" : "deny";
  }

  if (actor === "machine") {
    if (!requiredCapability) return "deny";
    return capabilities.includes(requiredCapability) ? "allow" : "deny";
  }

  if (!membershipCompanyId || !activeTenantCompanyId) return "deny";
  if (membershipCompanyId !== activeTenantCompanyId) return "deny";

  if (resourceCompanyId && resourceCompanyId !== activeTenantCompanyId) return "deny";

  if (requiredCapability && !capabilities.includes(requiredCapability)) return "deny";

  return "allow";
}

function resolvePublicAttribution(opts: {
  hostCompanyId: string;
  bodyCompanyId: string | null;
}): string {
  // Hostname wins; client company_id is never authorization.
  void opts.bodyCompanyId;
  return opts.hostCompanyId;
}

describe("P1-J auth/tenant baseline — matrix inventory", () => {
  it("registers T-01…T-10 with allow and deny coverage", () => {
    expect(TENANT_CASES.map((c) => c.id)).toEqual([
      "T-01",
      "T-02",
      "T-03",
      "T-04",
      "T-05",
      "T-06",
      "T-07",
      "T-08",
      "T-09",
      "T-10",
    ]);
    expect(TENANT_CASES.some((c) => c.decision === "allow")).toBe(true);
    expect(TENANT_CASES.filter((c) => c.decision === "deny").length).toBeGreaterThanOrEqual(6);
  });

  it("registers R-01…R-12 and Support A1–A12", () => {
    expect(RBAC_CASES).toHaveLength(12);
    expect(SUPPORT_CASES).toHaveLength(12);
    expect(RBAC_CASES.every((c) => c.rule.length > 0)).toBe(true);
    expect(SUPPORT_CASES.every((c) => c.id.startsWith("A"))).toBe(true);
  });

  it("declares company_id as dominant tenant persistence key", () => {
    expect(DOMINANT_TENANT_KEY).toBe("company_id");
  });

  it("lists Support error codes used by deny expectations", () => {
    expect(SUPPORT_ERROR_CODES).toContain("UNAUTHENTICATED");
    expect(SUPPORT_ERROR_CODES).toContain("FORBIDDEN");
    expect(SUPPORT_ERROR_CODES).toContain("VALIDATION_FAILED");
  });
});

describe("P1-J auth/tenant baseline — policy stub (mock)", () => {
  const tenantA = "company-a";
  const tenantB = "company-b";

  it("T-01 / R-01 / A5: member A with capability on A resource → allow", () => {
    expect(
      decide({
        actor: "member",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: ["support.ticket.read"],
        requiredCapability: "support.ticket.read",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("allow");
  });

  it("T-02 / R-02 / A6: member A against B resource → deny", () => {
    expect(
      decide({
        actor: "member",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: ["support.ticket.read"],
        requiredCapability: "support.ticket.read",
        resourceCompanyId: tenantB,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });

  it("T-03 / A3: client hint company_id=B does not authorize", () => {
    expect(
      decide({
        actor: "member",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: tenantB,
        capabilities: ["support.ticket.write"],
        requiredCapability: "support.ticket.write",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });

  it("T-04 / R-04 / A7: session without membership → deny", () => {
    expect(
      decide({
        actor: "member",
        hasSession: true,
        membershipCompanyId: null,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: [],
        requiredCapability: "support.ticket.read",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });

  it("T-05 / R-05 / A10: membership without required capability → deny", () => {
    expect(
      decide({
        actor: "member",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: [],
        requiredCapability: "support.ticket.update_status",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });

  it("T-06 / R-06 / A4: no session on protected use case → deny", () => {
    expect(
      decide({
        actor: "anon",
        hasSession: false,
        membershipCompanyId: null,
        activeTenantCompanyId: null,
        clientHintCompanyId: null,
        capabilities: [],
        requiredCapability: "support.ticket.read",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });

  it("T-07 / A3 public attribution: hostname wins over forged body company_id", () => {
    expect(
      resolvePublicAttribution({ hostCompanyId: tenantA, bodyCompanyId: tenantB }),
    ).toBe(tenantA);
  });

  it("A1: anon public create (no capability required) → allow", () => {
    expect(
      decide({
        actor: "anon",
        hasSession: false,
        membershipCompanyId: null,
        activeTenantCompanyId: null,
        clientHintCompanyId: tenantB,
        capabilities: [],
        requiredCapability: null,
        resourceCompanyId: null,
        hostCompanyId: tenantA,
      }),
    ).toBe("allow");
  });

  it("T-09 / R-08 / A12 default: platform without required cap → deny", () => {
    expect(
      decide({
        actor: "platform_admin",
        hasSession: true,
        membershipCompanyId: null,
        activeTenantCompanyId: null,
        clientHintCompanyId: tenantB,
        capabilities: [],
        requiredCapability: "support.ticket.read_platform",
        resourceCompanyId: tenantB,
        hostCompanyId: null,
      }),
    ).toBe("deny");
  });

  it("R-07: platform_admin with explicit platform cap → allow", () => {
    expect(
      decide({
        actor: "platform_admin",
        hasSession: true,
        membershipCompanyId: null,
        activeTenantCompanyId: null,
        clientHintCompanyId: null,
        capabilities: ["support.ticket.read_platform"],
        requiredCapability: "support.ticket.read_platform",
        resourceCompanyId: tenantB,
        hostCompanyId: null,
      }),
    ).toBe("allow");
  });

  it("R-10 / R-11: machine credential capability gate", () => {
    const base = {
      actor: "machine" as const,
      hasSession: true,
      membershipCompanyId: null,
      activeTenantCompanyId: null,
      clientHintCompanyId: null,
      requiredCapability: "support.ticket.tick",
      resourceCompanyId: null,
      hostCompanyId: null,
    };
    expect(decide({ ...base, capabilities: ["support.ticket.tick"] })).toBe("allow");
    expect(decide({ ...base, capabilities: [] })).toBe("deny");
  });

  it("A8: operator with update_status on own tenant → allow", () => {
    expect(
      decide({
        actor: "tenant_admin",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: ["support.ticket.update_status"],
        requiredCapability: "support.ticket.update_status",
        resourceCompanyId: tenantA,
        hostCompanyId: tenantA,
      }),
    ).toBe("allow");
  });

  it("A9: operator update on other tenant ticket → deny", () => {
    expect(
      decide({
        actor: "tenant_admin",
        hasSession: true,
        membershipCompanyId: tenantA,
        activeTenantCompanyId: tenantA,
        clientHintCompanyId: null,
        capabilities: ["support.ticket.update_status"],
        requiredCapability: "support.ticket.update_status",
        resourceCompanyId: tenantB,
        hostCompanyId: tenantA,
      }),
    ).toBe("deny");
  });
});

const liveEnabled = process.env.AUTH_TENANT_BASELINE_LIVE === "1";
const STAGING_REF = "kyiczxtcoexnvcqgrgkr";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";

describe.skipIf(!liveEnabled)("P1-J auth/tenant baseline — live staging (gated)", () => {
  it("refuses prod and requires staging URL before any live probe", () => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    expect(url, "SUPABASE_URL / VITE_SUPABASE_URL required when AUTH_TENANT_BASELINE_LIVE=1").toBeTruthy();
    expect(url.includes(PROD_REF), `must not target prod ${PROD_REF}`).toBe(false);
    expect(url.includes(STAGING_REF), `must target staging ${STAGING_REF}`).toBe(true);
  });

  it("service_role key is present for staging probes (value never asserted)", () => {
    expect(Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)).toBe(true);
  });

  it("structure smoke: companies table readable on staging (post-restore)", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { count, error } = await sb.from("companies").select("*", { count: "exact", head: true });
    expect(error, error?.message).toBeNull();
    expect((count ?? 0) > 0, "empty companies — restore or fixtures missing").toBe(true);
  });
});
