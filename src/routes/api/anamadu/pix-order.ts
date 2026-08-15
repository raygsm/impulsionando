import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';

function clean(value: unknown, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

export const Route = createFileRoute('/api/anamadu/pix-order')({
  server: {
    handlers: {
      GET: async () => {
        const { data: tenant } = await (supabaseAdmin as any)
          .from('communication_tenants')
          .select('id,company_id,settings')
          .eq('slug', TENANT_SLUG)
          .eq('active', true)
          .maybeSingle();

        const pix = tenant?.settings?.pix ?? {};
        return Response.json({
          ok: true,
          pixConfigured: Boolean(pix?.key),
          pix: pix?.key ? { key: pix.key, keyType: pix.keyType ?? null, beneficiary: pix.beneficiary ?? 'Ana Madú' } : null,
          mercadoPago: { enabled: false, label: 'Em breve, Mercado Pago' },
        });
      },

      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}));
        const name = clean(payload?.name, 120);
        const email = clean(payload?.email, 180).toLowerCase();
        const phone = clean(payload?.phone, 40);
        const productName = clean(payload?.productName || 'Produto teste', 180);
        const amount = Number(payload?.amount ?? 1);
        const attribution = payload?.attribution && typeof payload.attribution === 'object' ? payload.attribution : {};

        if (!name || !email || !phone) {
          return Response.json({ ok: false, error: 'Nome, e-mail e WhatsApp são obrigatórios.' }, { status: 400 });
        }
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
          return Response.json({ ok: false, error: 'Valor inválido.' }, { status: 400 });
        }

        const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
          .from('communication_tenants')
          .select('id,company_id,settings')
          .eq('slug', TENANT_SLUG)
          .eq('active', true)
          .maybeSingle();
        if (tenantError || !tenant?.company_id) {
          return Response.json({ ok: false, error: 'Ana Madú não provisionada no Core.' }, { status: 503 });
        }

        const pix = tenant?.settings?.pix ?? {};
        if (!pix?.key) {
          return Response.json({ ok: false, error: 'PIX ainda não configurado.' }, { status: 503 });
        }

        const companyId = tenant.company_id as string;
        const orderNumber = `AM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const correlationId = `anamadu.pix:${orderNumber}:${randomUUID()}`;

        const { data: pipeline } = await (supabaseAdmin as any)
          .from('crm_pipelines')
          .select('id')
          .eq('company_id', companyId)
          .eq('is_default', true)
          .eq('active', true)
          .maybeSingle();
        const { data: stage } = pipeline?.id
          ? await (supabaseAdmin as any).from('crm_pipeline_stages').select('id').eq('pipeline_id', pipeline.id).eq('code', 'PIX_PENDING').maybeSingle()
          : { data: null } as any;

        const { data: order, error: orderError } = await (supabaseAdmin as any)
          .from('sales_orders')
          .insert({
            company_id: companyId,
            order_number: orderNumber,
            customer_name: name,
            status: 'awaiting_payment',
            currency: 'BRL',
            subtotal: amount,
            discount_total: 0,
            total: amount,
            metadata: {
              tenant_slug: TENANT_SLUG,
              payment_method: 'pix_manual',
              payment_status: 'pending',
              customer: { name, email, phone },
              product: { name: productName, quantity: 1, unit_price: amount },
              attribution,
              correlation_id: correlationId,
              test_scenario: amount === 1 ? 'anamadu_r1_e2e' : null,
            },
          })
          .select('id,order_number,total,status,created_at')
          .single();
        if (orderError || !order) {
          return Response.json({ ok: false, error: orderError?.message ?? 'Falha ao criar pedido.' }, { status: 500 });
        }

        await (supabaseAdmin as any).from('sales_order_items').insert({
          order_id: order.id,
          company_id: companyId,
          description: productName,
          quantity: 1,
          unit_price: amount,
          discount: 0,
          total: amount,
        });

        if (pipeline?.id && stage?.id) {
          await (supabaseAdmin as any).from('crm_opportunities').insert({
            company_id: companyId,
            pipeline_id: pipeline.id,
            stage_id: stage.id,
            title: `${productName} — ${name}`,
            value_cents: Math.round(amount * 100),
            source: clean((attribution as any)?.utm_source || 'checkout_anamadu', 120),
            campaign: clean((attribution as any)?.utm_campaign || '', 160) || null,
            product_interest: productName,
            metadata: { order_id: order.id, order_number: orderNumber, email, phone, attribution, test_scenario: amount === 1 ? 'anamadu_r1_e2e' : null },
          });
        }

        await (supabaseAdmin as any).from('communication_events').insert({
          event_type: 'conversao.pix-gerado',
          tenant_id: tenant.id,
          company_id: companyId,
          entity_type: 'sales_order',
          entity_id: order.id,
          channel: 'WEB',
          occurred_at: new Date().toISOString(),
          correlation_id: correlationId,
          idempotency_key: `anamadu:${orderNumber}:pix_generated`,
          metadata: { order_number: orderNumber, test_scenario: amount === 1 ? 'anamadu_r1_e2e' : null },
          payload: { order_number: orderNumber, amount, currency: 'BRL', customer: { name, email, phone }, product: productName, attribution },
          source: 'anamadu_checkout',
          environment: 'production',
        });

        try {
          const { dispatchN8nByEvent } = await import('@/lib/n8n-dispatch-by-event.server');
          await dispatchN8nByEvent('conversao.pix-gerado', {
            order_id: order.id,
            order_number: orderNumber,
            amount,
            currency: 'BRL',
            email,
            phone,
            payer_name: name,
            product: productName,
            attribution,
            payment_method: 'pix_manual',
            test_scenario: amount === 1 ? 'anamadu_r1_e2e' : null,
          }, companyId, TENANT_SLUG);
        } catch {
          // O pedido permanece válido mesmo se a automação externa estiver indisponível.
        }

        return Response.json({
          ok: true,
          order: { id: order.id, number: orderNumber, amount, status: 'awaiting_payment' },
          pix: { key: pix.key, keyType: pix.keyType ?? null, beneficiary: pix.beneficiary ?? 'Ana Madú' },
          mercadoPago: { enabled: false, label: 'Em breve, Mercado Pago' },
        });
      },
    },
  },
});
