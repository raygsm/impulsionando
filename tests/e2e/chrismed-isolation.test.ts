/**
 * E2E — Isolamento por company_id no domínio CLÍNICO (CHRISMED).
 * Garante que outro tenant não acesse:
 *  - agenda_appointments
 *  - agenda_professionals
 *  - agenda_services
 *  - customers (pacientes)
 *  - message_outbox / message_templates (e-mails/comunicações)
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from "../helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const emails = {
  chris: `e2e-chrismed-${RUN}@example.com`,
  other: `e2e-other-${RUN}@example.com`,
};

let companyChris = "", companyOther = "";
let userChris = "", userOther = "";
let clientChris!: SupabaseClient;
let clientOther!: SupabaseClient;

const ids = {
  professional: "",
  service: "",
  customer: "",
  appointment: "",
  template: "",
  outbox: "",
};

beforeAll(async () => {
  companyChris = await createCompany(`CHRISMED E2E ${RUN}`);
  companyOther = await createCompany(`Other Tenant E2E ${RUN}`);

  const u1 = await createUser(emails.chris);
  const u2 = await createUser(emails.other);
  userChris = u1.id; userOther = u2.id;

  await assignProfile({ userId: userChris, companyId: companyChris, profileId: PROFILES.gestor, email: emails.chris });
  await assignProfile({ userId: userOther, companyId: companyOther, profileId: PROFILES.gestor, email: emails.other });

  clientChris = (await signIn(emails.chris)).client;
  clientOther = (await signIn(emails.other)).client;

  // Seed CHRISMED
  const prof = await admin.from("agenda_professionals").insert({
    company_id: companyChris, name: `Dr. E2E ${RUN}`, is_active: true,
  } as any).select("id").single();
  ids.professional = prof.data!.id;

  const svc = await admin.from("agenda_services").insert({
    company_id: companyChris, name: `Consulta E2E ${RUN}`, duration_minutes: 30, price: 200, is_active: true,
  } as any).select("id").single();
  ids.service = svc.data!.id;

  const cust = await admin.from("customers").insert({
    company_id: companyChris, name: `Paciente E2E ${RUN}`, email: `pac-${RUN}@example.com`, phone: "+5511999999999",
  } as any).select("id").single();
  ids.customer = cust.data!.id;

  const apt = await admin.from("agenda_appointments").insert({
    company_id: companyChris,
    professional_id: ids.professional,
    service_id: ids.service,
    customer_id: ids.customer,
    customer_name: `Paciente E2E ${RUN}`,
    starts_at: new Date(Date.now() + 86_400_000).toISOString(),
    ends_at:   new Date(Date.now() + 86_400_000 + 1_800_000).toISOString(),
    status: "scheduled",
    price: 200,
  } as any).select("id").single();
  ids.appointment = apt.data!.id;

  const tpl = await admin.from("message_templates").insert({
    company_id: companyChris, name: `tpl-e2e-${RUN}`, channel: "email", body: "ola {{nome}}",
  } as any).select("id").single();
  ids.template = tpl.data!.id;

  const out = await admin.from("message_outbox").insert({
    company_id: companyChris, channel: "email",
    to_address: `pac-${RUN}@example.com`, subject: "E2E", body: "msg e2e",
    status: "queued",
  } as any).select("id").single();
  ids.outbox = out.data?.id ?? "";
});

afterAll(async () => {
  await admin.from("agenda_appointments").delete().eq("id", ids.appointment).catch(() => {});
  await admin.from("customers").delete().eq("id", ids.customer).catch(() => {});
  await admin.from("agenda_services").delete().eq("id", ids.service).catch(() => {});
  await admin.from("agenda_professionals").delete().eq("id", ids.professional).catch(() => {});
  await admin.from("message_templates").delete().eq("id", ids.template).catch(() => {});
  if (ids.outbox) await admin.from("message_outbox").delete().eq("id", ids.outbox).catch(() => {});
  await deleteUser(userChris); await deleteUser(userOther);
  await deleteCompany(companyChris); await deleteCompany(companyOther);
});

describe("CHRISMED — isolamento clínico por company_id", () => {
  it("outro tenant NÃO enxerga pacientes da CHRISMED", async () => {
    const { data } = await clientOther.from("customers").select("id").eq("id", ids.customer);
    expect(data ?? []).toHaveLength(0);
  });
  it("CHRISMED enxerga seus próprios pacientes", async () => {
    const { data, error } = await clientChris.from("customers").select("id").eq("id", ids.customer);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("outro tenant NÃO enxerga profissionais da CHRISMED", async () => {
    const { data } = await clientOther.from("agenda_professionals").select("id").eq("id", ids.professional);
    expect(data ?? []).toHaveLength(0);
  });
  it("outro tenant NÃO enxerga serviços da CHRISMED", async () => {
    const { data } = await clientOther.from("agenda_services").select("id").eq("id", ids.service);
    expect(data ?? []).toHaveLength(0);
  });
  it("outro tenant NÃO enxerga consultas da CHRISMED", async () => {
    const { data } = await clientOther.from("agenda_appointments").select("id").eq("id", ids.appointment);
    expect(data ?? []).toHaveLength(0);
  });
  it("outro tenant NÃO enxerga templates da CHRISMED", async () => {
    const { data } = await clientOther.from("message_templates").select("id").eq("id", ids.template);
    expect(data ?? []).toHaveLength(0);
  });
  it("outro tenant NÃO enxerga outbox (e-mails) da CHRISMED", async () => {
    if (!ids.outbox) return;
    const { data } = await clientOther.from("message_outbox").select("id").eq("id", ids.outbox);
    expect(data ?? []).toHaveLength(0);
  });

  it("listagem geral não vaza linhas da CHRISMED para outro tenant", async () => {
    const tables = ["customers", "agenda_appointments", "agenda_professionals", "agenda_services", "message_templates", "message_outbox"] as const;
    for (const t of tables) {
      const { data } = await clientOther.from(t).select("company_id");
      const leaks = (data ?? []).filter((r: any) => r.company_id === companyChris);
      expect(leaks, `vazamento em ${t}`).toHaveLength(0);
    }
  });
});
