/**
 * Pure Pix BR Code (EMV) builder — generates the "copia e cola" string
 * for static Pix charges from lead data. No network calls.
 *
 * Notes:
 *  - This is a TEST helper for the /teste flow. Automatic confirmation of
 *    the Pix payment requires a PSP/Pix API (e.g. via InfinitePay). The
 *    static code here is valid for visual / functional testing only.
 */

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// CRC-16/CCITT-FALSE (polynomial 0x1021, initial 0xFFFF) — required by Pix EMV.
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
 * Build a static Pix "copia e cola" payload (EMV).
 */
export function buildPixPayload(input: PixPayloadInput): string {
  const merchantName = sanitize(input.merchantName || "IMPULSIONANDO", 25);
  const merchantCity = sanitize(input.merchantCity || "BRASIL", 15);
  const txid = sanitize(input.txid || "TESTE", 25) || "TESTE";
  const amount = Math.max(0, input.amount).toFixed(2);

  // Merchant Account Information (ID 26): GUI + key (+ optional info)
  const mai =
    emv("00", "BR.GOV.BCB.PIX") +
    emv("01", input.pixKey.trim()) +
    (input.description ? emv("02", sanitize(input.description, 40)) : "");

  const additional = emv("05", txid);

  const payload =
    emv("00", "01") + // Payload Format Indicator
    emv("26", mai) +
    emv("52", "0000") + // Merchant Category Code
    emv("53", "986") + // Currency BRL
    emv("54", amount) +
    emv("58", "BR") +
    emv("59", merchantName) +
    emv("60", merchantCity) +
    emv("62", additional) +
    "6304"; // CRC placeholder

  return payload + crc16(payload);
}
