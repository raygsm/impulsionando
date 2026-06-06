// Z-API helper — server-only. Envia mensagens WhatsApp via Z-API.
// Docs: https://developer.z-api.io/

const BASE = 'https://api.z-api.io'

function onlyDigits(v: string) {
  return (v ?? '').replace(/\D/g, '')
}

/**
 * Normaliza um número BR para o formato exigido pela Z-API (apenas dígitos, com DDI).
 * Aceita "(11) 98888-7777", "+55 11 98888-7777", "5511988887777", etc.
 * Se não vier DDI, assume 55 (Brasil).
 */
export function normalizePhone(raw: string): string {
  let d = onlyDigits(raw)
  if (!d) return ''
  if (!d.startsWith('55') && d.length <= 11) d = '55' + d
  return d
}

export async function sendWhatsAppText(args: {
  phone: string
  message: string
}): Promise<{ ok: boolean; status: number; body: string; messageId: string | null }> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !instanceToken || !clientToken) {
    return { ok: false, status: 0, body: 'zapi credentials missing', messageId: null }
  }

  const phone = normalizePhone(args.phone)
  if (!phone) return { ok: false, status: 0, body: 'invalid phone', messageId: null }

  const url = `${BASE}/instances/${instanceId}/token/${instanceToken}/send-text`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': clientToken,
    },
    body: JSON.stringify({ phone, message: args.message }),
  })
  const body = await res.text()
  let messageId: string | null = null
  try {
    const json = JSON.parse(body) as { messageId?: string; id?: string; zaapId?: string }
    messageId = json.messageId ?? json.id ?? json.zaapId ?? null
  } catch {
    // body não é JSON — segue sem messageId
  }
  return { ok: res.ok, status: res.status, body, messageId }
}

