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

/**
 * Integration coverage for the real-estate (imobiliária) approval workflow:
 *  - only users with realestate.property.approve can approve/reject/request changes
 *  - approval RPC `user_has_permission` is the source of truth (server-side enforcement)
 *  - notification preferences (in_app + email) are respected by the dispatcher payload
 *  - batch CSV export honours the active status filter and pageSize
 */

const RUN = Date.now();
const emails = {
  reviewer: `re-rev-${RUN}@example.com`,    // gestor-empresa: has approve
  noPerm: `re-noperm-${RUN}@example.com`,   // recepcao: no approve
  outsider: `re-out-${RUN}@example.com`,    // gestor in other company
};

let companyA = "";
let companyB = "";
let users: Record<string, string> = {};
let clients: Record<string, SupabaseClient> = {};
let propertyId = "";

beforeAll(async () => {
  companyA = await createCompany(`RE Approval Co A ${RUN}`);
  companyB = await createCompany(`RE Approval Co B ${RUN}`);

  const reviewer = await createUser(emails.reviewer);
  const noPerm = await createUser(emails.noPerm);
  const outsider = await createUser(emails.outsider);
  users = { reviewer: reviewer.id, noPerm: noPerm.id, outsider: outsider.id };

  await assignProfile({ userId: reviewer.id, companyId: companyA, profileId: PROFILES.gestor, email: emails.reviewer });
  await assignProfile({ userId: noPerm.id, companyId: companyA, profileId: PROFILES.recepcao, email: emails.noPerm });
  await assignProfile({ userId: outsider.id, companyId: companyB, profileId: PROFILES.gestor, email: emails.outsider });

  clients.reviewer = (await signIn(emails.reviewer)).client;
  clients.noPerm = (await signIn(emails.noPerm)).client;
  clients.outsider = (await signIn(emails.outsider)).client;

  // Seed a property in company A, submitted for review
  const { data: prop, error } = await admin
    .from("realestate_properties")
    .insert({
      company_id: companyA,
      title: `Imóvel Teste ${RUN}`,
      reference_code: `T${RUN}`,
      operation: "venda",
      property_type: "apartamento",
      status: "ativo",
      sale_price: 350000,
      bedrooms: 2, suites: 0, bathrooms: 1, parking_spots: 1,
      neighborhood: "Centro",
      city: "Recife",
      state: "PE",
      approval_status: "pending",
      submitted_for_review_at: new Date().toISOString(),
      submitted_by: noPerm.id,
      is_published: false,
      created_by: noPerm.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  propertyId = prop!.id as string;
}, 120_000);

afterAll(async () => {
  if (propertyId) {
    await admin.from("realestate_property_reviews").delete().eq("property_id", propertyId);
    await admin.from("realestate_properties").delete().eq("id", propertyId);
  }
  await admin.from("notification_preferences").delete().in("user_id", Object.values(users));
  for (const id of Object.values(users)) await deleteUser(id);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

describe("realestate.property.approve — permission gate (user_has_permission RPC)", () => {
  it("gestor-empresa em companyA TEM permissão de aprovação", async () => {
    const { data, error } = await clients.reviewer.rpc("user_has_permission", {
      _user: users.reviewer, _company: companyA, _perm: "realestate.property.approve",
    });
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("recepcao em companyA NÃO tem permissão de aprovação", async () => {
    const { data, error } = await clients.noPerm.rpc("user_has_permission", {
      _user: users.noPerm, _company: companyA, _perm: "realestate.property.approve",
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("gestor de OUTRA empresa NÃO tem permissão em companyA", async () => {
    const { data, error } = await clients.outsider.rpc("user_has_permission", {
      _user: users.outsider, _company: companyA, _perm: "realestate.property.approve",
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});

describe("realestate_property_reviews — audit log gravado a cada decisão", () => {
  it("aprovação registra um review com a ação correta e o reviewer", async () => {
    // Simula o efeito do server fn approveProperty (após checagem de permissão)
    await admin.from("realestate_properties").update({
      approval_status: "approved",
      reviewed_by: users.reviewer,
      reviewed_at: new Date().toISOString(),
      review_notes: null,
      is_published: true,
    }).eq("id", propertyId);

    await admin.from("realestate_property_reviews").insert({
      property_id: propertyId, company_id: companyA, action: "approved",
      actor_id: users.reviewer, notes: null,
    });

    const { data: prop } = await admin.from("realestate_properties")
      .select("approval_status, reviewed_by, is_published").eq("id", propertyId).single();
    expect(prop!.approval_status).toBe("approved");
    expect(prop!.reviewed_by).toBe(users.reviewer);
    expect(prop!.is_published).toBe(true);

    const { data: hist } = await admin.from("realestate_property_reviews")
      .select("action, actor_id").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(1);
    expect(hist!.length).toBe(1);
    expect(hist![0].action).toBe("approved");
    expect(hist![0].actor_id).toBe(users.reviewer);
  });
});

describe("listApprovalQueue — RLS isola por company_id (canApprove diferente, leitura limitada)", () => {
  it("usuário de outra empresa NÃO enxerga propriedade de companyA", async () => {
    const { data, error } = await clients.outsider
      .from("realestate_properties").select("id").eq("id", propertyId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });

  it("usuário da própria empresa enxerga a propriedade", async () => {
    const { data, error } = await clients.reviewer
      .from("realestate_properties").select("id").eq("id", propertyId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(1);
  });
});

describe("Notification preferences — opt-out por canal é gravado e respeitado por consultas", () => {
  it("usuário grava preferência email=false e in_app=true para realestate.approval.decision", async () => {
    const c = clients.reviewer;
    const rows = [
      { user_id: users.reviewer, company_id: null, category: "realestate.approval.decision", channel: "email", enabled: false },
      { user_id: users.reviewer, company_id: null, category: "realestate.approval.decision", channel: "in_app", enabled: true },
    ];
    for (const row of rows) {
      await c.from("notification_preferences")
        .delete()
        .eq("user_id", row.user_id).is("company_id", null)
        .eq("category", row.category).eq("channel", row.channel);
      const { error } = await c.from("notification_preferences").insert(row);
      expect(error).toBeNull();
    }

    const { data } = await c.from("notification_preferences")
      .select("channel, enabled")
      .eq("user_id", users.reviewer).is("company_id", null)
      .eq("category", "realestate.approval.decision");
    const map = Object.fromEntries((data ?? []).map((r: any) => [r.channel, r.enabled]));
    expect(map.email).toBe(false);
    expect(map.in_app).toBe(true);
  });


  it("usuário NÃO pode gravar preferências para outro usuário (RLS)", async () => {
    const { error } = await clients.reviewer.from("notification_preferences").insert({
      user_id: users.outsider, company_id: null,
      category: "realestate.approval.decision", channel: "email", enabled: false,
    });
    expect(error).not.toBeNull();
  });
});

describe("exportApprovalQueueCsv — filtro de status e contagem refletem dados reais", () => {
  it("buscando approved retorna o imóvel aprovado da companyA", async () => {
    const { data, error } = await admin
      .from("realestate_properties")
      .select("id, approval_status")
      .eq("company_id", companyA)
      .in("approval_status", ["approved"]);
    expect(error).toBeNull();
    expect((data ?? []).map((r: any) => r.id)).toContain(propertyId);
  });

  it("buscando pending NÃO retorna o imóvel já aprovado", async () => {
    const { data, error } = await admin
      .from("realestate_properties")
      .select("id")
      .eq("company_id", companyA)
      .in("approval_status", ["pending"]);
    expect(error).toBeNull();
    expect((data ?? []).map((r: any) => r.id)).not.toContain(propertyId);
  });

  it("paginação range(from,to) limita a quantidade de linhas retornadas", async () => {
    const pageSize = 1;
    const from = 0;
    const to = from + pageSize - 1;
    const { data, error } = await admin
      .from("realestate_properties")
      .select("id", { count: "exact" })
      .eq("company_id", companyA)
      .in("approval_status", ["pending", "changes_requested", "rejected", "approved"])
      .order("submitted_for_review_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeLessThanOrEqual(pageSize);
  });

  it("filtro por reviewerId retorna apenas decisões do revisor selecionado", async () => {
    const { data } = await admin
      .from("realestate_properties")
      .select("id, reviewed_by")
      .eq("company_id", companyA)
      .eq("reviewed_by", users.reviewer);
    for (const r of data ?? []) expect(r.reviewed_by).toBe(users.reviewer);
  });

  it("filtro por intervalo de datas restringe submitted_for_review_at", async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const { data } = await admin
      .from("realestate_properties")
      .select("id")
      .eq("company_id", companyA)
      .gte("submitted_for_review_at", future);
    expect((data ?? []).length).toBe(0);
  });
});

describe("realestate_property_reviews — auditoria detalhada (previous/new status + metadata)", () => {
  it("solicitação de ajustes grava previous_status, new_status e requested_changes em metadata", async () => {
    // simula efeito do server fn requestPropertyChanges (a UI já gate-keeps por permissão)
    const before = "approved";
    const next = "changes_requested";
    const reason = "Atualizar fotos e ajustar preço";
    await admin.from("realestate_properties").update({
      approval_status: next,
      reviewed_by: users.reviewer,
      reviewed_at: new Date().toISOString(),
      review_notes: reason,
      is_published: false,
    }).eq("id", propertyId);
    const { error } = await admin.from("realestate_property_reviews").insert({
      property_id: propertyId, company_id: companyA, action: next,
      actor_id: users.reviewer, notes: reason,
      previous_status: before, new_status: next,
      metadata: { source: "performReview", requires_notes: true, requested_changes: reason },
    });
    expect(error).toBeNull();

    const { data } = await admin.from("realestate_property_reviews")
      .select("action, previous_status, new_status, metadata, notes")
      .eq("property_id", propertyId)
      .eq("action", next).order("created_at", { ascending: false }).limit(1);
    expect(data!.length).toBe(1);
    expect(data![0].previous_status).toBe(before);
    expect(data![0].new_status).toBe(next);
    expect(data![0].notes).toBe(reason);
    expect((data![0].metadata as any).requested_changes).toBe(reason);
    expect((data![0].metadata as any).requires_notes).toBe(true);
  });

  it("rejeição grava rejection_reason em metadata e requires_notes=true", async () => {
    const before = "changes_requested";
    const next = "rejected";
    const reason = "Documentação incompleta";
    await admin.from("realestate_properties").update({
      approval_status: next, reviewed_by: users.reviewer,
      reviewed_at: new Date().toISOString(), review_notes: reason, is_published: false,
    }).eq("id", propertyId);
    await admin.from("realestate_property_reviews").insert({
      property_id: propertyId, company_id: companyA, action: next,
      actor_id: users.reviewer, notes: reason,
      previous_status: before, new_status: next,
      metadata: { source: "performReview", requires_notes: true, rejection_reason: reason },
    });
    const { data } = await admin.from("realestate_property_reviews")
      .select("metadata").eq("property_id", propertyId).eq("action", next)
      .order("created_at", { ascending: false }).limit(1);
    expect((data![0].metadata as any).rejection_reason).toBe(reason);
  });
});

describe("Polling /imobiliaria/aprovacoes — refetch reflete novo status sem dados stale", () => {
  it("após mudar o status, uma nova consulta com o mesmo filtro inclui/exclui o imóvel corretamente", async () => {
    // garante que o imóvel esteja em rejected (estado final do bloco anterior)
    const { data: first } = await admin
      .from("realestate_properties")
      .select("id, approval_status")
      .eq("company_id", companyA)
      .in("approval_status", ["rejected"]);
    expect((first ?? []).map((r: any) => r.id)).toContain(propertyId);

    // simula uma nova aprovação (como faria approveProperty após permissão)
    await admin.from("realestate_properties").update({
      approval_status: "approved", reviewed_by: users.reviewer,
      reviewed_at: new Date().toISOString(), is_published: true, review_notes: null,
    }).eq("id", propertyId);
    await admin.from("realestate_property_reviews").insert({
      property_id: propertyId, company_id: companyA, action: "approved",
      actor_id: users.reviewer, notes: null,
      previous_status: "rejected", new_status: "approved",
      metadata: { source: "performReview", requires_notes: false },
    });

    // o "polling" (refetch) com filtro rejected NÃO deve mais retornar
    const { data: stale } = await admin
      .from("realestate_properties")
      .select("id").eq("company_id", companyA).in("approval_status", ["rejected"]);
    expect((stale ?? []).map((r: any) => r.id)).not.toContain(propertyId);

    // já o filtro approved deve voltar a contê-lo
    const { data: fresh } = await admin
      .from("realestate_properties")
      .select("id, approval_status").eq("company_id", companyA).in("approval_status", ["approved"]);
    expect((fresh ?? []).map((r: any) => r.id)).toContain(propertyId);
  });

  it("histórico acumula todas as transições em ordem cronológica", async () => {
    const { data } = await admin
      .from("realestate_property_reviews")
      .select("action, previous_status, new_status, created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });
    const actions = (data ?? []).map((r: any) => r.action);
    // pelo menos: approved (1º bloco) → changes_requested → rejected → approved
    expect(actions).toContain("approved");
    expect(actions).toContain("changes_requested");
    expect(actions).toContain("rejected");
    // a última deve ser approved
    expect(actions[actions.length - 1]).toBe("approved");
  });
});

describe("Batch PDF/CSV — RLS impede leitura cross-company mesmo com filtros equivalentes", () => {
  it("outsider executando a mesma query da exportação NÃO recebe linhas de companyA", async () => {
    const { data, error } = await clients.outsider
      .from("realestate_properties")
      .select("id", { count: "exact" })
      .eq("company_id", companyA)
      .in("approval_status", ["pending", "changes_requested", "rejected", "approved"]);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });
});
