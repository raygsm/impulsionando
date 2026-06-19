import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES, MASTER_COMPANY,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  sa: `rls-contab-sa-${RUN}@example.com`,
  staff: `rls-contab-staff-${RUN}@example.com`,
  noPerm: `rls-contab-noperm-${RUN}@example.com`,
  outsider: `rls-contab-outsider-${RUN}@example.com`,
};

let companyA = "";
let companyB = "";
let users: Record<string, string> = {};
let clients: Record<string, SupabaseClient> = {};
let permIds: Record<string, string> = {};

async function getPermId(code: string) {
  const { data } = await admin.from("permissions").select("id").eq("code", code).single();
  return data!.id as string;
}

beforeAll(async () => {
  companyA = await createCompany(`Contab Co A ${RUN}`);
  companyB = await createCompany(`Contab Co B ${RUN}`);

  const sa = await createUser(emails.sa);
  const staff = await createUser(emails.staff);
  const noPerm = await createUser(emails.noPerm);
  const outsider = await createUser(emails.outsider);
  users = { sa: sa.id, staff: staff.id, noPerm: noPerm.id, outsider: outsider.id };

  await assignProfile({ userId: sa.id, companyId: MASTER_COMPANY, profileId: PROFILES.superAdmin, email: emails.sa });
  await assignProfile({ userId: staff.id, companyId: companyA, profileId: PROFILES.gestor, email: emails.staff });
  await assignProfile({ userId: noPerm.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.noPerm });
  await assignProfile({ userId: outsider.id, companyId: companyB, profileId: PROFILES.gestor, email: emails.outsider });

  // Resolve permission ids
  for (const code of [
    "contab.contract.write", "contab.irpf.write",
    "contab.finance.read", "contab.finance.write",
    "contab.onboarding.write", "company.settings.write",
  ]) permIds[code] = await getPermId(code);

  clients.sa = (await signIn(emails.sa)).client;
  clients.staff = (await signIn(emails.staff)).client;
  clients.noPerm = (await signIn(emails.noPerm)).client;
  clients.outsider = (await signIn(emails.outsider)).client;
}, 120_000);

afterAll(async () => {
  await admin.from("user_permission_overrides").delete().in("user_id", Object.values(users));
  await admin.from("core_refund_rules").delete().in("company_id", [companyA, companyB]);
  await admin.from("core_reschedule_rules").delete().in("company_id", [companyA, companyB]);
  await admin.from("contab_contracts").delete().in("company_id", [companyA, companyB]);
  await admin.from("contab_onboarding").delete().in("company_id", [companyA, companyB]);
  await admin.from("contab_office_finance").delete().in("company_id", [companyA, companyB]);
  await admin.from("contab_irpf_journeys").delete().in("company_id", [companyA, companyB]);
  for (const id of Object.values(users)) await deleteUser(id);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

async function grant(userId: string, company: string, permCode: string) {
  return admin.from("user_permission_overrides").insert({
    user_id: userId, company_id: company, permission_id: permIds[permCode], effect: "grant",
  });
}

describe("core_refund_rules — write requires permission", () => {
  it("super admin pode criar", async () => {
    const { error, data } = await clients.sa.from("core_refund_rules")
      .insert({ company_id: companyA } as any)
      .select().single();
    expect(error).toBeNull();
    if (data) await admin.from("core_refund_rules").delete().eq("id", data.id);
  });

  it("membro sem company.settings.write é bloqueado", async () => {
    const r = await clients.noPerm.from("core_refund_rules")
      .insert({ company_id: companyA } as any).select();
    expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
  });

  it("usuário com permissão concedida consegue criar", async () => {
    await grant(users.noPerm, companyA, "company.settings.write");
    const r = await clients.noPerm.from("core_refund_rules")
      .insert({ company_id: companyA } as any).select().single();
    expect(r.error).toBeNull();
    if (r.data) await admin.from("core_refund_rules").delete().eq("id", r.data.id);
    await admin.from("user_permission_overrides").delete()
      .eq("user_id", users.noPerm).eq("permission_id", permIds["company.settings.write"]);
  });

  it("não atravessa empresas (outsider)", async () => {
    const r = await clients.outsider.from("core_refund_rules")
      .insert({ company_id: companyA } as any).select();
    expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
  });

  it("escrita gera registro em audit_logs (trigger)", async () => {
    const { data } = await clients.sa.from("core_refund_rules")
      .insert({ company_id: companyA } as any).select().single();
    const { data: logs } = await admin.from("audit_logs")
      .select("action, entity, metadata").eq("entity", "core_refund_rules").eq("entity_id", data!.id);
    expect((logs ?? []).length).toBeGreaterThan(0);
    expect((logs as any)?.[0]?.metadata?.category).toBe("refund");
    await admin.from("core_refund_rules").delete().eq("id", data!.id);
  });
});

describe("core_reschedule_rules — write requires permission", () => {
  it("membro sem permissão é bloqueado", async () => {
    const r = await clients.noPerm.from("core_reschedule_rules")
      .insert({ company_id: companyA } as any).select();
    expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
  });

  it("super admin grava e dispara auditoria", async () => {
    const { data, error } = await clients.sa.from("core_reschedule_rules")
      .insert({ company_id: companyA } as any).select().single();
    expect(error).toBeNull();
    const { data: logs } = await admin.from("audit_logs")
      .select("metadata").eq("entity", "core_reschedule_rules").eq("entity_id", data!.id);
    expect((logs as any)?.[0]?.metadata?.category).toBe("reschedule");
    await admin.from("core_reschedule_rules").delete().eq("id", data!.id);
  });
});

describe("contab_contracts / contab_onboarding / contab_irpf_journeys — write requires permission", () => {
  it.each([
    ["contab_contracts", { title: "x" } as any, "contab.contract.write"],
    ["contab_onboarding", { step_name: "k", step_order: 1 } as any, "contab.onboarding.write"],
    ["contab_irpf_journeys", { taxpayer_name: "x", taxpayer_cpf: "00000000000", base_year: 2026 } as any, "contab.irpf.write"],
  ])("%s bloqueia sem permissão e permite com grant", async (table, payload, perm) => {
    const denied = await clients.noPerm.from(table as any).insert({ company_id: companyA, ...payload }).select();
    expect(denied.error !== null || (denied.data ?? []).length === 0).toBe(true);

    await grant(users.noPerm, companyA, perm);
    const ok = await clients.noPerm.from(table as any).insert({ company_id: companyA, ...payload }).select().single();
    expect(ok.error).toBeNull();
    if (ok.data) await admin.from(table as any).delete().eq("id", (ok.data as any).id);
    await admin.from("user_permission_overrides").delete()
      .eq("user_id", users.noPerm).eq("permission_id", permIds[perm]);
  });
});

describe("contab_office_finance — leitura restrita", () => {
  let rowId = "";
  beforeAll(async () => {
    const { data, error } = await admin.from("contab_office_finance")
      .insert({ company_id: companyA, kind: "income", status: "open", amount: 100, description: "test" } as any)
      .select("id").single();
    if (error) throw error;
    rowId = data!.id;

  });
  afterAll(async () => { await admin.from("contab_office_finance").delete().eq("id", rowId); });

  it("membro sem permissão NÃO vê (mesmo da empresa)", async () => {
    const { data } = await clients.noPerm.from("contab_office_finance").select("id").eq("id", rowId);
    expect(data ?? []).toHaveLength(0);
  });

  it("admin/super-admin vê", async () => {
    const { data } = await clients.sa.from("contab_office_finance").select("id").eq("id", rowId);
    expect((data ?? []).length).toBe(1);
  });

  it("membro com contab.finance.read passa a ver", async () => {
    await grant(users.noPerm, companyA, "contab.finance.read");
    const { data } = await clients.noPerm.from("contab_office_finance").select("id").eq("id", rowId);
    expect((data ?? []).length).toBe(1);
    await admin.from("user_permission_overrides").delete()
      .eq("user_id", users.noPerm).eq("permission_id", permIds["contab.finance.read"]);
  });

  it("read não habilita write", async () => {
    await grant(users.noPerm, companyA, "contab.finance.read");
    const r = await clients.noPerm.from("contab_office_finance")
      .insert({ company_id: companyA, kind: "cost", status: "open", amount: 10 } as any).select();
    expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
    await admin.from("user_permission_overrides").delete()
      .eq("user_id", users.noPerm).eq("permission_id", permIds["contab.finance.read"]);
  });
});

describe("log_security_event RPC", () => {
  it("usuário autenticado consegue registrar evento", async () => {
    const { data, error } = await clients.noPerm.rpc("log_security_event", {
      _entity: "core_refund_rules", _action: "denied",
      _company: companyA, _entity_id: null,
      _metadata: { reason: "missing_permission", attempt: "insert" },
    });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    await admin.from("audit_logs").delete().eq("id", data as string);
  });
});
