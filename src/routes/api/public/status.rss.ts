import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

function escapeXml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rfc822(d: string | Date): string {
  return new Date(d).toUTCString()
}

export const Route = createFileRoute('/api/public/status/rss')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const origin = `${url.protocol}//${url.host}`
        const categoryFilter = (url.searchParams.get('category') ?? '').trim()

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )

        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

        const [{ data: incidents }, { data: postmortems }, { data: uptime }] = await Promise.all([
          supabase
            .from('core_incidents')
            .select('id,title,severity,status,started_at,resolved_at,summary,affected_service')
            .gte('started_at', since)
            .order('started_at', { ascending: false })
            .limit(50),
          supabase
            .from('core_incidents')
            .select('id,title,postmortem_published_at,postmortem_summary,affected_service')
            .not('postmortem_published_at', 'is', null)
            .gte('postmortem_published_at', since)
            .order('postmortem_published_at', { ascending: false })
            .limit(50),
          supabase
            .from('uptime_state')
            .select('url,scope,category'),
        ])

        const categoryByKey = new Map<string, string>()
        for (const u of uptime ?? []) {
          const cat = (u as { category?: string | null }).category ?? 'Geral'
          if ((u as { url?: string | null }).url) categoryByKey.set(String((u as { url?: string | null }).url), cat || 'Geral')
          if ((u as { scope?: string | null }).scope) categoryByKey.set(String((u as { scope?: string | null }).scope), cat || 'Geral')
        }
        const resolveCategory = (svc: string | null | undefined) =>
          (svc && categoryByKey.get(String(svc))) || 'Geral'
        const matchesFilter = (svc: string | null | undefined) =>
          !categoryFilter || resolveCategory(svc).toLowerCase() === categoryFilter.toLowerCase()


        type Item = {
          guid: string
          title: string
          link: string
          pubDate: string
          description: string
          category: string
        }

        const items: Item[] = []

        for (const i of incidents ?? []) {
          if (!matchesFilter(i.affected_service)) continue
          const status = i.resolved_at ? 'Resolvido' : (i.status ?? 'Em andamento')
          const cat = resolveCategory(i.affected_service)
          items.push({
            guid: `incident:${i.id}:${i.resolved_at ?? i.started_at}`,
            title: `[${(i.severity ?? 'sev?').toString().toUpperCase()}] ${i.title} — ${status}`,
            link: `${origin}/status#incident-${i.id}`,
            pubDate: rfc822(i.resolved_at ?? i.started_at),
            description: [
              i.affected_service ? `Serviço: ${i.affected_service}` : '',
              `Categoria: ${cat}`,
              i.summary ?? '',
            ]
              .filter(Boolean)
              .join('\n\n'),
            category: `incident/${cat}`,
          })
        }

        for (const p of postmortems ?? []) {
          if (!matchesFilter(p.affected_service)) continue
          const cat = resolveCategory(p.affected_service)
          items.push({
            guid: `postmortem:${p.id}:${p.postmortem_published_at}`,
            title: `Postmortem: ${p.title}`,
            link: `${origin}/status#postmortem-${p.id}`,
            pubDate: rfc822(p.postmortem_published_at as string),
            description: [
              p.affected_service ? `Serviço: ${p.affected_service}` : '',
              `Categoria: ${cat}`,
              p.postmortem_summary ?? '',
            ]
              .filter(Boolean)
              .join('\n\n'),
            category: `postmortem/${cat}`,
          })
        }


        items.sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))

        const lastBuild = rfc822(items[0]?.pubDate ?? new Date())

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Impulsionando — Status &amp; Incidentes${categoryFilter ? ` — ${escapeXml(categoryFilter)}` : ''}</title>
<link>${origin}/status${categoryFilter ? `?cat=${encodeURIComponent(categoryFilter)}` : ''}</link>
<atom:link href="${origin}/api/public/status.rss${categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : ''}" rel="self" type="application/rss+xml" />
<description>Incidentes recentes e postmortems publicados do ecossistema Impulsionando${categoryFilter ? ` (categoria: ${escapeXml(categoryFilter)})` : ''}.</description>

<language>pt-BR</language>
<lastBuildDate>${lastBuild}</lastBuildDate>
${items
  .map(
    (it) => `<item>
<title>${escapeXml(it.title)}</title>
<link>${escapeXml(it.link)}</link>
<guid isPermaLink="false">${escapeXml(it.guid)}</guid>
<pubDate>${it.pubDate}</pubDate>
<category>${it.category}</category>
<description>${escapeXml(it.description)}</description>
</item>`,
  )
  .join('\n')}
</channel>
</rss>`

        return new Response(xml, {
          status: 200,
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60',
          },
        })
      },
    },
  },
})
