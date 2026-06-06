// Utilitário Pix BR Code (EMV) — gera payload "copia e cola" com valor + txid.
// Recebedor: Impulsionando Tecnologia LTDA — CNPJ 54.295.500/0001-27.

export const PIX_KEY = "54.295.500/0001-27";
export const PIX_KEY_PLAIN = "54295500000127";
export const PIX_RECEBEDOR = "Impulsionando Tecnologia LTDA";
export const PIX_RECEBEDOR_SHORT = "IMPULSIONANDO TEC"; // <= 25 ASCII
export const PIX_CIDADE = "RIO DE JANEIRO"; // <= 15 ASCII

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(amountCents: number, txid: string) {
  const amount = (Math.max(0, amountCents) / 100).toFixed(2);
  const safeTxid =
    (txid || "ORC").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "ORC";
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

export function pixQrUrl(payload: string, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(payload)}`;
}
