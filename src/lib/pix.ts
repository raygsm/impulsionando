/**
 * Pure Pix BR Code (EMV) builder — generates the "copia e cola" string
 * for static Pix charges. No network calls.
 *
 * Notes:
 *  - Used both by the legacy "Pix fallback" dialog (fixed receiver/CNPJ)
 *    and por geradores Pix internos (Pix from lead data).
 *  - Automatic confirmation requires a PSP/Pix API (e.g. Mercado Pago).
 *    The static code here is valid for visual / functional testing only.
 */

// Receiver of the legacy fixed-CNPJ Pix dialog. Kept as-is to avoid
// breaking callers (PixFallbackDialog).
export const PIX_KEY = "54.295.500/0001-27";
export const PIX_KEY_PLAIN = "54295500000127";
export const PIX_RECEBEDOR = "Impulsionando Tecnologia LTDA";
export const PIX_RECEBEDOR_SHORT = "IMPULSIONANDO TEC"; // <= 25 ASCII
export const PIX_CIDADE = "RIO DE JANEIRO"; // <= 15 ASCII

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — required by Pix EMV.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(input: string, max: number): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max);
}

export interface PixPayloadInput {
  /** Pix key — CPF/CNPJ (digits only), email, phone (+5511...) or random key. */
  pixKey: string;
  /** Amount in BRL (e.g. 1.00). */
  amount: number;
  /** Receiver / merchant name (max 25 chars after sanitize). */
  merchantName: string;
  /** Merchant city (max 15 chars after sanitize). */
  merchantCity?: string;
  /** Transaction reference (max 25 chars; e.g. order_nsu). */
  txid?: string;
  /** Optional description shown in the bank app. */
  description?: string;
}

/**
 * Build a static Pix "copia e cola" EMV payload.
 *
 * Two call signatures:
 *  - buildPixPayload(amountCents, txid) — legacy form for the fixed-CNPJ
 *    Pix fallback dialog. Uses {@link PIX_KEY_PLAIN}/{@link PIX_RECEBEDOR_SHORT}.
 *  - buildPixPayload({ pixKey, amount, merchantName, ... }) — Pix from lead
 *    data, used by the /teste PixTestGenerator.
 */
export function buildPixPayload(amountCents: number, txid: string): string;
export function buildPixPayload(input: PixPayloadInput): string;
export function buildPixPayload(a: number | PixPayloadInput, b?: string): string {
  if (typeof a === "number") {
    const amount = (Math.max(0, a) / 100).toFixed(2);
    const safeTxid = (b || "ORC").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "ORC";
    const merchant = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", PIX_KEY_PLAIN);
    const payload =
      tlv("00", "01") +
      tlv("26", merchant) +
      tlv("52", "0000") +
      tlv("53", "986") +
      tlv("54", amount) +
      tlv("58", "BR") +
      tlv("59", PIX_RECEBEDOR_SHORT) +
      tlv("60", PIX_CIDADE) +
      tlv("62", tlv("05", safeTxid));
    const toCrc = payload + "6304";
    return toCrc + crc16(toCrc);
  }

  const input = a;
  const merchantName = sanitize(input.merchantName || "IMPULSIONANDO", 25);
  const merchantCity = sanitize(input.merchantCity || "BRASIL", 15);
  const txid = sanitize(input.txid || "TESTE", 25) || "TESTE";
  const amount = Math.max(0, input.amount).toFixed(2);

  const mai =
    tlv("00", "BR.GOV.BCB.PIX") +
    tlv("01", input.pixKey.trim()) +
    (input.description ? tlv("02", sanitize(input.description, 40)) : "");
  const additional = tlv("05", txid);

  const payload =
    tlv("00", "01") +
    tlv("26", mai) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount) +
    tlv("58", "BR") +
    tlv("59", merchantName) +
    tlv("60", merchantCity) +
    tlv("62", additional) +
    "6304";
  return payload + crc16(payload);
}

export function pixQrUrl(payload: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(
    payload,
  )}`;
}
