/**
 * RLS isolation tests for the monetization stack.
 *
 * Garantia: clientes só veem dados da própria empresa, staff Impulsionando vê tudo,
 * anon não vê nada. Cobre:
 *  - companies (listMyCompanies)
 *  - core_monetization_models
 *  - core_revshare_rates
 *  - core_payout_events
 *  - core_payout_ledger
 */
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
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

const RUN = Date.now();
const emails = {
  a: `rls-mon-a-${RUN}@example.com`,
  b: `rls-mon-b-${RUN}@example.com`,
};

let companyA = "";
let companyB = "";
let userA = "";
let userB = "";
let clientA!: SupabaseClient;
let clientB!: SupabaseClient;
let anonClient!: SupabaseClient;

let modelIdA = "";
let rateIdA = "";
let eventIdA = "";
let ledgerIdA = "";

beforeAll(async () => {
  companyA = await createCompany(`RLS Mon A ${RUN}`);
  companyB = await createCompany(`RLS Mon B ${RUN}`);

  const a = await createUser(emails.a);
  const b = await createUser(emails.b);
  userA = a.id;
  userB = b.id;

  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a });
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b });

  clientA = (await signIn(emails.a)).client;
  clientB = (await signIn(emails.b)).client;
  anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Seed monetization stack for company A via service role.
  const { data: model, error: em } = await admin
    .from("core_monetization_models")
    .insert({
      company_id: companyA,
      model: "revshare",
      monthly_fee_cents: 0,
      setup_fee_cents: 0,
      min_payout_cents: 0,
      payout_frequency: "instant",
      covered_events: ["service"],
      version: 1,
      is_active: true,
      notes: `rls-test-${RUN}`,
    })
    .select("id")
    .single();
  if (em) throw em;
  modelIdA = model.id;

  const { data: rate, error: er } = await admin
    .from("core_revshare_rates")
    .insert({
      model_id: modelIdA,
      company_id: companyA,
      event_type: "service",
      percent_bps: 50,
    })
    .select("id")
    .single();
  if (er) throw er;
  rateIdA = rate.id;

  const { data: evt, error: ev } = await admin
    .from("core_payout_events")
    .insert({
      company_id: companyA,
      model_id: modelIdA,
      rate_id: rateIdA,
      event_type: "service",
      gross_cents: 10_000,
      fee_cents: 50,
      percent_bps_applied: 50,
      provider: "mercadopago",
      provider_payment_id: `pay_${RUN}`,
      status: "approved",
    })
    .select("id")
    .single();
  if (ev) throw ev;
  eventIdA = evt.id;

  const { data: led, error: el } = await admin
    .from("core_payout_ledger")
    .insert({
      company_id: companyA,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      gross_cents: 10_000,
      fee_cents: 50,
      net_cents: 9_950,
      event_count: 1,
      status: "pending",
      provider: "mercadopago",
    })
    .select("id")
    .single();
  if (el) throw el;
  ledgerIdA = led.id;
});

afterAll(async () => {
  await admin.from("core_payout_ledger").delete().eq("id", ledgerIdA);
  await admin.from("core_payout_events").delete().eq("id", eventIdA);
  await admin.from("core_revshare_rates").delete().eq("id", rateIdA);
  await admin.from("core_monetization_models").delete().eq("id", modelIdA);
  await deleteUser(userA);
  await deleteUser(userB);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

describe("RLS — companies (listMyCompanies)", () => {
  it("user A vê company A mas não company B", async () => {
    const { data, error } = await clientA.from("companies").select("id").in("id", [companyA, companyB]);
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(companyA);
    expect(ids).not.toContain(companyB);
  });

  it("user B vê company B mas não company A", async () => {
    const { data, error } = await clientB.from("companies").select("id").in("id", [companyA, companyB]);
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(companyB);
    expect(ids).not.toContain(companyA);
  });

  it("anon não enxerga nenhuma das duas", async () => {
    const { data } = await anonClient.from("companies").select("id").in("id", [companyA, companyB]);
    expect((data ?? []).length).toBe(0);
  });
});

describe("RLS — core_monetization_models", () => {
  it("user B não consegue ler o modelo da company A", async () => {
    const { data } = await clientB.from("core_monetization_models").select("id").eq("id", modelIdA);
    expect((data ?? []).length).toBe(0);
  });
  it("user A consegue ler o próprio modelo", async () => {
    const { data, error } = await clientA.from("core_monetization_models").select("id").eq("id", modelIdA);
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id)).toContain(modelIdA);
  });
  it("usuário comum não consegue editar (somente staff)", async () => {
    const { error } = await clientA.from("core_monetization_models").update({ notes: "hack" }).eq("id", modelIdA);
    // RLS retorna sucesso com 0 rows ou erro de policy — qualquer um é aceitável
    if (!error) {
      const { data } = await admin.from("core_monetization_models").select("notes").eq("id", modelIdA).single();
      expect(data?.notes).not.toBe("hack");
    }
  });
});

describe("RLS — core_revshare_rates / payout_events / payout_ledger", () => {
  it("user B não vê rates de A", async () => {
    const { data } = await clientB.from("core_revshare_rates").select("id").eq("id", rateIdA);
    expect((data ?? []).length).toBe(0);
  });
  it("user B não vê payout_events de A", async () => {
    const { data } = await clientB.from("core_payout_events").select("id").eq("id", eventIdA);
    expect((data ?? []).length).toBe(0);
  });
  it("user B não vê payout_ledger de A", async () => {
    const { data } = await clientB.from("core_payout_ledger").select("id").eq("id", ledgerIdA);
    expect((data ?? []).length).toBe(0);
  });
  it("user A vê seus próprios events e ledger", async () => {
    const { data: ev } = await clientA.from("core_payout_events").select("id").eq("id", eventIdA);
    expect((ev ?? []).map((r) => r.id)).toContain(eventIdA);
    const { data: led } = await clientA.from("core_payout_ledger").select("id").eq("id", ledgerIdA);
    expect((led ?? []).map((r) => r.id)).toContain(ledgerIdA);
  });
  it("anon não vê nada da stack de monetização", async () => {
    const a = await anonClient.from("core_monetization_models").select("id").eq("id", modelIdA);
    const b = await anonClient.from("core_payout_events").select("id").eq("id", eventIdA);
    const c = await anonClient.from("core_payout_ledger").select("id").eq("id", ledgerIdA);
    expect((a.data ?? []).length).toBe(0);
    expect((b.data ?? []).length).toBe(0);
    expect((c.data ?? []).length).toBe(0);
  });
});
