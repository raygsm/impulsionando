import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, anonClient, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  staff: `rls-hard-staff-${RUN}@example.com`,
  noPerm: `rls-hard-noperm-${RUN}@example.com`,
};

let companyA = "";
let users: Record<string, string> = {};
let clients: Record<string, SupabaseClient> = {};

beforeAll(async () => {
  companyA = await createCompany(`Hardening Co A ${RUN}`);

  const staff = await createUser(emails.staff);
  const noPerm = await createUser(emails.noPerm);
  users = { staff: staff.id, noPerm: noPerm.id };

  await assignProfile({ userId: staff.id, companyId: companyA, profileId: PROFILES.gestor, email: emails.staff });
  await assignProfile({ userId: noPerm.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.noPerm });

  clients.staff = (await signIn(emails.staff)).client;
  clients.noPerm = (await signIn(emails.noPerm)).client;

  const prop = await admin.from("realestate_properties").insert({
    company_id: companyA, title: `Imovel ${RUN}`,
  }).select("id").single();
  propertyId = prop.data!.id as string;
}, 120_000);

let propertyId = "";

afterAll(async () => {
  await admin.from("realestate_interests").delete().eq("company_id", companyA);
  await admin.from("realestate_properties").delete().eq("company_id", companyA);
  await admin.from("comm_communities").delete().eq("company_id", companyA);
  await admin.from("contab_fiscal_calendar").delete().eq("company_id", companyA);
  await deleteCompany(companyA);
  await Promise.all(Object.values(users).map(deleteUser));
}, 120_000);

describe("permission-gated reads", () => {
  it("contab_fiscal_calendar: user without contab.calendar.read sees nothing", async () => {
    await admin.from("contab_fiscal_calendar").insert({
      company_id: companyA,
      title: `Cal ${RUN}`,
      due_date: new Date().toISOString().slice(0, 10),
    });
    const noPerm = await clients.noPerm.from("contab_fiscal_calendar").select("id").eq("company_id", companyA);
    expect(noPerm.data ?? []).toHaveLength(0);
  });
});

describe("permission-gated writes", () => {
  it("comm_communities: user without comm.community.write cannot insert", async () => {
    const denied = await clients.noPerm.from("comm_communities").insert({
      company_id: companyA,
      name: "Comunidade negada",
      slug: `denied-${RUN}`,
      kind: "membership",
      monthly_fee: 0,
      accepts_donations: false,
      is_active: true,
    });
    expect(denied.error).toBeTruthy();
    // RLS rejects with 42501 (insufficient privilege) before any NOT NULL check.
    expect(["42501", "PGRST301"]).toContain(denied.error?.code);
  });
});

describe("companies vitrine column protection", () => {
  it("anon cannot read sensitive columns from companies", async () => {
    await admin.from("companies").update({
      vitrine_enabled: true,
      public_slug: `vit-${RUN}`,
      email: "leak@example.com",
    }).eq("id", companyA);

    const c = anonClient();
    const safe = await c.from("companies").select("id,name,public_slug").eq("id", companyA).maybeSingle();
    expect(safe.error).toBeNull();
    expect(safe.data?.id).toBe(companyA);

    const leak = await c.from("companies").select("email").eq("id", companyA).maybeSingle();
    expect(leak.error).toBeTruthy();
  });
});

describe("realestate_interests rate limiting trigger", () => {
  it("rejects more than 10 inserts per minute from the same actor", async () => {
    let lastError: { message?: string; code?: string } | null = null;
    let inserted = 0;
    for (let i = 0; i < 12; i++) {
      const r = await clients.staff.from("realestate_interests").insert({
        company_id: companyA,
        property_id: propertyId,
        contact_name: `Lead ${i}`,
        contact_email: `lead${i}@example.com`,
      });
      if (r.error) { lastError = r.error as never; break; }
      inserted++;
    }
    expect(inserted).toBeLessThanOrEqual(10);
    expect(lastError).toBeTruthy();
    expect(String(lastError?.message ?? "")).toMatch(/rate_limit_exceeded/);
  }, 30_000);
});
