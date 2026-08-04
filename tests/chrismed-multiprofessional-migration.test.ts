import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260804143000_chrismed_multiprofessional_onboarding.sql"),
  "utf8",
);
const approvalServer = readFileSync(
  resolve("src/lib/chrismed-specialty-request.server.ts"),
  "utf8",
);

describe("segurança do onboarding multiprofissional", () => {
  it("habilita RLS nos catálogos e restringe administração", () => {
    expect(migration).toContain("ALTER TABLE public.health_professions ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ALTER TABLE public.health_specialties ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.is_impulsionando_staff(auth.uid())");
  });

  it("limita perfil e agenda ao usuário autenticado", () => {
    expect(migration).toContain("user_id = auth.uid()");
    expect(migration).toContain("p.user_id = auth.uid()");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.ensure_chrismed_professional_profile(jsonb) FROM PUBLIC, anon",
    );
  });

  it("concede apenas papel profissional no auto cadastro CHRISMED", () => {
    expect(migration).toContain("VALUES (v_user_id, 'profissional'");
    expect(migration).not.toMatch(/VALUES \(v_user_id, '(admin|gestor|white_label)'/);
  });

  it("envia solicitação para o SAC com decisão segura e resposta automática", () => {
    expect(approvalServer).toContain('const REVIEW_EMAIL = "sac@chrismed.com.br"');
    expect(approvalServer).toContain('subject: "Nova especialidade solicitada"');
    expect(approvalServer).toContain("APROVAR");
    expect(approvalServer).toContain("NÃO APROVAR");
    expect(approvalServer).toContain("tokenHash(token)");
    expect(approvalServer).toContain("INCLUIR NOVO SERVIÇO");
    expect(approvalServer).toContain("decision_token_expires_at");
  });
});
