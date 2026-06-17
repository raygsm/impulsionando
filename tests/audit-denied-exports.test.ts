import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from "./helpers";

/**
 * Verifies that denied export/download attempts from /admin and /clube are
 * persisted to `audit_logs` (with author + company) via the
 * `log_security_event` SECURITY DEFINER RPC.
 *
 * We exercise the RPC directly as a non-admin caller: that is exactly what
 * `requireAdminOrAudit` does on the server right before throwing 401.
 */

const RUN = Date.now();
const emails = {
  member: `denial-member-${RUN}@example.com`,
};

let companyId = "";
let memberId = "";
let memberClient: Awaited<ReturnType<typeof signIn>>["client"];

beforeAll(async () => {
  companyId = await createCompany(`Denial Co ${RUN}`);
  const u = await createUser(emails.member);
  memberId = u.id;
  await assignProfile({ userId: u.id, companyId, profileId: PROFILES.gestor, email: emails.member });
  memberClient = (await signIn(emails.member)).client;
}, 180_000);

afterAll(async () => {
  await admin.from("audit_logs").delete().eq("user_id", memberId);
  await deleteCompany(companyId);
  await deleteUser(memberId);
}, 60_000);

describe("denied export/download attempts are audited", () => {
  it("non-admin invoking the cron-audit data source records security.access_denied", async () => {
    const before = Date.now();
    await memberClient.rpc("log_security_event", {
      _entity: "clube_cron_log",
      _action: "security.access_denied",
      _company: companyId,
      _entity_id: null,
      _metadata: { route: "/admin/clube", export_scope: "clube_cron_log_audit", reason: "missing_admin_role" },
    });
    const { data } = await admin
      .from("audit_logs")
      .select("user_id, user_email, company_id, entity, action, metadata, created_at")
      .eq("user_id", memberId)
      .eq("entity", "clube_cron_log")
      .gte("created_at", new Date(before - 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    expect(data?.length).toBe(1);
    expect(data![0].action).toBe("security.access_denied");
    expect(data![0].company_id).toBe(companyId);
    expect(data![0].user_email).toBe(emails.member);
    expect((data![0].metadata as any)?.export_scope).toBe("clube_cron_log_audit");
  });

  it("non-admin invoking the audit-csv export records author + empresa", async () => {
    const before = Date.now();
    await memberClient.rpc("log_security_event", {
      _entity: "audit_logs",
      _action: "security.access_denied",
      _company: companyId,
      _entity_id: null,
      _metadata: { route: "/admin", export_scope: "audit_logs_csv", reason: "missing_admin_role" },
    });
    const { data } = await admin
      .from("audit_logs")
      .select("user_id, company_id, action, metadata")
      .eq("user_id", memberId)
      .eq("entity", "audit_logs")
      .gte("created_at", new Date(before - 1000).toISOString())
      .limit(1);
    expect(data?.length).toBe(1);
    expect(data![0].company_id).toBe(companyId);
    expect((data![0].metadata as any)?.export_scope).toBe("audit_logs_csv");
  });

  it("anonymous callers cannot record audit events (RPC requires auth)", async () => {
    const anon = (await import("./helpers")).anonClient();
    const { error } = await anon.rpc("log_security_event", {
      _entity: "audit_logs",
      _action: "security.access_denied",
      _metadata: {},
    });
    expect(error).not.toBeNull();
  });
});
