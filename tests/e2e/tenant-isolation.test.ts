/**
 * Core E2E — isolamento real por company_id no schema vigente.
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { admin, createUser, deleteUser, signIn, createCompany, deleteCompany } from "../helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  a: `e2e-core-iso-a-${RUN}@example.com`,
  b: `e2e-core-iso-b-${RUN}@example.com`,
};

let companyA = "";
let companyB = "";
let userA = "";
let userB = "";
let clientA!: SupabaseClient;
let clientB!: SupabaseClient;
let intakeIdA = "";
let auditIdA = "";

beforeAll(async () => {
  companyA = await createCompany(`E2E Core Iso A ${RUN}`);
  companyB = await createCompany(`E2E Core Iso B ${RUN}`);

  const a = await createUser(emails.a);
  const b = await createUser(emails.b);
  userA = a.id;
  userB = b.id;

  const { error: roleAError } = await admin.from("user_roles").insert({ user_id: userA, company_id: companyA, role: "gestor" });
  if (roleAError) throw roleAError;
  const { error: roleBError } = await admin.from("user_roles").insert({ user_id: userB, company_id: companyB, role: "gestor" });
  if (roleBError) throw roleBError;

  clientA = (await signIn(emails.a)).client;
  clientB = (await signIn(emails.b)).client;

  const { data: intake, error: intakeError } = await admin
    .from("core_client_request_intakes")
    .insert({
      company_id: companyA,
      requester_user_id: userA,
      source_mode: "TEXT",
      raw_input: `core-isolation-${RUN}`,
      structured_request: { run: RUN },
      status: "DRAFT",
      metadata: { automated_test: true },
    })
    .select("id")
    .single();
  if (intakeError) throw intakeError;
  intakeIdA = intake!.id;

  const { data: audit, error: auditError } = await admin
    .from("audit_logs")
    .insert({
      company_id: companyA,
      user_id: userA,
      user_email: emails.a,
      action: "e2e.core_isolation.seed",
      entity: "core_client_request_intakes",
      entity_id: intakeIdA,
      metadata: { run: RUN },
    })
    .select("id")
    .single();
  if (auditError) throw auditError;
  auditIdA = audit!.id;
});

afterAll(async () => {
  if (auditIdA) await admin.from("audit_logs").delete().eq("id", auditIdA);
  if (intakeIdA) await admin.from("core_client_request_intakes").delete().eq("id", intakeIdA);
  if (userA) await admin.from("user_roles").delete().eq("user_id", userA);
  if (userB) await admin.from("user_roles").delete().eq("user_id", userB);
  if (userA) await deleteUser(userA);
  if (userB) await deleteUser(userB);
  if (companyA) await deleteCompany(companyA);
  if (companyB) await deleteCompany(companyB);
});

describe("Core tenant isolation (E2E)", () => {
  it("user B cannot read company A client request", async () => {
    const { data, error } = await clientB.from("core_client_request_intakes").select("id,company_id").eq("id", intakeIdA);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("user A can read its company client request", async () => {
    const { data, error } = await clientA.from("core_client_request_intakes").select("id,company_id").eq("id", intakeIdA);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(1);
    expect(data![0].company_id).toBe(companyA);
  });

  it("user B cannot read company A audit event", async () => {
    const { data, error } = await clientB.from("audit_logs").select("id").eq("id", auditIdA);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("user B cannot enumerate any company A intake", async () => {
    const { data, error } = await clientB.from("core_client_request_intakes").select("id,company_id").eq("company_id", companyA);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
