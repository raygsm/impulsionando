import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Integration test: contrato ponta-a-ponta de /core/automacao/aprovacoes.
 *
 * Cobre exatamente o que a UI faz:
 *   - Clique em "Baixar JSON"     → INSERT com action=download, mode, tenant, régua, files[]
 *   - Clique em "Baixar pacote"   → INSERT com action=download_zip
 *   - Clique em "Ativar produção" → INSERT com action=activate (fica pending)
 *   - Página Aprovações lista tudo e computa contagens por status
 *
 * Valida também que o campo `mode` gravado é idêntico ao enviado
 * (demo/produção), suportando o badge visual da UI.
 */

const RUN = Date.now();
const email = `automation-approvals-${RUN}@example.com`;
const TENANT = `tenant-approvals-${RUN}`;

let userId = "";
let companyId = "";
let client: SupabaseClient;

beforeAll(async () => {
  companyId = await createCompany(`Approvals Test Co ${RUN}`);
  const u = await createUser(email);
  userId = u.id;
  await assignProfile({ userId, companyId, profileId: PROFILES.gestor, email });
  client = (await signIn(email)).client;
});

afterAll(async () => {
  try { await admin.from("automation_approvals").delete().eq("user_id", userId); } catch {}
  await deleteUser(userId);
  await deleteCompany(companyId);
});

async function insertApproval(row: {
  action: "download" | "download_zip" | "activate" | "test";
  mode: "demo" | "producao";
  regua: string;
  files: string[];
  note?: string;
}) {
  const { data, error } = await client
    .from("automation_approvals")
    .insert({
      user_id: userId,
      tenant_slug: TENANT,
      mode: row.mode,
      regua: row.regua,
      action: row.action,
      files: row.files,
      note: row.note ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

describe("automation_approvals — contrato E2E", () => {
  it("registra download de JSON com tenant/mode/regua/arquivo corretos", async () => {
    const file = "/downloads/n8n/captacao/01-lead-captado.json";
    const row = await insertApproval({
      action: "download",
      mode: "demo",
      regua: "captacao",
      files: [file],
      note: "Fluxo: lead-captado",
    });
    expect(row.tenant_slug).toBe(TENANT);
    expect(row.mode).toBe("demo");
    expect(row.regua).toBe("captacao");
    expect(row.action).toBe("download");
    expect((row.files as string[])[0]).toBe(file);
    expect(row.status).toBe("pending");
  });

  it("registra download do pacote .zip", async () => {
    const zip = "/downloads/impulsionando-n8n-workflows.zip";
    const row = await insertApproval({
      action: "download_zip",
      mode: "demo",
      regua: "captacao",
      files: [zip],
      note: "Pacote completo",
    });
    expect(row.action).toBe("download_zip");
    expect((row.files as string[])[0]).toBe(zip);
  });

  it("registra pedido de ativação em produção preservando mode=producao", async () => {
    const row = await insertApproval({
      action: "activate",
      mode: "producao",
      regua: "conversao",
      files: ["/downloads/n8n/conversao/16-pagamento-aprovado.json"],
    });
    expect(row.mode).toBe("producao");
    expect(row.action).toBe("activate");
    expect(row.status).toBe("pending");
  });

  it("lista filtra por tenant e contagens por status batem com as linhas", async () => {
    const { data: rows, error } = await client
      .from("automation_approvals")
      .select("mode, status, action, tenant_slug")
      .eq("tenant_slug", TENANT);
    if (error) throw error;

    expect(rows.length).toBeGreaterThanOrEqual(3);
    // Todas as linhas devem pertencer ao tenant filtrado
    for (const r of rows) expect(r.tenant_slug).toBe(TENANT);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      if (r.status === "pending") counts.pending++;
      else if (r.status === "approved") counts.approved++;
      else if (r.status === "rejected") counts.rejected++;
    }
    // Mesma lógica usada em AprovacoesPage
    expect(counts.pending + counts.approved + counts.rejected).toBeLessThanOrEqual(rows.length);
    expect(counts.pending).toBeGreaterThanOrEqual(3);

    // O modo gravado é o mesmo enviado — sustenta o badge Demo/Produção da UI
    const modes = new Set(rows.map((r) => r.mode));
    expect(modes.has("demo")).toBe(true);
    expect(modes.has("producao")).toBe(true);
  });

  it("RLS: outro usuário não enxerga as solicitações deste tenant", async () => {
    const otherEmail = `automation-approvals-other-${RUN}@example.com`;
    const other = await createUser(otherEmail);
    await assignProfile({ userId: other.id, companyId, profileId: PROFILES.recepcao, email: otherEmail });
    const otherClient = (await signIn(otherEmail)).client;
    try {
      const { data, error } = await otherClient
        .from("automation_approvals")
        .select("id")
        .eq("tenant_slug", TENANT);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    } finally {
      await admin.from("automation_approvals").delete().eq("user_id", other.id);
      await deleteUser(other.id);
    }
  });
});
