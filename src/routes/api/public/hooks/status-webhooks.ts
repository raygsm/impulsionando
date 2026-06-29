import { createFileRoute } from '@tanstack/react-router'
import { createHmac } from 'crypto'

/**
 * Fanout cron (every 5min): dispatches incident open/resolve/update,
 * postmortem published, and maintenance window events to registered
 * webhooks (Slack / Discord / generic JSON).
 *
 * Dedup by (webhook_id, reference_key) unique index on
 * `core_status_webhook_dispatches`.
 */

const SITE = 'https://impulsionando.com.br'

type Webhook = {
  id: string
  label: string
  url: string
  kind: 'slack' | 'discord' | 'generic'
  secret: string | null
  notify_incidents: boolean
  notify_maintenance: boolean
  services: string[] | null
  active: boolean
}

type EventPayload = {
  reference_key: string
  event_kind:
    | 'incident_opened'
    | 'incident_resolved'
    | 'incident_update'
    | 'postmortem_published'
    | 'maintenance_scheduled'
    | 'maintenance_started'
    | 'maintenance_completed'
  category: 'incident' | 'maintenance'
  service_slug: string | null
  title: string
  text: string
  url: string
  severity?: string | null
}

function formatBody(kind: Webhook['kind'], ev: EventPayload): unknown {
  const heading = `*${ev.title}*`
  if (kind === 'slack') {
    return {
      text: `${heading}\n${ev.text}\n${ev.url}`,
      attachments: [
        {
          color:
            ev.category === 'incident'
              ? ev.event_kind === 'incident_resolved'
                ? '#22c55e'
                : '#ef4444'
              : '#3b82f6',
          fields: [
            { title: 'Evento', value: ev.event_kind, short: true },
            { title: 'Serviço', value: ev.service_slug ?? '—', short: true },
          ],
        },
      ],
    }
  }
  if (kind === 'discord') {
    return {
      content: `**${ev.title}**\n${ev.text}\n${ev.url}`,
      embeds: [
        {
          title: ev.title,
          description: ev.text,
          url: ev.url,
          color:
            ev.category === 'incident'
              ? ev.event_kind === 'incident_resolved'
                ? 0x22c55e
                : 0xef4444
              : 0x3b82f6,
          fields: [
            { name: 'Evento', value: ev.event_kind, inline: true },
            { name: 'Serviço', value: ev.service_slug ?? '—', inline: true },
          ],
        },
      ],
    }
  }
  // generic
  return {
    reference_key: ev.reference_key,
    event_kind: ev.event_kind,
    category: ev.category,
    service_slug: ev.service_slug,
    title: ev.title,
    text: ev.text,
    url: ev.url,
    severity: ev.severity ?? null,
    sent_at: new Date().toISOString(),
  }
}

export const Route = createFileRoute('/api/public/hooks/status-webhooks')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const sinceMs = Date.now() - 72 * 60 * 60 * 1000
        const since = new Date(sinceMs).toISOString()

        const [hooksRes, incRes, upRes, mwRes] = await Promise.all([
          supabaseAdmin
            .from('core_status_webhooks')
            .select(
              'id,label,url,kind,secret,notify_incidents,notify_maintenance,services,active',
            )
            .eq('active', true)
            .limit(200),
          supabaseAdmin
            .from('core_incidents')
            .select(
              'id,title,severity,detected_at,resolved_at,description,scope,url,postmortem_published_at,postmortem_summary',
            )
            .or(
              `detected_at.gte.${since},resolved_at.gte.${since},postmortem_published_at.gte.${since}`,
            )
            .order('detected_at', { ascending: false })
            .limit(100),
          supabaseAdmin
            .from('core_incident_updates' as any)
            .select('id,incident_id,status,body,created_at')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(300),
          supabaseAdmin
            .from('core_maintenance_windows')
            .select('id,title,description,url,starts_at,ends_at,status,updated_at')
            .or(`updated_at.gte.${since},starts_at.gte.${since}`)
            .limit(200),
        ])

        const hooks = ((hooksRes.data ?? []) as unknown) as Webhook[]
        if (hooks.length === 0) return new Response(JSON.stringify({ ok: true, dispatched: 0 }))

        const incidents = (incRes.data ?? []) as Array<{
          id: string
          title: string
          severity: string | null
          detected_at: string
          resolved_at: string | null
          description: string | null
          scope: string | null
          url: string | null
          postmortem_published_at: string | null
          postmortem_summary: string | null
        }>
        const updates = (upRes.data ?? []) as Array<{
          id: string
          incident_id: string
          status: string | null
          body: string | null
          created_at: string
        }>
        const maint = (mwRes.data ?? []) as Array<{
          id: string
          title: string
          description: string | null
          url: string | null
          starts_at: string
          ends_at: string | null
          status: string | null
          updated_at: string
        }>

        // url → public_slug
        const urls = Array.from(
          new Set(
            [
              ...incidents.map((i) => i.url),
              ...maint.map((m) => m.url),
            ].filter(Boolean) as string[],
          ),
        )
        const slugByUrl = new Map<string, string>()
        if (urls.length > 0) {
          const r = await supabaseAdmin
            .from('uptime_state')
            .select('url,public_slug')
            .in('url', urls)
          for (const row of (r.data ?? []) as Array<{ url: string; public_slug: string | null }>) {
            if (row.public_slug) slugByUrl.set(row.url, row.public_slug)
          }
        }
        const slugOf = (u: string | null): string | null => (u ? slugByUrl.get(u) ?? null : null)

        const incById = new Map(incidents.map((i) => [i.id, i]))

        const events: EventPayload[] = []

        for (const i of incidents) {
          const slug = slugOf(i.url)
          if (Date.parse(i.detected_at) >= sinceMs) {
            events.push({
              reference_key: `incident_opened:${i.id}`,
              event_kind: 'incident_opened',
              category: 'incident',
              service_slug: slug,
              severity: i.severity,
              title: `[${(i.severity ?? 'sev?').toUpperCase()}] Incidente aberto: ${i.title}`,
              text: `Escopo: ${i.scope ?? '—'} • Aberto em ${i.detected_at}\n${i.description ?? ''}`,
              url: `${SITE}/status#incident-${i.id}`,
            })
          }
          if (i.resolved_at && Date.parse(i.resolved_at) >= sinceMs) {
            events.push({
              reference_key: `incident_resolved:${i.id}`,
              event_kind: 'incident_resolved',
              category: 'incident',
              service_slug: slug,
              title: `Resolvido: ${i.title}`,
              text: `Resolvido em ${i.resolved_at}`,
              url: `${SITE}/status#incident-${i.id}`,
            })
          }
          if (i.postmortem_published_at && Date.parse(i.postmortem_published_at) >= sinceMs) {
            events.push({
              reference_key: `postmortem:${i.id}`,
              event_kind: 'postmortem_published',
              category: 'incident',
              service_slug: slug,
              title: `Postmortem publicado: ${i.title}`,
              text: i.postmortem_summary ?? '',
              url: `${SITE}/status#postmortem-${i.id}`,
            })
          }
        }
        for (const u of updates) {
          const inc = incById.get(u.incident_id)
          events.push({
            reference_key: `incident_update:${u.id}`,
            event_kind: 'incident_update',
            category: 'incident',
            service_slug: slugOf(inc?.url ?? null),
            title: `[${(u.status ?? 'update').toUpperCase()}] ${inc?.title ?? 'Atualização'}`,
            text: u.body ?? '',
            url: `${SITE}/status#incident-${u.incident_id}`,
          })
        }
        for (const m of maint) {
          const slug = slugOf(m.url)
          const startMs = Date.parse(m.starts_at)
          const endMs = m.ends_at ? Date.parse(m.ends_at) : null
          if (startMs - Date.now() <= 24 * 3600_000 && startMs > Date.now()) {
            events.push({
              reference_key: `maint_scheduled:${m.id}`,
              event_kind: 'maintenance_scheduled',
              category: 'maintenance',
              service_slug: slug,
              title: `Manutenção agendada: ${m.title}`,
              text: `Início ${m.starts_at}${m.ends_at ? ` • Fim previsto ${m.ends_at}` : ''}\n${m.description ?? ''}`,
              url: `${SITE}/status`,
            })
          }
          if (m.status === 'in_progress' && startMs >= sinceMs) {
            events.push({
              reference_key: `maint_started:${m.id}`,
              event_kind: 'maintenance_started',
              category: 'maintenance',
              service_slug: slug,
              title: `Manutenção iniciada: ${m.title}`,
              text: m.description ?? '',
              url: `${SITE}/status`,
            })
          }
          if (m.status === 'completed' && endMs && endMs >= sinceMs) {
            events.push({
              reference_key: `maint_completed:${m.id}`,
              event_kind: 'maintenance_completed',
              category: 'maintenance',
              service_slug: slug,
              title: `Manutenção concluída: ${m.title}`,
              text: `Concluída em ${m.ends_at}`,
              url: `${SITE}/status`,
            })
          }
        }

        if (events.length === 0)
          return new Response(JSON.stringify({ ok: true, dispatched: 0 }))

        // Dedup against dispatch log
        const refs = Array.from(new Set(events.map((e) => e.reference_key)))
        const hookIds = hooks.map((h) => h.id)
        const existing = await supabaseAdmin
          .from('core_status_webhook_dispatches')
          .select('webhook_id,reference_key')
          .in('webhook_id', hookIds)
          .in('reference_key', refs)
        const seen = new Set(
          ((existing.data ?? []) as Array<{ webhook_id: string; reference_key: string }>).map(
            (r) => `${r.webhook_id}::${r.reference_key}`,
          ),
        )

        let dispatched = 0
        let failed = 0
        for (const h of hooks) {
          const filter = Array.isArray(h.services) ? h.services : []
          for (const ev of events) {
            if (ev.category === 'incident' && !h.notify_incidents) continue
            if (ev.category === 'maintenance' && !h.notify_maintenance) continue
            if (filter.length > 0 && (!ev.service_slug || !filter.includes(ev.service_slug)))
              continue
            const key = `${h.id}::${ev.reference_key}`
            if (seen.has(key)) continue

            const body = formatBody(h.kind, ev)
            const json = JSON.stringify(body)
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (h.secret && h.kind === 'generic') {
              headers['X-Impulsionando-Signature'] = createHmac('sha256', h.secret)
                .update(json)
                .digest('hex')
            }
            let status = 0
            let ok = false
            let error: string | null = null
            try {
              const res = await fetch(h.url, { method: 'POST', headers, body: json })
              status = res.status
              ok = res.ok
              if (!ok) error = (await res.text()).slice(0, 500)
            } catch (e) {
              error = e instanceof Error ? e.message.slice(0, 500) : 'unknown error'
            }
            await supabaseAdmin.from('core_status_webhook_dispatches').insert({
              webhook_id: h.id,
              reference_key: ev.reference_key,
              event_kind: ev.event_kind,
              status_code: status || null,
              ok,
              error,
            })
            await supabaseAdmin
              .from('core_status_webhooks')
              .update({
                last_dispatch_at: new Date().toISOString(),
                last_status_code: status || null,
                last_error: ok ? null : error,
              })
              .eq('id', h.id)
            if (ok) dispatched++
            else failed++
          }
        }

        return new Response(JSON.stringify({ ok: true, dispatched, failed }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
