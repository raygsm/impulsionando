// PIX BR Code (EMV) — builder + constantes do beneficiário (Impulsionando / CHRISMED).
// Padrão Bacen / EMV MPM: campos TLV (ID 2 dígitos + tamanho 2 dígitos + valor).
//
// NOTA IMPORTANTE (CHRISMED): as constantes abaixo refletem o beneficiário atual
// (Impulsionando Tecnologia LTDA). Para trocar o recebedor para a CHRISMED,
// substitua PIX_KEY / PIX_KEY_PLAIN / PIX_RECEBEDOR / PIX_RECEBEDOR_SHORT pelo
// CNPJ e razão social da clínica. O restante do fluxo (QR + copia-e-cola)
// continua funcionando sem outras mudanças.

export const PIX_KEY = '54.295.500/0001-27';
export const PIX_KEY_PLAIN = '54295500000127';
export const PIX_RECEBEDOR = 'Impulsionando Tecnologia LTDA';
export const PIX_RECEBEDOR_SHORT = 'IMPULSIONANDO TEC'; // <= 25 chars ASCII
export const PIX_CIDADE = 'RIO DE JANEIRO'; // <= 15 chars ASCII

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido no fim do payload PIX.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim();
}

export interface PixParams {
  pixKey: string;
  /** Valor em reais (ex.: 1200.00). */
  amount: number;
  merchantName: string;
  merchantCity: string;
  txid?: string;
  /** Descrição opcional (campo adicional 62/02). Máx. 40 chars ASCII. */
  description?: string;
}

/**
 * Overloads:
 *   buildPixPayload(amountCents: number, txid: string)  ← forma antiga (Impulsionando defaults)
 *   buildPixPayload(params: PixParams)                  ← forma explícita
 */
export function buildPixPayload(amountCents: number, txid: string): string;
export function buildPixPayload(params: PixParams): string;
export function buildPixPayload(a: number | PixParams, b?: string): string {
  const params: PixParams =
    typeof a === 'number'
      ? {
          pixKey: PIX_KEY_PLAIN,
          amount: a / 100,
          merchantName: PIX_RECEBEDOR_SHORT,
          merchantCity: PIX_CIDADE,
          txid: b,
        }
      : a;

  const name = sanitize(params.merchantName).slice(0, 25) || 'RECEBEDOR';
  const city = sanitize(params.merchantCity).slice(0, 15) || 'BRASIL';
  const txid = sanitize(params.txid ?? '***').slice(0, 25) || '***';

  const merchantAccountInfo = tlv(
    '26',
    tlv('00', 'br.gov.bcb.pix') + tlv('01', params.pixKey),
  );

  const additionalDataInner =
    tlv('05', txid) +
    (params.description ? tlv('02', sanitize(params.description).slice(0, 40)) : '');

  const additionalData = tlv('62', additionalDataInner);

  const partial =
    tlv('00', '01') +
    merchantAccountInfo +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', params.amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', name) +
    tlv('60', city) +
    additionalData +
    '6304';

  return partial + crc16(partial);
}

/** URL de imagem QR para renderizar o BR Code. Usa provider público (api.qrserver.com). */
export function pixQrUrl(payload: string, size: number = 240): string {
  const s = Math.max(120, Math.min(600, size));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&margin=8&data=${encodeURIComponent(payload)}`;
}
