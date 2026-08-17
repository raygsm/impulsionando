import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';

async function companyId() {
  const { data } = await (supabaseAdmin as any)
    .from('communication_tenants')
    .select('company_id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  return data?.company_id as string | undefined;
}

export const Route = createFileRoute('/api/anamadu/product-detail')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get('id')?.trim() ?? '';
        if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'invalid_product_id' }, { status: 400 });

        const cid = await companyId();
        if (!cid) return Response.json({ error: 'tenant_not_provisioned' }, { status: 503 });

        const { data, error } = await (supabaseAdmin as any)
          .from('core_products')
          .select('id,name,brand,category,description,image_url,active,metadata')
          .eq('id', id)
          .eq('company_id', cid)
          .eq('brand', 'Ana Madú')
          .eq('active', true)
          .maybeSingle();

        if (error || !data) return Response.json({ error: 'product_not_found' }, { status: 404 });

        const metadata = data.metadata ?? {};
        const price = Number(metadata.sale_price ?? metadata.price ?? 0);
        const rawStatus = String(metadata.availability ?? 'unknown');
        const status = rawStatus === 'available' || rawStatus === 'sold_out' ? rawStatus : 'unknown';

        return Response.json({
          id: data.id,
          name: data.name,
          category: data.category,
          description: data.description,
          image: data.image_url,
          price,
          priceLabel: price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          status,
          source: 'impulsionando_core',
        }, {
          headers: {
            'cache-control': 'private, max-age=60',
            'x-content-type-options': 'nosniff',
          },
        });
      },
    },
  },
});
