import { z } from "zod";

/**
 * Política de senha do ecossistema Impulsionando.
 * Aplicada em cadastro, reset e alteração de senha.
 *
 * Requisitos (WCAG/OWASP + LGPD):
 * - mínimo 12 caracteres
 * - pelo menos 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
 * - não pode conter sequências óbvias (123456, abcdef, qwerty)
 * - não pode conter o e-mail do usuário
 * - HIBP (leaked password) é validado no servidor via configure_auth
 */

const OBVIOUS_SEQUENCES = [
  "123456",
  "654321",
  "abcdef",
  "qwerty",
  "qwertz",
  "asdfgh",
  "senha",
  "password",
  "impulsionando",
  "admin",
];

export const PASSWORD_MIN_LENGTH = 12;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`,
  })
  .max(128, { message: "A senha deve ter no máximo 128 caracteres." })
  .refine((v) => /[A-Z]/.test(v), {
    message: "Inclua ao menos uma letra maiúscula.",
  })
  .refine((v) => /[a-z]/.test(v), {
    message: "Inclua ao menos uma letra minúscula.",
  })
  .refine((v) => /[0-9]/.test(v), { message: "Inclua ao menos um número." })
  .refine((v) => /[^A-Za-z0-9]/.test(v), {
    message: "Inclua ao menos um caractere especial (ex: !@#$%&*).",
  })
  .refine(
    (v) => !OBVIOUS_SEQUENCES.some((s) => v.toLowerCase().includes(s)),
    { message: "Evite sequências óbvias (123456, qwerty, senha, admin...)." },
  );

export function validatePasswordAgainstEmail(
  password: string,
  email?: string | null,
): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    return "A senha não pode conter partes do seu e-mail.";
  }
  return null;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "muito fraca" | "fraca" | "média" | "forte" | "muito forte";
}

export function scorePasswordStrength(password: string): PasswordStrengthResult {
  let s = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) s++;
  if (password.length >= 16) s++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
  const labels = ["muito fraca", "fraca", "média", "forte", "muito forte"] as const;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  return { score, label: labels[score] };
}
