import type { Session, SupabaseClient } from "@supabase/supabase-js";

export const PASSWORD_RECOVERY_REDIRECT_URL = "https://impulsionando.com.br/redefinir-senha";
export const SUPABASE_REDIRECT_ALLOWLIST_PATTERN = "https://impulsionando.com.br/**";

export type RecoverySessionStatus = "ready" | "missing" | "invalid";

export type RecoverySessionResult = {
  status: RecoverySessionStatus;
  session: Session | null;
  message?: string;
};

type MinimalSupabaseAuth = Pick<
  SupabaseClient["auth"],
  "exchangeCodeForSession" | "getSession" | "setSession"
>;

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "A nova senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return "Use pelo menos uma letra e um número na nova senha.";
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (password !== confirmation) return "As senhas informadas não são iguais.";
  return validatePasswordStrength(password);
}

export function hasRecoveryHashTokens(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return Boolean(params.get("access_token") && params.get("refresh_token"));
}

export async function resolveRecoverySession(
  auth: MinimalSupabaseAuth,
  locationLike: Pick<Location, "hash" | "search" | "pathname">,
): Promise<RecoverySessionResult> {
  const searchParams = new URLSearchParams(locationLike.search);
  const code = searchParams.get("code");

  if (code) {
    const { data, error } = await auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      return { status: "invalid", session: null, message: "Link de redefinição inválido ou expirado." };
    }
    return { status: "ready", session: data.session };
  }

  if (hasRecoveryHashTokens(locationLike.hash)) {
    const hashParams = new URLSearchParams(locationLike.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (!accessToken || !refreshToken) {
      return { status: "invalid", session: null, message: "Link de redefinição incompleto." };
    }
    const { data, error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error || !data.session) {
      return { status: "invalid", session: null, message: "Link de redefinição inválido ou expirado." };
    }
    return { status: "ready", session: data.session };
  }

  const { data } = await auth.getSession();
  if (data.session) return { status: "ready", session: data.session };

  return { status: "missing", session: null, message: "Abra o link de recuperação recebido por e-mail para definir uma nova senha." };
}
