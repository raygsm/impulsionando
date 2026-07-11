// PIX BR Code (EMV) payload builder — gera o "copia-e-cola" que o QR Code representa.
// Padrão Bacen / EMV MPM: campos TLV (ID de 2 dígitos + tamanho de 2 dígitos + valor).

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) — obrigatório no fim do payload PIX.
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

// Sanitiza nome/cidade: remove acentos, mantém ASCII (regra PIX estático).
function sanitize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim();
}

export interface PixParams {
  /** Chave PIX (CNPJ, CPF, e-mail, telefone ou aleatória). Para CNPJ, use só dígitos. */
  key: string;
  /** Valor em reais (ex.: 1200.00). */
  amount: number;
  /** Nome do beneficiário (máx. 25 chars após sanitização). */
  merchantName: string;
  /** Cidade do beneficiário (máx. 15 chars após sanitização). */
  merchantCity: string;
  /** Identificador da transação (máx. 25 chars, alfanumérico). */
  txid?: string;
}

export function buildPixPayload({
  key,
  amount,
  merchantName,
  merchantCity,
  txid = '***',
}: PixParams): string {
  const name = sanitize(merchantName).slice(0, 25) || 'CHRISMED';
  const city = sanitize(merchantCity).slice(0, 15) || 'RIO DE JANEIRO';
  const cleanTxid = sanitize(txid).slice(0, 25) || '***';

  const gui = tlv('00', 'br.gov.bcb.pix');
  const chave = tlv('01', key);
  const merchantAccountInfo = tlv('26', gui + chave);

  const additionalData = tlv('62', tlv('05', cleanTxid));

  const payloadNoCrc =
    tlv('00', '01') + // Payload Format Indicator
    tlv('26', gui.slice(4) ? gui + chave : gui + chave) + // (placeholder, replaced below)
    '';

  // Rebuild in ordem correta EMV:
  const parts =
    tlv('00', '01') + // 00 - Payload Format Indicator
    merchantAccountInfo + // 26 - Merchant Account Info
    tlv('52', '0000') + // 52 - Merchant Category Code
    tlv('53', '986') + // 53 - Transaction Currency (BRL)
    tlv('54', amount.toFixed(2)) + // 54 - Transaction Amount
    tlv('58', 'BR') + // 58 - Country Code
    tlv('59', name) + // 59 - Merchant Name
    tlv('60', city) + // 60 - Merchant City
    additionalData + // 62 - Additional Data Field
    '6304'; // 63 - CRC16 header (valor calculado abaixo)

  // silenciar variável não usada (kept for clarity)
  void payloadNoCrc;

  return parts + crc16(parts);
}
