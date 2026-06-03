import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin,
  createUser,
  deleteUser,
  signIn,
  assignProfile,
  createCompany,
  deleteCompany,
  PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  gestor: `anon-gestor-${RUN}@example.com`,
  recepcao: `anon-recepcao-${RUN}@example.com`,
};

let companyId = "";
let customerId = "";
const users: Record<string, string> = {};
const clients: Record<string, SupabaseClient> = {};

beforeAll(async () => {
  companyId = await createCompany(`Anon Test Co ${RUN}`);

  const gestor = await createUser(emails.gestor);
  const recepcao = await createUser(emails.recepcao);
  users.gestor = gestor.id;
  users.recepcao = recepcao.id;

  await assignProfile({ userId: gestor.id, companyId, profileId: PROFILES.gestor, email: emails.gestor });
  await assignProfile({ userId: recepcao.id, companyId, profileId: PROFILES.recepcao, email: emails.recepcao });

  clients.gestor = (await signIn(emails.gestor)).client;
  clients.recepcao = (await signIn(emails.recepcao)).client;

  const { data: cust, error: custErr } = await admin
    .from("customers")
    .insert({
      company_id: companyId,
      name: "Cliente Teste Anonimização",
      email: `cust-${RUN}@example.com`,
      is_active: true,
    })
    .select("id")
    .single();
  if (custErr) throw custErr;
  customerId = cust.id as string;
}, 90_000);

afterAll(async () => {
  await admin.from("customers").delete().eq("company_id", companyId);
  for (const id of Object.values(users)) await deleteUser(id);
  await deleteCompany(companyId);
});

/**
 * The customers UI gates the "Anonimizar (LGPD)" button on
 *   isSuperAdmin || userPerms.has("customer.anonymize")
 * via the useUserPermissions hook, which reads profile_permissions joined
 * with permissions and applies user_permission_overrides. These tests
 * validate the same data source the hook uses, plus the RPC behavior the
 * button triggers — so a missing permission means: button hidden AND
 * a graceful error from the RPC (not an unexpected UI crash).
 */
describe("customer.anonymize permission gating", () => {
  it("recepcao does NOT have customer.anonymize permission (button is hidden)", async () => {
    const { data, error } = await clients.recepcao
      .from("profile_permissions")
      .select("permissions!inner(code)")
      .eq("profile_id", PROFILES.recepcao);
    expect(error).toBeNull();
    const codes = (data ?? []).map((r: any) => r.permissions.code);
    expect(codes).not.toContain("customer.anonymize");
  });

  it("gestor-empresa DOES have customer.anonymize permission (button is visible)", async () => {
    const { data, error } = await clients.gestor
      .from("profile_permissions")
      .select("permissions!inner(code)")
      .eq("profile_id", PROFILES.gestor);
    expect(error).toBeNull();
    const codes = (data ?? []).map((r: any) => r.permissions.code);
    expect(codes).toContain("customer.anonymize");
  });

  it("recepcao calling customer_anonymize returns a clean permission error (no UI crash)", async () => {
    const { data, error } = await clients.recepcao.rpc("customer_anonymize", {
      _customer_id: customerId,
      _reason: "tentativa sem permissão",
    });
    // Must fail cleanly with a structured PostgrestError, not throw / null payload chaos
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(typeof error?.message).toBe("string");
    expect(error!.message.length).toBeGreaterThan(0);
    // Should mention permission / denied / forbidden — the function raises
    // 'Forbidden: missing customer.anonymize permission' (or similar).
    expect(error!.message.toLowerCase()).toMatch(/permission|forbidden|denied|customer\.anonymize/);

    // Customer must remain NOT anonymized
    const { data: row } = await admin
      .from("customers")
      .select("anonymized_at, name")
      .eq("id", customerId)
      .single();
    expect(row?.anonymized_at).toBeNull();
    expect(row?.name).toBe("Cliente Teste Anonimização");
  });

  it("gestor with permission successfully anonymizes the customer", async () => {
    const { error } = await clients.gestor.rpc("customer_anonymize", {
      _customer_id: customerId,
      _reason: "solicitação LGPD do titular",
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from("customers")
      .select("anonymized_at, anonymized_by, anonymization_reason, name, email, is_active")
      .eq("id", customerId)
      .single();
    expect(row?.anonymized_at).not.toBeNull();
    expect(row?.anonymized_by).toBe(users.gestor);
    expect(row?.anonymization_reason).toBe("solicitação LGPD do titular");
    expect(row?.is_active).toBe(false);
    expect(row?.name).not.toBe("Cliente Teste Anonimização");
  });
});
