import { createFileRoute } from '@tanstack/react-router';

type CatalogItem = {
  name: string;
  price: number;
  priceLabel: string;
  url: string;
  image?: string;
  status: 'available' | 'sold_out' | 'unknown';
  category?: string;
};

const ORIGIN = 'https://www.anamadu.com.br';
const MAX_PAGES = 12;

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

function extractItems(html: string): CatalogItem[] {
  const chunks = html.split(/(?=<[^>]+class=["'][^"']*(?:item-product|product-item|js-item-product)[^"']*["'])/i);
  const items: CatalogItem[] = [];

  for (const chunk of chunks) {
    const href = chunk.match(/href=["']([^"']*\/produtos\/[^"'#?]+\/?)["']/i)?.[1];
    if (!href) continue;

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

    const soldOut = /esgotado|sem estoque|out of stock/i.test(cleanText(chunk));
    const price = parsePrice(priceRaw);
    if (price <= 0) continue;

    items.push({
      name,
      price,
      priceLabel: price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      url: absoluteUrl(href)!,
      image: absoluteUrl(img),
      status: soldOut ? 'sold_out' : 'available',
    });
  }

  const dedup = new Map<string, CatalogItem>();
  for (const item of items) dedup.set(item.url, item);
  return [...dedup.values()];
}

async function fetchPage(page: number) {
  const url = page === 1 ? `${ORIGIN}/produtos/` : `${ORIGIN}/produtos/page/${page}/`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Impulsionando-AnaMadu-CatalogSync/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  return extractItems(await response.text());
}

async function loadCatalog() {
  const collected = new Map<string, CatalogItem>();
  let emptyPages = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const items = await fetchPage(page).catch(() => [] as CatalogItem[]);
    if (!items.length) {
      emptyPages += 1;
      if (page > 1 && emptyPages >= 2) break;
      continue;
    }
    emptyPages = 0;
    const before = collected.size;
    for (const item of items) collected.set(item.url, item);
    if (page > 1 && collected.size === before) break;
  }

  return [...collected.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export const Route = createFileRoute('/api/anamadu/catalog')({
  server: {
    handlers: {
      GET: async () => {
        const items = await loadCatalog();
        return Response.json(
          {
            source: ORIGIN,
            syncedAt: new Date().toISOString(),
            count: items.length,
            items,
          },
          {
            headers: {
              'cache-control': 'public, max-age=300, stale-while-revalidate=1800',
              'x-content-type-options': 'nosniff',
            },
          },
        );
      },
    },
  },
});
