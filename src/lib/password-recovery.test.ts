import { describe, expect, it, vi } from "vitest";
import { resolveRecoverySession, validatePasswordConfirmation } from "./password-recovery";

function authMock(overrides: Record<string, unknown> = {}) {
  return {
    exchangeCodeForSession: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    setSession: vi.fn(),
    ...overrides,
  } as any;
}

describe("password recovery flow", () => {
  it("reports absence of a valid recovery session", async () => {
    const result = await resolveRecoverySession(authMock(), { hash: "", search: "", pathname: "/redefinir-senha" } as Location);
    expect(result.status).toBe("missing");
    expect(result.session).toBeNull();
  });

  it("validates different passwords", () => {
    expect(validatePasswordConfirmation("Senha123", "Senha456")).toBe("As senhas informadas não são iguais.");
  });

  it("accepts Supabase hash tokens and creates a recovery session", async () => {
    const session = { access_token: "access", refresh_token: "refresh" };
    const auth = authMock({ setSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) });
    const result = await resolveRecoverySession(auth, {
      hash: "#access_token=access&refresh_token=refresh&type=recovery",
      search: "",
      pathname: "/redefinir-senha",
    } as Location);
    expect(result.status).toBe("ready");
    expect(result.session).toBe(session);
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" });
  });

  it("returns an invalid status when Supabase rejects the recovery code", async () => {
    const auth = authMock({
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: null }, error: new Error("expired") }),
    });
    const result = await resolveRecoverySession(auth, { hash: "", search: "?code=abc", pathname: "/redefinir-senha" } as Location);
    expect(result.status).toBe("invalid");
    expect(result.message).toContain("inválido ou expirado");
  });
});
