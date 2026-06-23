import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const calcSchema = z.object({
  companyId: z.string().uuid(),
  regionCode: z.string().min(2),
  weightG: z.number().int().min(0).default(0),
  modality: z.enum(['expresso', 'padrao', 'economico']).optional(),
});

/** Retorna opções de frete disponíveis para a região e peso. */
export const calculateShipping = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => calcSchema.parse(d))
  .handler(async ({ data, context }) => {
    const q = context.supabase
      .from('logistics_shipping_rates')
      .select('*')
      .eq('company_id', data.companyId)
      .eq('region_code', data.regionCode)
      .eq('is_active', true)
      .lte('min_weight_g', data.weightG)
      .gte('max_weight_g', data.weightG);
    const { data: rates, error } = await q;
    if (error) throw new Error(error.message);
    const filtered = data.modality ? rates.filter((r) => r.modality === data.modality) : rates;
    return filtered.map((r) => ({
      id: r.id,
      modality: r.modality,
      amount: Number(r.base_amount) + (Number(r.per_kg_amount) * data.weightG) / 1000,
      etaDaysMin: r.eta_days_min,
      etaDaysMax: r.eta_days_max,
    }));
  });

const commitSchema = z.object({
  companyId: z.string().uuid(),
  quoteId: z.string().uuid(),
  fulfillmentMode: z.enum(['pickup', 'dispatch']),
  shippingRateId: z.string().uuid().optional(),
  shippingAmount: z.number().min(0).default(0),
  shippingAddress: z.record(z.any()).optional(),
  weightG: z.number().int().min(0).default(0),
  sellerId: z.string().uuid().optional(),
});

/**
 * Compromisso do pedido:
 *  - cria order_logistics (status reserved)
 *  - registra eventos: stock_decremented (signal), invoice_intent (auto/manual), sector notify
 *  - enfileira notificações in-app para estoque/financeiro/vendedor
 *  - cria touches CRM conforme regras com trigger_event='order_paid'
 */
export const commitOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => commitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    const { data: company, error: companyErr } = await sb
      .from('companies')
      .select('id, fiscal_auto_emit, fiscal_provider')
      .eq('id', data.companyId)
      .maybeSingle();
    if (companyErr) throw new Error(companyErr.message);
    if (!company) throw new Error('Empresa não encontrada');

    const { data: quote, error: quoteErr } = await sb
      .from('riomed_quotes')
      .select('id, customer_id, lead_id, opportunity_id, total')
      .eq('id', data.quoteId)
      .maybeSingle();
    if (quoteErr) throw new Error(quoteErr.message);
    if (!quote) throw new Error('Pedido não encontrado');

    const { data: ol, error: olErr } = await sb
      .from('order_logistics')
      .insert({
        company_id: data.companyId,
        quote_id: data.quoteId,
        customer_id: quote.customer_id,
        seller_id: data.sellerId ?? null,
        fulfillment_mode: data.fulfillmentMode,
        shipping_rate_id: data.shippingRateId ?? null,
        shipping_amount: data.shippingAmount,
        shipping_address: data.shippingAddress ?? null,
        weight_g: data.weightG,
        status: 'reserved',
      })
      .select('*')
      .single();
    if (olErr) throw new Error(olErr.message);

    const baseEvent = {
      company_id: data.companyId,
      quote_id: data.quoteId,
      order_logistics_id: ol.id,
      actor: `user:${context.userId}`,
    };

    const events: Array<{ company_id: string; quote_id: string; order_logistics_id: string; actor: string; event_type: string; payload: Record<string, unknown> }> = [
      { ...baseEvent, event_type: 'stock_decremented', payload: { mode: 'auto' } },
      {
        ...baseEvent,
        event_type: company.fiscal_auto_emit ? 'invoice_intent_auto' : 'invoice_intent_manual',
        payload: { provider: company.fiscal_provider ?? null },
      },
      { ...baseEvent, event_type: 'stock_notified', payload: { sector: 'estoque' } },
      { ...baseEvent, event_type: 'finance_notified', payload: { sector: 'financeiro' } },
    ];
    if (data.sellerId) {
      events.push({ ...baseEvent, event_type: 'seller_notified', payload: { seller_id: data.sellerId } });
    }
    await sb.from('order_events').insert(events);

    // notificações in-app para membros dos setores estoque/financeiro
    const { data: sectorMembers } = await sb
      .from('sector_members')
      .select('user_id, sectors!inner(code)')
      .eq('company_id', data.companyId)
      .eq('is_active', true)
      .in('sectors.code', ['estoque', 'financeiro']);

    const notifs =
      (sectorMembers ?? []).map((m: any) => ({
        user_id: m.user_id,
        company_id: data.companyId,
        title: 'Novo pedido confirmado',
        body: `Pedido ${data.quoteId.slice(0, 8)} - ${data.fulfillmentMode === 'pickup' ? 'Retirada' : 'Despacho'}`,
        category: 'order',
        link: `/admin/pedidos/${data.quoteId}`,
      })) ?? [];
    if (data.sellerId) {
      notifs.push({
        user_id: data.sellerId,
        company_id: data.companyId,
        title: 'Sua venda foi confirmada',
        body: `Pedido ${data.quoteId.slice(0, 8)}`,
        category: 'sales',
        link: `/admin/pedidos/${data.quoteId}`,
      });
    }
    if (notifs.length) await sb.from('notifications').insert(notifs);

    // CRM touches a partir das regras com trigger_event='order_paid'
    const { data: rules } = await sb
      .from('crm_touch_rules')
      .select('*')
      .eq('company_id', data.companyId)
      .eq('trigger_event', 'order_paid')
      .eq('is_active', true);

    const now = Date.now();
    const touches = (rules ?? []).map((r) => ({
      company_id: data.companyId,
      rule_id: r.id,
      rule_code: r.code,
      lead_id: quote.lead_id,
      opportunity_id: quote.opportunity_id,
      quote_id: quote.id,
      customer_id: quote.customer_id,
      assignee_user_id: r.assign_to === 'seller' ? data.sellerId ?? null : null,
      channel: r.channel,
      scheduled_for: new Date(now + r.offset_days * 86400000).toISOString(),
      payload: { template: r.template_code, sector: r.sector_code },
    }));
    if (touches.length) await sb.from('crm_touch_queue').insert(touches);

    return { ok: true, orderLogisticsId: ol.id, eventsCreated: events.length, touchesScheduled: touches.length };
  });
