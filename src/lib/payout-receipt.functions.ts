// Geração + URL assinada do comprovante PDF de repasse.
// - Caller acessa via supabase autenticado (RLS valida posse: staff OU membro da empresa).
// - Upload e signed URL via service_role (bucket privado).
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

export const getPayoutReceiptUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ledger_id: string; regenerate?: boolean }) =>
    z.object({ ledger_id: z.string().uuid(), regenerate: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation(
      'payouts.getPayoutReceiptUrl',
      { user_id: context.userId, ledger_id: data.ledger_id },
      async () => {
        // RLS valida acesso ao lote — se não encontrar, é 403 implícito.
        const { data: batch, error } = await context.supabase
          .from('core_payout_ledger')
          .select(
            'id, company_id, period_start, period_end, gross_cents, fee_cents, net_cents, event_count, status, provider, provider_payout_id, paid_at, retention_reason, receipt_path, companies:companies(name, niche)',
          )
          .eq('id', data.ledger_id)
          .maybeSingle()
        if (error) throw error
        if (!batch) throw new Error('Lote não encontrado ou sem acesso')

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const path = batch.receipt_path ?? `${batch.company_id}/${batch.id}.pdf`

        if (!batch.receipt_path || data.regenerate) {
          const { generatePayoutReceiptPdf } = await import('./payout-receipt.server')
          const bytes = await generatePayoutReceiptPdf(batch as any)
          const { error: upErr } = await supabaseAdmin.storage
            .from('payout-receipts')
            .upload(path, bytes, { contentType: 'application/pdf', upsert: true })
          if (upErr) throw upErr
          if (!batch.receipt_path) {
            await supabaseAdmin
              .from('core_payout_ledger')
              .update({ receipt_path: path })
              .eq('id', batch.id)
          }
        }

        const { data: signed, error: sErr } = await supabaseAdmin.storage
          .from('payout-receipts')
          .createSignedUrl(path, 60 * 60 * 24 * 7) // 7d
        if (sErr) throw sErr
        return { url: signed.signedUrl, path }
      },
    ),
  )
