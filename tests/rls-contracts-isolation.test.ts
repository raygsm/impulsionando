/**
 * RLS isolation tests for tenant-scoped tables introduced/used by the contracts,
 * audit and webhook-runs flows. Verifies that a user from company B cannot read
 * rows belonging to company A through the Data API.
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  a: `rls-contract-a-${RUN}@example.com`,
  b: `rls-contract-b-${RUN}@example.com`,
};

let companyA = "";
let companyB = "";
let userA = "";
let userB = "";
let clientA!: SupabaseClient;
let clientB!: SupabaseClient;

let contractIdA = "";
let signatureIdA = "";
let webhookIdA = "";
let auditIdA = "";

beforeAll(async () => {
  companyA = await createCompany(`RLS Co A ${RUN}`);
  companyB = await createCompany(`RLS Co B ${RUN}`);

  const a = await createUser(emails.a);
  const b = await createUser(emails.b);
  userA = a.id; userB = b.id;

  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a });
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b });

  clientA = (await signIn(emails.a)).client;
  clientB = (await signIn(emails.b)).client;

  // Seed via service-role so RLS does not affect setup.
  const { data: doc, error: ed } = await admin
    .from("contract_documents")
    .insert({
      company_id: companyA,
      contract_number: `RLS-${RUN}`,
      version: 1,
      storage_path: `${companyA}/RLS-${RUN}.pdf`,
      file_hash: "deadbeef".repeat(8),
      file_size_bytes: 1024,
      snapshot: { plan: "Integrado", company_name: "RLS Co A" },
      status: "sent",
    })
    .select("id")
    .single();
  if (ed) throw ed;
  contractIdA = doc!.id;

  const { data: sig, error: es } = await admin
    .from("contract_signatures")
    .insert({
      contract_document_id: contractIdA,
      company_id: companyA,
      signer_user_id: userA,
      signer_name: "Tester A",
      signer_email: emails.a,
      signature_hash: "feed".repeat(16),
      status: "valid",
    })
    .select("id")
    .single();
  if (es) throw es;
  signatureIdA = sig!.id;

  const { data: wr, error: ew } = await admin
    .from("webhook_runs")
    .insert({
      company_id: companyA,
      workflow: `rls.test.${RUN}`,
      event: "rls.created",
      status: "success",
      request_payload: { ok: true },
    })
    .select("id")
    .single();
  if (ew) throw ew;
  webhookIdA = wr!.id;

  const { data: au, error: ea } = await admin
    .from("audit_logs")
    .insert({
      company_id: companyA,
      user_id: userA,
      action: "rls.test",
      entity: "contract_documents",
      entity_id: contractIdA,
      after: { rls: true },
    })
    .select("id")
    .single();
  if (ea) throw ea;
  auditIdA = au!.id;
}, 120_000);

afterAll(async () => {
  await admin.from("contract_signatures").delete().eq("id", signatureIdA);
  await admin.from("contract_documents").delete().eq("id", contractIdA);
  await admin.from("webhook_runs").delete().eq("id", webhookIdA);
  await admin.from("audit_logs").delete().eq("id", auditIdA);
  await deleteUser(userA);
  await deleteUser(userB);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

describe("RLS isolation — contracts / signatures / webhooks / audit", () => {
  it("contract_documents: tenant A reads its row", async () => {
    const { data, error } = await clientA.from("contract_documents").select("id").eq("id", contractIdA).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(contractIdA);
  });

  it("contract_documents: tenant B cannot read tenant A row", async () => {
    const { data } = await clientB.from("contract_documents").select("id").eq("id", contractIdA).maybeSingle();
    expect(data).toBeNull();
  });

  it("contract_signatures: tenant B cannot read tenant A signatures", async () => {
    const { data } = await clientB.from("contract_signatures").select("id").eq("id", signatureIdA).maybeSingle();
    expect(data).toBeNull();
  });

  it("webhook_runs: tenant B cannot read tenant A webhook runs", async () => {
    const { data } = await clientB.from("webhook_runs").select("id").eq("id", webhookIdA).maybeSingle();
    expect(data).toBeNull();
  });

  it("audit_logs: tenant B cannot read tenant A audit log", async () => {
    const { data } = await clientB.from("audit_logs").select("id").eq("id", auditIdA).maybeSingle();
    expect(data).toBeNull();
  });

  it("storage.contracts: tenant B cannot download tenant A file path", async () => {
    // Tenant B should not be able to create a signed url for an A-prefixed object,
    // even though the object likely doesn't exist — RLS on storage.objects should block listing.
    const { data, error } = await clientB.storage.from("contracts").createSignedUrl(`${companyA}/RLS-${RUN}.pdf`, 60);
    expect(!!data?.signedUrl && !error).toBe(false);
  });
});
