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
  MASTER_COMPANY,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  sa: `test-sa-${RUN}@example.com`,
  staff: `test-staff-${RUN}@example.com`,
  noPerm: `test-noperm-${RUN}@example.com`,
  outsider: `test-outsider-${RUN}@example.com`,
  target: `test-target-${RUN}@example.com`,
};

let companyA = "";
let companyB = "";
let users: Record<string, string> = {};
let clients: Record<string, SupabaseClient> = {};

beforeAll(async () => {
  companyA = await createCompany(`Test Co A ${RUN}`);
  companyB = await createCompany(`Test Co B ${RUN}`);

  // Create users
  const sa = await createUser(emails.sa);
  const staff = await createUser(emails.staff);
  const noPerm = await createUser(emails.noPerm);
  const outsider = await createUser(emails.outsider);
  const target = await createUser(emails.target);

  users = { sa: sa.id, staff: staff.id, noPerm: noPerm.id, outsider: outsider.id, target: target.id };

  // Assign profiles
  await assignProfile({ userId: sa.id, companyId: MASTER_COMPANY, profileId: PROFILES.superAdmin, email: emails.sa });
  await assignProfile({ userId: staff.id, companyId: companyA, profileId: PROFILES.gestor, email: emails.staff });
  await assignProfile({ userId: noPerm.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.noPerm });
  await assignProfile({ userId: outsider.id, companyId: companyB, profileId: PROFILES.gestor, email: emails.outsider });
  await assignProfile({ userId: target.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.target });

  // Sign in all
  clients.sa = (await signIn(emails.sa)).client;
  clients.staff = (await signIn(emails.staff)).client;
  clients.noPerm = (await signIn(emails.noPerm)).client;
  clients.outsider = (await signIn(emails.outsider)).client;
}, 90_000);

afterAll(async () => {
  for (const id of Object.values(users)) await deleteUser(id);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

describe("/users — user_profiles RLS", () => {
  describe("Super Admin", () => {
    it("vê user_profiles de qualquer empresa", async () => {
      const { data, error } = await clients.sa.from("user_profiles").select("id").eq("company_id", companyA);
      expect(error).toBeNull();
      expect((data ?? []).length).toBeGreaterThanOrEqual(2);
    });
    it("pode criar user_profile em qualquer empresa", async () => {
      const { error } = await clients.sa.from("user_profiles").insert({
        user_id: users.target, company_id: companyB, profile_id: PROFILES.recepcao,
        email: emails.target, display_name: "x",
      });
      expect(error).toBeNull();
      await admin.from("user_profiles").delete().eq("user_id", users.target).eq("company_id", companyB);
    });
    it("pode atribuir perfil master", async () => {
      const { error } = await clients.sa.from("user_profiles").insert({
        user_id: users.target, company_id: MASTER_COMPANY, profile_id: PROFILES.suporte,
        email: emails.target, display_name: "x",
      });
      expect(error).toBeNull();
      await admin.from("user_profiles").delete().eq("user_id", users.target).eq("company_id", MASTER_COMPANY);
    });
  });

  describe("Staff (gestor com users.write)", () => {
    it("vê apenas user_profiles da própria empresa", async () => {
      const { data: own } = await clients.staff.from("user_profiles").select("id,company_id").eq("company_id", companyA);
      expect((own ?? []).length).toBeGreaterThan(0);
      const { data: other } = await clients.staff.from("user_profiles").select("id").eq("company_id", companyB);
      expect(other ?? []).toHaveLength(0);
    });
    it("pode criar user_profile na própria empresa", async () => {
      // usa perfil diferente do que o target já possui
      const { error } = await clients.staff.from("user_profiles").insert({
        user_id: users.outsider, company_id: companyA, profile_id: PROFILES.recepcao,
        email: emails.outsider, display_name: "y",
      });
      expect(error).toBeNull();
      await admin.from("user_profiles").delete().eq("user_id", users.outsider).eq("company_id", companyA);
    });
    it("é bloqueado ao atribuir perfil master (trigger)", async () => {
      const { error } = await clients.staff.from("user_profiles").insert({
        user_id: users.target, company_id: companyA, profile_id: PROFILES.superAdmin,
        email: emails.target, display_name: "z",
      });
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/master/i);
    });
    it("não pode criar user_profile em outra empresa", async () => {
      const { error } = await clients.staff.from("user_profiles").insert({
        user_id: users.target, company_id: companyB, profile_id: PROFILES.recepcao,
        email: emails.target, display_name: "n",
      });
      expect(error).not.toBeNull();
    });
  });

  describe("Usuário sem permissão (recepção)", () => {
    it("vê só os profiles da própria empresa", async () => {
      const { data } = await clients.noPerm.from("user_profiles").select("id").eq("company_id", companyB);
      expect(data ?? []).toHaveLength(0);
    });
    it("não pode criar user_profile", async () => {
      const { error } = await clients.noPerm.from("user_profiles").insert({
        user_id: users.target, company_id: companyA, profile_id: PROFILES.recepcao,
        email: emails.target, display_name: "x",
      });
      expect(error).not.toBeNull();
    });
    it("não pode atualizar user_profile de outro", async () => {
      const { data: row } = await admin.from("user_profiles").select("id").eq("user_id", users.staff).single();
      const { error, data } = await clients.noPerm.from("user_profiles")
        .update({ display_name: "hacked" }).eq("id", row!.id).select();
      // either explicit RLS error or empty result
      expect(error !== null || (data ?? []).length === 0).toBe(true);
    });
  });
});

describe("/access-profiles — profile_permissions & overrides RLS", () => {
  let permId = "";
  beforeAll(async () => {
    const { data } = await admin.from("permissions").select("id").eq("code", "users.read").single();
    permId = data!.id;
  });

  describe("profile_permissions (matriz de perfis)", () => {
    it("Super Admin pode inserir/remover", async () => {
      const target = PROFILES.recepcao;
      // delete via admin first to avoid conflict
      await admin.from("profile_permissions").delete().eq("profile_id", target).eq("permission_id", permId);
      const ins = await clients.sa.from("profile_permissions").insert({ profile_id: target, permission_id: permId });
      expect(ins.error).toBeNull();
      const del = await clients.sa.from("profile_permissions").delete().eq("profile_id", target).eq("permission_id", permId);
      expect(del.error).toBeNull();
      // restore
      await admin.from("profile_permissions").insert({ profile_id: target, permission_id: permId });
    });

    it("Staff (não-super-admin) NÃO pode alterar matriz", async () => {
      const r = await clients.staff.from("profile_permissions")
        .delete().eq("profile_id", PROFILES.recepcao).eq("permission_id", permId).select();
      expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
    });

    it("Usuário sem permissão NÃO pode alterar matriz", async () => {
      const r = await clients.noPerm.from("profile_permissions")
        .insert({ profile_id: PROFILES.recepcao, permission_id: permId }).select();
      expect(r.error).not.toBeNull();
    });

    it("Todos autenticados podem LER a matriz", async () => {
      for (const c of [clients.sa, clients.staff, clients.noPerm]) {
        const { error, data } = await c.from("profile_permissions").select("profile_id").limit(1);
        expect(error).toBeNull();
        expect(data).toBeDefined();
      }
    });
  });

  describe("user_permission_overrides", () => {
    it("Super Admin pode criar override", async () => {
      const { error, data } = await clients.sa.from("user_permission_overrides").insert({
        user_id: users.target, company_id: companyA, permission_id: permId, effect: "deny",
      }).select().single();
      expect(error).toBeNull();
      if (data) await admin.from("user_permission_overrides").delete().eq("id", data.id);
    });

    it("Staff com users.write pode criar override na própria empresa", async () => {
      const { error, data } = await clients.staff.from("user_permission_overrides").insert({
        user_id: users.target, company_id: companyA, permission_id: permId, effect: "grant",
      }).select().single();
      expect(error).toBeNull();
      if (data) await admin.from("user_permission_overrides").delete().eq("id", data.id);
    });

    it("Staff NÃO pode criar override em outra empresa", async () => {
      const { error } = await clients.staff.from("user_permission_overrides").insert({
        user_id: users.outsider, company_id: companyB, permission_id: permId, effect: "grant",
      });
      expect(error).not.toBeNull();
    });

    it("Usuário sem permissão NÃO pode criar override", async () => {
      const { error } = await clients.noPerm.from("user_permission_overrides").insert({
        user_id: users.target, company_id: companyA, permission_id: permId, effect: "grant",
      });
      expect(error).not.toBeNull();
    });
  });

  describe("user_has_permission (RPC)", () => {
    it("retorna true para Super Admin em qualquer permissão", async () => {
      const { data } = await admin.rpc("user_has_permission", {
        _user: users.sa, _company: companyA, _perm: "crm.opportunity.delete",
      });
      expect(data).toBe(true);
    });
    it("retorna true para staff com permissão herdada do perfil", async () => {
      const { data } = await admin.rpc("user_has_permission", {
        _user: users.staff, _company: companyA, _perm: "users.write",
      });
      expect(data).toBe(true);
    });
    it("retorna false para recepção em users.write", async () => {
      const { data } = await admin.rpc("user_has_permission", {
        _user: users.noPerm, _company: companyA, _perm: "users.write",
      });
      expect(data).toBe(false);
    });
    it("override deny anula permissão do perfil", async () => {
      const { data: ins } = await admin.from("user_permission_overrides").insert({
        user_id: users.staff, company_id: companyA, permission_id: permId, effect: "deny",
      }).select().single();
      const { data } = await admin.rpc("user_has_permission", {
        _user: users.staff, _company: companyA, _perm: "users.read",
      });
      expect(data).toBe(false);
      await admin.from("user_permission_overrides").delete().eq("id", ins!.id);
    });
    it("override grant concede permissão fora do perfil", async () => {
      const { data: ins } = await admin.from("user_permission_overrides").insert({
        user_id: users.noPerm, company_id: companyA, permission_id: permId, effect: "grant",
      }).select().single();
      // permId is users.read (já tem). Use outra: pegar uma permissão que recepção NÃO tem
      await admin.from("user_permission_overrides").delete().eq("id", ins!.id);
      const { data: p } = await admin.from("permissions").select("id").eq("code", "users.write").single();
      const { data: ins2 } = await admin.from("user_permission_overrides").insert({
        user_id: users.noPerm, company_id: companyA, permission_id: p!.id, effect: "grant",
      }).select().single();
      const { data } = await admin.rpc("user_has_permission", {
        _user: users.noPerm, _company: companyA, _perm: "users.write",
      });
      expect(data).toBe(true);
      await admin.from("user_permission_overrides").delete().eq("id", ins2!.id);
    });
  });
});
