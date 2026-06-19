import { z } from "zod";

export const MarketingLeadSchema = z.object({
  name: z.string().trim().min(1).max(200).optional().nullable(),
  email: z.string().trim().toLowerCase().email().max(200).optional().nullable(),
  phone: z.string().trim().min(8).max(50)
    .regex(/^[\d\s()+\-.]+$/, "telefone inválido")
    .optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().max(5000).optional().nullable(),
  interest: z.string().trim().max(200).optional().nullable(),
  page_url: z.string().trim().max(500).optional().nullable(),
});

export type MarketingLeadInput = z.infer<typeof MarketingLeadSchema>;

export function validateMarketingLead(input: unknown): MarketingLeadInput {
  const parsed = MarketingLeadSchema.parse(input);
  const hasContact = [parsed.name, parsed.email, parsed.phone].some(
    (v) => typeof v === "string" && v.trim() !== "",
  );
  if (!hasContact) {
    throw new Error("Informe ao menos nome, email ou telefone.");
  }
  return parsed;
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 11 || digits.length === 10
    ? `+55${digits}`
    : digits.startsWith("55")
      ? `+${digits}`
      : `+${digits}`;
}
