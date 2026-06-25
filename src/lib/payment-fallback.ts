export const CORE_SUPPORT_WHATSAPP_ENV = "VITE_IMPULSIONANDO_SUPPORT_WHATSAPP";

export function normalizeWhatsAppPhone(value?: string | null): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return null;
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}

export function configuredCoreWhatsapp(): string | null {
  return normalizeWhatsAppPhone(import.meta.env.VITE_IMPULSIONANDO_SUPPORT_WHATSAPP);
}

export function buildWhatsappUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
