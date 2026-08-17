import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

type CoreCatalogItem = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image?: string;
  status: 'available' | 'sold_out' | 'unknown';
  category?: string;
  description?: string;
};

const TENANT_SLUG = 'anamadu';

async function tenantCompanyId() {
  const { data, error } = await (supabaseAdmin as any)
    .from('communication_tenants')
    .select('company_id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data?.company_id as string | undefined;
}

function fromCoreRow(row: any): CoreCatalogItem | null {
  const metadata = row.metadata ?? {};
  const price = Number(metadata.sale_price ?? metadata.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const rawStatus = String(metadata.availability ?? 'unknown');
  const status: CoreCatalogItem['status'] = rawStatus === 'available' || rawStatus === 'sold_out' ? rawStatus : 'unknown';

  return {
    id: String(row.id),
    name: String(row.name ?? '').trim(),
    price,
    priceLabel: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price),
    image: row.image_url || undefined,
    status,
    category: row.category || undefined,
    description: row.description || undefined,
  };
}

async function loadCoreCatalog(companyId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from('core_products')
    .select('id,name,category,description,image_url,metadata')
    .eq('company_id', companyId)
    .eq('brand', 'Ana Madú')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map(fromCoreRow)
    .filter((item: CoreCatalogItem | null): item is CoreCatalogItem => Boolean(item?.name));
}

export const Route = createFileRoute('/api/anamadu/catalog')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const companyId = await tenantCompanyId();
          if (!companyId) {
            return Response.json(
              { source: 'impulsionando_core', count: 0, items: [], error: 'tenant_not_provisioned' },
              { status: 503, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } },
            );
          }

          const items = await loadCoreCatalog(companyId);

          return Response.json(
            {
              source: 'impulsionando_core',
              syncedAt: new Date().toISOString(),
              count: items.length,
              migrated: false,
              legacyDependency: false,
              items,
            },
            {
              status: 200,
              headers: {
                'cache-control': 'private, max-age=60',
                'x-content-type-options': 'nosniff',
              },
            },
          );
        } catch (error) {
          console.error('[AnaMadu Catalog] Core read failed', error instanceof Error ? error.message : 'unknown_error');
          return Response.json(
            { source: 'impulsionando_core', count: 0, items: [], error: 'catalog_core_unavailable' },
            { status: 503, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } },
          );
        }
      },
    },
  },
});
