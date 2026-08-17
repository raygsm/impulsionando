import { createFileRoute } from '@tanstack/react-router';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

type LegacyCatalogItem = {
  name: string;
  price: number;
  image?: string;
  status: 'available' | 'sold_out' | 'unknown';
  legacyUrl: string;
  category?: string;
};

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

const ORIGIN = 'https://www.anamadu.com.br';
const TENANT_SLUG = 'anamadu';
const MAX_PAGES = 50;

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined;
  try { return new URL(value, ORIGIN).toString(); } catch { return undefined; }
}

function parsePrice(raw: string) {
  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function productSku(url: string) {
  return `AM-${createHash('sha256').update(url).digest('hex').slice(0, 16).toUpperCase()}`;
}

function inferCategory(name: string) {
  const upper = name.toLocaleUpperCase('pt-BR');
  if (/BRINCO/.test(upper)) return 'BRINCOS';
  if (/COLAR|GARGANTILHA/.test(upper)) return 'COLARES';
  if (/PULSEIRA/.test(upper)) return 'PULSEIRAS';
  if (/TORNOZELEIRA/.test(upper)) return 'TORNOZELEIRAS';
  if (/ANEL/.test(upper)) return 'ÁNEIS';
  if (/JAPAMALA/.test(upper)) return 'JAPAMALA';
  return undefined;
}

function extractItems(html: string): LegacyCatalogItem[] {
  const chunks = html.split(/(?=<[^>]+class=["'][^"']*(?:item-product|product-item|js-item-product)[^"']*["'])/i);
  const items: LegacyCatalogItem[] = [];

  for (const chunk of chunks) {
    const href = chunk.match(/href=["']([^"']*\/produtos\/[^"'#?]+\/?)["']/i)?.[1];
    if (!href) continue;
    const legacyUrl = absoluteUrl(href);
    if (!legacyUrl) continue;

    const priceRaw =
      chunk.match(/(?:R\$|&#82;&#36;|\bR\s*\$)\s*([0-9.]+,[0-9]{2})/i)?.[1] ??
      chunk.match(/data-product-price=["']([0-9.,]+)["']/i)?.[1];
    if (!priceRaw) continue;

    const titleRaw =
      chunk.match(/(?:class=["'][^"']*(?:item-name|product-name|js-item-name)[^"']*["'][^>]*>)([\s\S]{1,500}?)<\//i)?.[1] ??
      chunk.match(/title=["']([^"']+)["']/i)?.[1] ??
      chunk.match(/alt=["']([^"']+)["']/i)?.[1];
    const name = cleanText(titleRaw ?? '');
    if (!name || /^comprar$/i.test(name)) continue;

    const img =
      chunk.match(/(?:data-src|src)=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/i)?.[1] ??
      chunk.match(/srcset=["']([^"'\s,]+)/i)?.[1];

    const price = parsePrice(priceRaw);
    if (price <= 0) continue;
    const soldOut = /esgotado|sem estoque|out of stock/i.test(cleanText(chunk));

    items.push({
      name,
      price,
      image: absoluteUrl(img),
      status: soldOut ? 'sold_out' : 'available',
      legacyUrl,
      category: inferCategory(name),
    });
  }

  const dedup = new Map<string, LegacyCatalogItem>();
  for (const item of items) dedup.set(item.legacyUrl, item);
  return [...dedup.values()];
}

async function fetchLegacyPage(page: number) {
  const candidates = page === 1
    ? [`${ORIGIN}/produtos/`]
    : [`${ORIGIN}/produtos/page/${page}/`, `${ORIGIN}/produtos/?page=${page}`];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Impulsionando-AnaMadu-OneTimeMigration/2.0',
          accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) continue;
      const items = extractItems(await response.text());
      if (items.length) return items;
    } catch {
      // Try next pagination format.
    }
  }
  return [] as LegacyCatalogItem[];
}

async function collectLegacyCatalog() {
  const collected = new Map<string, LegacyCatalogItem>();
  let emptyPages = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const items = await fetchLegacyPage(page);
    if (!items.length) {
      emptyPages += 1;
      if (page > 1 && emptyPages >= 2) break;
      continue;
    }
    emptyPages = 0;
    const before = collected.size;
    for (const item of items) collected.set(item.legacyUrl, item);
    if (page > 1 && collected.size === before) break;
  }

  return [...collected.values()];
}

async function tenantCompanyId() {
  const { data } = await (supabaseAdmin as any)
    .from('communication_tenants')
    .select('company_id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  return data?.company_id as string | undefined;
}

function fromCoreRow(row: any): CoreCatalogItem {
  const metadata = row.metadata ?? {};
  const price = Number(metadata.sale_price ?? metadata.price ?? 0);
  const rawStatus = String(metadata.availability ?? 'unknown');
  const status: CoreCatalogItem['status'] = rawStatus === 'available' || rawStatus === 'sold_out' ? rawStatus : 'unknown';
  return {
    id: row.id,
    name: row.name,
    price,
    priceLabel: price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    image: row.image_url ?? undefined,
    status,
    category: row.category ?? undefined,
    description: row.description ?? undefined,
  };
}

async function loadCoreCatalog(companyId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from('core_products')
    .select('id,sku,name,brand,category,description,image_url,active,metadata')
    .eq('company_id', companyId)
    .eq('brand', 'Ana Madú')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(fromCoreRow).filter((item: CoreCatalogItem) => item.price > 0);
}

async function migrateLegacyCatalog(companyId: string) {
  const legacy = await collectLegacyCatalog();
  if (!legacy.length) return [] as CoreCatalogItem[];

  const now = new Date().toISOString();
  const rows = legacy.map((item) => ({
    company_id: companyId,
    sku: productSku(item.legacyUrl),
    name: item.name,
    brand: 'Ana Madú',
    category: item.category ?? null,
    description: null,
    image_url: item.image ?? null,
    active: true,
    metadata: {
      sale_price: item.price,
      currency: 'BRL',
      availability: item.status,
      migration_origin: ORIGIN,
      legacy_url: item.legacyUrl,
      migrated_at: now,
      storefront: 'anamadu_core',
      source_role: 'migration_only',
    },
  }));

  const { error } = await (supabaseAdmin as any)
    .from('core_products')
    .upsert(rows, { onConflict: 'company_id,sku' });
  if (error) throw error;

  return loadCoreCatalog(companyId);
}

export const Route = createFileRoute('/api/anamadu/catalog')({
  server: {
    handlers: {
      GET: async () => {
        const companyId = await tenantCompanyId();
        if (!companyId) return Response.json({ source: 'core', count: 0, items: [], error: 'tenant_not_provisioned' }, { status: 503 });

        let items = await loadCoreCatalog(companyId);
        let migrated = false;

        if (!items.length) {
          items = await migrateLegacyCatalog(companyId);
          migrated = items.length > 0;
        }

        return Response.json({
          source: 'impulsionando_core',
          syncedAt: new Date().toISOString(),
          count: items.length,
          migrated,
          items,
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
