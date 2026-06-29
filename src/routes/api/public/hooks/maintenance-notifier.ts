import { createFileRoute } from '@tanstack/react-router'

/**
 * Cron tick (every 10min): notifies confirmed Status subscribers about
 * scheduled / in-progress / completed maintenance windows.
 *
 * Dedup via `core_status_dispatch_log (subscriber_id, reference_key)`.
 * Per-service filter respected via `core_status_subscriber_services`
 * (resolves window.url → uptime_state.public_slug).
 */

type WindowRow = {
  id: string
  title: string
  description: string | null
  scope: string | null
  url: string | null
  severity: string | null
  starts_at: string
  ends_at: string
  status: string
  published: boolean
}

type SubscriberRow = {
  id: string
  email: string
  unsubscribe_token: string
}

const SITE = 'https://impulsionando.com.br'

function unsubFooter(token: string): string {
  return `\n\n—\nPreferências de notificação: ${SITE}/api/public/status-preferences?token=${token}\nCancelar inscrição: ${SITE}/api/public/status-unsubscribe?token=${token}`
}

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return ts
  }
}

export const Route = createFileRoute('/api/public/hooks/maintenance-notifier')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const now = Date.now()
        const horizonStart = new Date(now - 6 * 60 * 60 * 1000).toISOString()
        const horizonEnd = new Date(now + 26 * 60 * 60 * 1000).toISOString()

        // Pull windows that may trigger a notice within our look-back/forward
        const { data: winRaw } = await supabaseAdmin
          .from('core_maintenance_windows')
          .select('id,title,description,scope,url,severity,starts_at,ends_at,status,published')
          .eq('published', true)
          .neq('status', 'cancelled')
          .gte('ends_at', horizonStart)
          .lte('starts_at', horizonEnd)
          .limit(200)
        const windows = (winRaw ?? []) as unknown as WindowRow[]
        if (windows.length === 0) {
          return Response.json({ ok: true, windows: 0, enqueued: 0, skipped: 0 })
        }

        // Confirmed subscribers
        const { data: subsRaw } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id,email,unsubscribe_token')
          .not('confirmed_at', 'is', null)
          .is('unsubscribed_at', null)
          .is('bounced_at', null)
          .limit(10000)
        const subscribers = (subsRaw ?? []) as unknown as SubscriberRow[]
        if (subscribers.length === 0) {
          return Response.json({ ok: true, windows: windows.length, enqueued: 0, skipped: 0 })
        }

        // Resolve slug per window URL
        const urls = Array.from(new Set(windows.map((w) => w.url).filter(Boolean) as string[]))
        const slugByUrl = new Map<string, string>()
        if (urls.length > 0) {
          const r = await supabaseAdmin.from('uptime_state').select('url,public_slug').in('url', urls)
          for (const row of (r.data ?? []) as Array<{ url: string; public_slug: string | null }>) {
            if (row.public_slug) slugByUrl.set(row.url, row.public_slug)
          }
        }
        const slugFor = (w: WindowRow): string | null => (w.url ? slugByUrl.get(w.url) ?? null : null)

        // Per-subscriber service filter
        const subIds = subscribers.map((s) => s.id)
        const filterBySub = new Map<string, Set<string>>()
        const fr = await supabaseAdmin
          .from('core_status_subscriber_services' as any)
          .select('subscriber_id,service_slug')
          .in('subscriber_id', subIds)
        for (const r of ((fr.data ?? []) as unknown) as Array<{ subscriber_id: string; service_slug: string }>) {
          const s = filterBySub.get(r.subscriber_id) ?? new Set<string>()
          s.add(r.service_slug)
          filterBySub.set(r.subscriber_id, s)
        }
        const wants = (subId: string, slug: string | null): boolean => {
          const f = filterBySub.get(subId)
          if (!f || f.size === 0) return true
          if (!slug) return false
          return f.has(slug)
        }

        type Event = {
          subscriber: SubscriberRow
          window_id: string
          phase: 'scheduled' | 'started' | 'completed'
          reference_key: string
          subject: string
          body: string
        }
        const events: Event[] = []

        for (const w of windows) {
          const startsMs = Date.parse(w.starts_at)
          const endsMs = Date.parse(w.ends_at)
          const slug = slugFor(w)
          const scopeLabel = slug ?? w.scope ?? 'platform'
          const sev = (w.severity ?? 'info').toUpperCase()

          // Phase: scheduled (24h lead time, while still not started)
          const isLeadTime = startsMs > now && startsMs - now <= 24 * 60 * 60 * 1000
          // Phase: started (in_progress OR window has started but not ended)
          const isStarted = (w.status === 'in_progress') || (startsMs <= now && endsMs > now)
          // Phase: completed (within last 6h)
          const isCompleted =
            (w.status === 'completed' && endsMs >= now - 6 * 60 * 60 * 1000) ||
            (endsMs <= now && endsMs >= now - 6 * 60 * 60 * 1000)

          for (const s of subscribers) {
            if (!wants(s.id, slug)) continue
            const footer = unsubFooter(s.unsubscribe_token)
            if (isLeadTime) {
              events.push({
                subscriber: s,
                window_id: w.id,
                phase: 'scheduled',
                reference_key: `maintenance_scheduled:${w.id}`,
                subject: `[Manutenção ${sev}] Agendada: ${w.title}`,
                body:
                  `Uma janela de manutenção está agendada.\n\nServiço/escopo: ${scopeLabel}\nInício: ${fmt(w.starts_at)}\nTérmino previsto: ${fmt(w.ends_at)}\n\n${w.description ?? '(sem descrição)'}\n\nDetalhes: ${SITE}/status` +
                  footer,
              })
            }
            if (isStarted) {
              events.push({
                subscriber: s,
                window_id: w.id,
                phase: 'started',
                reference_key: `maintenance_started:${w.id}`,
                subject: `[Manutenção ${sev}] Em andamento: ${w.title}`,
                body:
                  `A janela de manutenção começou.\n\nServiço/escopo: ${scopeLabel}\nInício: ${fmt(w.starts_at)}\nTérmino previsto: ${fmt(w.ends_at)}\n\n${w.description ?? ''}\n\nAcompanhe: ${SITE}/status` +
                  footer,
              })
            }
            if (isCompleted) {
              events.push({
                subscriber: s,
                window_id: w.id,
                phase: 'completed',
                reference_key: `maintenance_completed:${w.id}`,
                subject: `[Manutenção] Concluída: ${w.title}`,
                body:
                  `A janela de manutenção foi concluída.\n\nServiço/escopo: ${scopeLabel}\nTérmino: ${fmt(w.ends_at)}\n\nObrigado pela paciência.\n\n${SITE}/status` +
                  footer,
              })
            }
          }
        }

        let enqueued = 0
        let skipped = 0
        for (const ev of events) {
          const { data: existing } = await supabaseAdmin
            .from('core_status_dispatch_log')
            .select('id')
            .eq('subscriber_id', ev.subscriber.id)
            .eq('reference_key', ev.reference_key)
            .maybeSingle()
          if (existing) { skipped++; continue }

          const { error: outErr } = await supabaseAdmin.from('message_outbox').insert({
            channel: 'email',
            status: 'queued',
            event_code: `status.maintenance_${ev.phase}`,
            recipient_email: ev.subscriber.email,
            subject: ev.subject,
            body: ev.body,
            reference_type: 'status_subscriber',
            reference_id: `${ev.subscriber.id}#${ev.reference_key}`,
            payload: { window_id: ev.window_id, phase: ev.phase },
          })
          if (outErr) continue

          await supabaseAdmin.from('core_status_dispatch_log').insert({
            subscriber_id: ev.subscriber.id,
            incident_id: null,
            event_kind: `maintenance_${ev.phase}`,
            reference_key: ev.reference_key,
            delivered_at: new Date().toISOString(),
          })
          await supabaseAdmin
            .from('core_status_subscribers')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', ev.subscriber.id)
          enqueued++
        }

        return Response.json({
          ok: true,
          windows: windows.length,
          subscribers: subscribers.length,
          enqueued,
          skipped,
        })
      },
    },
  },
})
