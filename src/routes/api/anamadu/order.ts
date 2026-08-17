import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';

function clean(value: unknown, max = 180) {
  return String(value ?? '').trim().slice(0, max);
}

export const Route = createFileRoute('/api/anamadu/order')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null) as {
          customer?: { name?: string; email?: string; phone?: string };
          items?: Array<{ id?: string; qty?: number }>;
          attribution?: Record<string, unknown>;
        } | null;

        const name = clean(body?.customer?.name, 120);
        const email = clean(body?.customer?.email, 180).toLowerCase();
        const phone = clean(body?.customer?.phone, 40);
        const requested = Array.isArray(body?.items) ? body!.items!.slice(0, 50) : [];
        if (!name || !email || !phone || !requested.length) {
          return Response.json({ ok: false, error: 'Dados do cliente e itens são obrigatórios.' }, { status: 400 });
        }

        const normalized = requested
          .map((item) => ({ id: clean(item.id, 36), qty: Math.max(1, Math.min(20, Math.trunc(Number(item.qty ?? 1)))) }))
          .filter((item) => /^[0-9a-f-]{36}$/i.test(item.id));
        if (!normalized.length) return Response.json({ ok: false, error: 'Itens inválidos.' }, { status: 400 });

        const { data: tenant } = await (supabaseAdmin as any)
          .from('communication_tenants')
          .select('id,company_id')
          .eq('slug', TENANT_SLUG)
          .eq('active', true)
          .maybeSingle();
        if (!tenant?.company_id) return Response.json({ ok: false, error: 'Ana Madú não provisionada.' }, { status: 503 });

        const ids = [...new Set(normalized.map((item) => item.id))];
        const { data: products, error: productError } = await (supabaseAdmin as any)
          .from('core_products')
          .select('id,name,active,metadata')
          .eq('company_id', tenant.company_id)
          .eq('brand', 'Ana Madú')
          .eq('active', true)
          .in('id', ids);
        if (productError) return Response.json({ ok: false, error: 'Falha ao validar catálogo.' }, { status: 500 });

        const byId = new Map((products ?? []).map((product: any) => [product.id, product]));
        const lines = normalized.map((entry) => {
          const product: any = byId.get(entry.id);
          if (!product) return null;
          const price = Number(product.metadata?.sale_price ?? product.metadata?.price ?? 0);
          const availability = String(product.metadata?.availability ?? 'unknown');
          if (!Number.isFinite(price) || price <= 0 || availability === 'sold_out') return null;
          return { id: product.id, name: product.name, qty: entry.qty, unitPrice: price, total: price * entry.qty };
        }).filter(Boolean) as Array<{ id: string; name: string; qty: number; unitPrice: number; total: number }>;

        if (lines.length !== normalized.length) {
          return Response.json({ ok: false, error: 'Um ou mais produtos não estão disponíveis. Atualize o carrinho.' }, { status: 409 });
        }

        const total = lines.reduce((sum, line) => sum + line.total, 0);
        const orderNumber = `AM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const correlationId = `anamadu.order:${orderNumber}:${randomUUID()}`;

        const { data: order, error: orderError } = await (supabaseAdmin as any)
          .from('sales_orders')
          .insert({
            company_id: tenant.company_id,
            order_number: orderNumber,
            customer_name: name,
            status: 'draft',
            currency: 'BRL',
            subtotal: total,
            discount_total: 0,
            total,
            metadata: {
              tenant_slug: TENANT_SLUG,
              storefront: 'anamadu_core',
              customer: { name, email, phone },
              attribution: body?.attribution ?? {},
              payment_status: 'not_started',
              correlation_id: correlationId,
            },
          })
          .select('id,order_number,status,total,created_at')
          .single();
        if (orderError || !order) return Response.json({ ok: false, error: orderError?.message ?? 'Falha ao criar pedido.' }, { status: 500 });

        const { error: itemError } = await (supabaseAdmin as any).from('sales_order_items').insert(lines.map((line) => ({
          order_id: order.id,
          company_id: tenant.company_id,
          product_id: line.id,
          description: line.name,
          quantity: line.qty,
          unit_price: line.unitPrice,
          discount: 0,
          total: line.total,
        })));
        if (itemError) {
          await (supabaseAdmin as any).from('sales_orders').delete().eq('id', order.id).eq('company_id', tenant.company_id);
          return Response.json({ ok: false, error: 'Falha ao registrar itens do pedido.' }, { status: 500 });
        }

        await (supabaseAdmin as any).from('communication_events').insert({
          event_type: 'conversao.checkout-iniciado',
          tenant_id: tenant.id,
          company_id: tenant.company_id,
          entity_type: 'sales_order',
          entity_id: order.id,
          channel: 'WEB',
          occurred_at: new Date().toISOString(),
          correlation_id: correlationId,
          idempotency_key: `anamadu:${orderNumber}:checkout_started`,
          metadata: { storefront: 'anamadu_core' },
          payload: { order_number: orderNumber, total, customer: { name, email, phone } },
          source: 'anamadu_storefront',
          environment: 'production',
        });

        return Response.json({
          ok: true,
          order,
          payment: { status: 'not_started', message: 'Pedido criado. O pagamento será apresentado apenas quando um meio homologado estiver disponível.' },
        }, { status: 201, headers: { 'cache-control': 'no-store' } });
      },
    },
  },
});
