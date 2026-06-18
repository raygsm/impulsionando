/**
 * Painel interno de notificações do salão.
 *
 * Lista os SINAIS INTERNOS gerados pela operação:
 *   - notifyItemReady: itens marcados como "entregue" pelo garçom
 *     (lock idempotente em sales_order_items.notified_ready_at).
 *   - pós-visita: sessões com restaurant_table_sessions.postvisit_notified_at
 *     já preenchido (relacionamento, não operação).
 *
 * Read-only, somente para staff da casa. RLS aplica via supabase (usuário).
 */
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const Input = z.object({
  company_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

export const getInternalSalaoNotifications = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context
    const limit = data.limit ?? 50

    let itemsQ = supabase
      .from('sales_order_items')
      .select(
        `id, description, quantity, kitchen_status, notified_ready_at, order_id, company_id,
         order:order_id ( id, sales_orders_session:restaurant_table_sessions ( id, customer_name, table:table_id ( number ) ) )`,
      )
      .not('notified_ready_at', 'is', null)
      .order('notified_ready_at', { ascending: false })
      .limit(limit)
    if (data.company_id) itemsQ = itemsQ.eq('company_id', data.company_id)
    const { data: items } = await itemsQ

    let postQ = supabase
      .from('restaurant_table_sessions')
      .select(
        `id, customer_name, customer_email, postvisit_notified_at, bill_notified_at, company_id,
         table:table_id ( number )`,
      )
      .not('postvisit_notified_at', 'is', null)
      .order('postvisit_notified_at', { ascending: false })
      .limit(limit)
    if (data.company_id) postQ = postQ.eq('company_id', data.company_id)
    const { data: postvisit } = await postQ

    return {
      ready_signals: (items ?? []).map((r: any) => ({
        id: r.id,
        kind: 'item_ready' as const,
        description: `${r.quantity}× ${r.description}`,
        table_number: r.order?.sales_orders_session?.[0]?.table?.number ?? null,
        customer_name: r.order?.sales_orders_session?.[0]?.customer_name ?? null,
        status: r.kitchen_status as string,
        idempotency_key: `item-ready:${r.id}`,
        notified_at: r.notified_ready_at as string,
        already_notified: true,
      })),
      postvisit: (postvisit ?? []).map((s: any) => ({
        id: s.id,
        kind: 'postvisit' as const,
        customer_name: s.customer_name ?? null,
        customer_email: s.customer_email ?? null,
        table_number: s.table?.number ?? null,
        bill_notified_at: s.bill_notified_at as string | null,
        notified_at: s.postvisit_notified_at as string,
        idempotency_key: `postvisit:${s.id}`,
        already_notified: true,
      })),
    }
  })
