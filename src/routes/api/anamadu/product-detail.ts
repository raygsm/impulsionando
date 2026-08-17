import { createFileRoute } from '@tanstack/react-router';

const ORIGIN = 'https://www.anamadu.com.br';

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function safeProductUrl(raw: string) {
  try {
    const url = new URL(raw, ORIGIN);
    if (url.origin !== ORIGIN || !url.pathname.startsWith('/produtos/')) return null;
    return url;
  } catch {
    return null;
  }
}

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1]
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'))?.[1];
}

export const Route = createFileRoute('/api/anamadu/product-detail')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requested = new URL(request.url).searchParams.get('url') ?? '';
        const productUrl = safeProductUrl(requested);
        if (!productUrl) return Response.json({ error: 'invalid_product_url' }, { status: 400 });

        const response = await fetch(productUrl, {
          headers: {
            'user-agent': 'Impulsionando-AnaMadu-ProductDetail/1.0',
            accept: 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return Response.json({ error: 'product_unavailable' }, { status: 502 });

        const html = await response.text();
        const title = cleanText(extractMeta(html, 'og:title') ?? html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
        const metaDescription = cleanText(extractMeta(html, 'og:description') ?? extractMeta(html, 'description') ?? '');
        const descriptionBlock = html.match(/<(?:div|section)[^>]+class=["'][^"']*(?:product-description|description|js-product-description)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i)?.[1] ?? '';
        const description = cleanText(descriptionBlock) || metaDescription;
        const image = extractMeta(html, 'og:image');
        const soldOut = /esgotado|sem estoque|out of stock/i.test(cleanText(html));

        return Response.json({
          name: title || null,
          description: description || null,
          image: image || null,
          status: soldOut ? 'sold_out' : 'unknown',
          source: ORIGIN,
          fetchedAt: new Date().toISOString(),
        }, {
          headers: {
            'cache-control': 'public, max-age=300, stale-while-revalidate=1800',
            'x-content-type-options': 'nosniff',
          },
        });
      },
    },
  },
});
