// Geração server-side do comprovante PDF de repasse usando pdf-lib (Worker-compatível).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type ReceiptBatch = {
  id: string
  company_id: string
  period_start: string
  period_end: string
  gross_cents: number
  fee_cents: number
  net_cents: number
  event_count: number
  status: string
  provider: string | null
  provider_payout_id: string | null
  paid_at: string | null
  retention_reason: string | null
  companies?: { name?: string | null; niche?: string | null } | null
}

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export async function generatePayoutReceiptPdf(batch: ReceiptBatch): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842]) // A4
  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.07, 0.09, 0.15)
  const mute = rgb(0.4, 0.43, 0.5)
  const brand = rgb(0.13, 0.45, 0.95)

  let y = 800
  const left = 48

  page.drawText('Impulsionando', { x: left, y, size: 18, font: helvBold, color: brand })
  page.drawText('Comprovante de Repasse', { x: left, y: y - 22, size: 11, font: helv, color: mute })
  y -= 60

  page.drawText(batch.companies?.name ?? 'Empresa', { x: left, y, size: 14, font: helvBold, color: ink })
  if (batch.companies?.niche) {
    page.drawText(batch.companies.niche, { x: left, y: y - 16, size: 10, font: helv, color: mute })
  }
  y -= 44

  const rows: Array<[string, string]> = [
    ['Lote', batch.id.slice(0, 8).toUpperCase()],
    ['Período', `${fmtDate(batch.period_start)} -> ${fmtDate(batch.period_end)}`],
    ['Eventos', String(batch.event_count)],
    ['Bruto', fmtBRL(batch.gross_cents)],
    ['Taxa', `- ${fmtBRL(batch.fee_cents)}`],
    ['Líquido', fmtBRL(batch.net_cents)],
    ['Status', batch.status.toUpperCase()],
    ['Provedor', batch.provider ?? '—'],
    ['ID Provedor', batch.provider_payout_id ?? '—'],
    ['Pago em', fmtDate(batch.paid_at)],
  ]
  if (batch.retention_reason) rows.push(['Retenção', batch.retention_reason])

  for (const [label, value] of rows) {
    page.drawText(label, { x: left, y, size: 10, font: helv, color: mute })
    const isHighlight = label === 'Líquido'
    page.drawText(value, {
      x: left + 140,
      y,
      size: isHighlight ? 12 : 10,
      font: isHighlight ? helvBold : helv,
      color: isHighlight ? brand : ink,
    })
    y -= 22
  }

  y -= 24
  page.drawLine({ start: { x: left, y }, end: { x: 547, y }, thickness: 0.5, color: mute })
  y -= 20
  page.drawText('Documento gerado eletronicamente pelo core Impulsionando.', {
    x: left, y, size: 8, font: helv, color: mute,
  })
  page.drawText(`Emitido em ${new Date().toLocaleString('pt-BR')}`, {
    x: left, y: y - 12, size: 8, font: helv, color: mute,
  })

  return pdf.save()
}
