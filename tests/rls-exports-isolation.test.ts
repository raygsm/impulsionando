import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES, MASTER_COMPANY,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests covering data-export and download paths reachable from
 * `/admin/clube` and `/clube`. We verify that members without the proper
 * `user_has_permission` (or `admin` role) cannot read sensitive data through
 * the same tables/RPCs that the export buttons use.
 */

const RUN = Date.now();
const emails = {
  admin: `exp-admin-${RUN}@example.com`,
  member: `exp-member-${RUN}@example.com`,
  other: `exp-other-${RUN}@example.com`,
};

let companyA = "";
let users: Record<string, string> = {};
let clients: Record<string, SupabaseClient> = {};
let receiptIds: string[] = [];

beforeAll(async () => {
  companyA = await createCompany(`Export Co ${RUN}`);

  const a = await createUser(emails.admin);
  const m = await createUser(emails.member);
  const o = await createUser(emails.other);
  users = { admin: a.id, member: m.id, other: o.id };

  await assignProfile({ userId: a.id, companyId: MASTER_COMPANY, profileId: PROFILES.superAdmin, email: emails.admin });
  await assignProfile({ userId: m.id, companyId: companyA, profileId: PROFILES.gestor, email: emails.member });
  await assignProfile({ userId: o.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.other });

  // Promote admin user to has_role('admin') via user_roles table (RBAC pattern)
  await admin.from("user_roles").insert({ user_id: a.id, role: "admin" });

  clients.admin = (await signIn(emails.admin)).client;
  clients.member = (await signIn(emails.member)).client;
  clients.other = (await signIn(emails.other)).client;

  // Seed: two receipts belonging to the "member" user; the "other" user must not see them.
  const ins = await admin.from("clube_receipts").insert([
    { user_id: users.member, company_id: companyA, kind: "pix", status: "available", title: `Recibo Pix ${RUN}` },
    { user_id: users.member, company_id: companyA, kind: "consumption", status: "available", title: `Recibo Consumo ${RUN}` },
  ]).select("id");
  receiptIds = (ins.data ?? []).map((r: { id: string }) => r.id);

  // Seed: a journey log row to verify admin-only audit endpoint protects data
  await admin.from("clube_cron_log").insert({
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    enqueued_count: 1,
    error_count: 0,
    status: "ok",
  });
}, 180_000);

afterAll(async () => {
  await admin.from("clube_receipts").delete().in("id", receiptIds);
  await admin.from("user_roles").delete().in("user_id", Object.values(users));
  await deleteCompany(companyA);
  await Promise.all(Object.values(users).map(deleteUser));
}, 120_000);

describe("/clube — receipts download data source", () => {
  it("a member can only read their own receipts (RLS scoping)", async () => {
    const mine = await clients.member.from("clube_receipts").select("id, title").eq("user_id", users.member);
    expect((mine.data ?? []).length).toBeGreaterThan(0);

    const otherUsersReceipts = await clients.other.from("clube_receipts").select("id").eq("user_id", users.member);
    expect(otherUsersReceipts.data ?? []).toHaveLength(0);
  });
});

describe("/admin/clube — cron log audit + export source", () => {
  it("non-admin members cannot read clube_cron_log (used by the CSV export)", async () => {
    const r = await clients.member.from("clube_cron_log").select("id").limit(10);
    // Either RLS returns an error or an empty list; both are acceptable as long as no rows leak.
    expect(r.data ?? []).toHaveLength(0);
  });

  it("non-admin members cannot read clube_journey_log (used by the audit table)", async () => {
    const r = await clients.member.from("clube_journey_log").select("step_id").limit(10);
    expect(r.data ?? []).toHaveLength(0);
  });

  it("super admin can read both tables (positive control)", async () => {
    const cron = await clients.admin.from("clube_cron_log").select("id").limit(10);
    expect(cron.error).toBeNull();
    const journey = await clients.admin.from("clube_journey_log").select("step_id").limit(10);
    expect(journey.error).toBeNull();
  });
});

describe("contab_office_finance is never exposed to members without contab.finance.read", () => {
  it("a gestor without explicit finance.read cannot list internal finance rows", async () => {
    const r = await clients.member.from("contab_office_finance").select("id").eq("company_id", companyA);
    // gestor profile does not grant contab.finance.read by default
    expect(r.data ?? []).toHaveLength(0);
  });
});
