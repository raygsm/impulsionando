import { createFileRoute } from '@tanstack/react-router'

/**
 * Cron tick (every 5min): enqueues confirmation emails for new subscribers
 * and incident/postmortem/update notifications for confirmed subscribers,
 * via the existing `message_outbox` (channel `email`, status `queued`).
 *
 * Dedup is enforced by `core_status_dispatch_log (subscriber_id, reference_key)`
 * unique index.
 */

type IncidentRow = {
  id: string
  title: string
  severity: string | null
  status: string | null
  detected_at: string
  resolved_at: string | null
  description: string | null
  scope: string | null
  url: string | null
  postmortem_published_at: string | null
  postmortem_summary: string | null
}

type IncidentUpdateRow = {
  id: string
  incident_id: string
  status: string | null
  body: string | null
  created_at: string
}

type SubscriberRow = {
  id: string
  email: string
  confirm_token: string
  unsubscribe_token: string
  confirmed_at: string | null
  categories: string[] | null
  min_severity: string | null
}

const SEVERITY_RANK: Record<string, number> = { info: 0, minor: 1, major: 2, critical: 3 }
function severityAllowed(sub: SubscriberRow, sev: string | null): boolean {
  const threshold = SEVERITY_RANK[(sub.min_severity ?? 'info').toLowerCase()] ?? 0
  if (threshold === 0) return true
  const incRank = SEVERITY_RANK[(sev ?? 'info').toLowerCase()] ?? 0
  return incRank >= threshold
}

const SITE = 'https://impulsionando.com.br'

function unsubFooter(unsubscribe_token: string): string {
  return `\n\n—\nPreferências de notificação: ${SITE}/api/public/status-preferences?token=${unsubscribe_token}\nCancelar inscrição: ${SITE}/api/public/status-unsubscribe?token=${unsubscribe_token}`
}

export const Route = createFileRoute('/api/public/hooks/status-subscribers')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
        const sinceMs = Date.parse(since)

        const [subsRes, incRes] = await Promise.all([
          supabaseAdmin
            .from('core_status_subscribers')
            .select('id,email,confirm_token,unsubscribe_token,confirmed_at,notify_incidents,categories,min_severity')
            .is('unsubscribed_at', null)
            .is('bounced_at', null)
            .neq('notify_incidents', false)
            .limit(5000),
          supabaseAdmin
            .from('core_incidents')
            .select(
              'id,title,severity,status,detected_at,resolved_at,description,scope,url,postmortem_published_at,postmortem_summary',
            )
            .or(`detected_at.gte.${since},resolved_at.gte.${since},postmortem_published_at.gte.${since}`)
            .order('detected_at', { ascending: false })
            .limit(50),
        ])

        const subscribers = (subsRes.data ?? []) as unknown as SubscriberRow[]
        const incidentsList = (incRes.data ?? []) as unknown as IncidentRow[]

        // Fetch recent incident updates (last 72h) for all listed incidents
        const incIds = incidentsList.map((i) => i.id)
        let updatesList: IncidentUpdateRow[] = []
        if (incIds.length > 0) {
          const upRes = await supabaseAdmin
            .from('core_incident_updates' as any)
            .select('id,incident_id,status,body,created_at')
            .in('incident_id', incIds)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(500)
          updatesList = ((upRes.data ?? []) as unknown) as IncidentUpdateRow[]
        }
        const incidentById = new Map(incidentsList.map((i) => [i.id, i]))

        // Resolve service slug per incident (via uptime_state.url)
        const urls = Array.from(new Set(incidentsList.map((i) => i.url).filter(Boolean) as string[]))
        const slugByUrl = new Map<string, string>()
        const categoryBySlug = new Map<string, string>()
        if (urls.length > 0) {
          const slugRes = await supabaseAdmin
            .from('uptime_state')
            .select('url,public_slug,category')
            .in('url', urls)
          for (const r of (slugRes.data ?? []) as Array<{
            url: string
            public_slug: string | null
            category: string | null
          }>) {
            if (r.public_slug) {
              slugByUrl.set(r.url, r.public_slug)
              if (r.category) categoryBySlug.set(r.public_slug, r.category)
            }
          }
        }
        const slugForIncident = (id: string): string | null => {
          const inc = incidentById.get(id)
          if (!inc?.url) return null
          return slugByUrl.get(inc.url) ?? null
        }
        const categoryForIncident = (id: string): string | null => {
          const slug = slugForIncident(id)
          return slug ? categoryBySlug.get(slug) ?? null : null
        }

        // Subscriber service filters: subscriber_id -> set of slugs (empty set = all)
        const subIds = subscribers.map((s) => s.id)
        const filterBySub = new Map<string, Set<string>>()
        if (subIds.length > 0) {
          const filtRes = await supabaseAdmin
            .from('core_status_subscriber_services' as any)
            .select('subscriber_id,service_slug')
            .in('subscriber_id', subIds)
          for (const r of ((filtRes.data ?? []) as unknown) as Array<{ subscriber_id: string; service_slug: string }>) {
            const set = filterBySub.get(r.subscriber_id) ?? new Set<string>()
            set.add(r.service_slug)
            filterBySub.set(r.subscriber_id, set)
          }
        }
        const subscriberWantsService = (subId: string, slug: string | null): boolean => {
          const filter = filterBySub.get(subId)
          if (!filter || filter.size === 0) return true // no filter = receives everything
          if (!slug) return false // incident without resolvable slug → skip filtered subs
          return filter.has(slug)
        }
        const subscriberWantsCategory = (sub: SubscriberRow, cat: string | null): boolean => {
          const cats = Array.isArray(sub.categories) ? sub.categories : []
          if (cats.length === 0) return true
          if (!cat) return false
          return cats.includes(cat)
        }


        const events: Array<{
          subscriber: SubscriberRow
          incident_id: string | null
          event_kind:
            | 'confirm'
            | 'incident_opened'
            | 'incident_resolved'
            | 'incident_update'
            | 'postmortem_published'
          reference_key: string
          subject: string
          body: string
        }> = []

        // 1) Confirmation emails for new (unconfirmed) subscribers
        for (const s of subscribers.filter((x) => !x.confirmed_at)) {
          events.push({
            subscriber: s,
            incident_id: null,
            event_kind: 'confirm',
            reference_key: `confirm:${s.confirm_token}`,
            subject: 'Confirme sua inscrição no Status Impulsionando',
            body:
              `Olá,\n\nClique no link abaixo para confirmar sua inscrição e receber notificações de incidentes e postmortems do ecossistema Impulsionando:\n\n${SITE}/api/public/status-confirm?token=${s.confirm_token}\n\nSe você não solicitou esta inscrição, ignore este email.` +
              unsubFooter(s.unsubscribe_token),
          })
        }

        // 2) Incident open/resolve/postmortem for confirmed subscribers
        const confirmed = subscribers.filter((x) => x.confirmed_at)
        for (const i of incidentsList) {
          const isOpened = Date.parse(i.detected_at) >= sinceMs
          const isResolved = i.resolved_at ? Date.parse(i.resolved_at) >= sinceMs : false
          const isPM = i.postmortem_published_at ? Date.parse(i.postmortem_published_at) >= sinceMs : false
          const scope = i.scope ?? '—'
          const slug = slugForIncident(i.id)
          const cat = categoryForIncident(i.id)

          for (const s of confirmed) {
            if (!subscriberWantsService(s.id, slug)) continue
            if (!subscriberWantsCategory(s, cat)) continue
            if (isOpened && severityAllowed(s, i.severity)) {
              events.push({
                subscriber: s,
                incident_id: i.id,
                event_kind: 'incident_opened',
                reference_key: `incident_opened:${i.id}`,
                subject: `[${(i.severity ?? 'sev?').toString().toUpperCase()}] Incidente aberto: ${i.title}`,
                body:
                  `Um novo incidente foi aberto no Status Impulsionando.\n\nEscopo: ${scope}\nSeveridade: ${i.severity ?? '—'}\nAberto em: ${i.detected_at}\n\nResumo: ${i.description ?? '(sem descrição)'}\n\nAcompanhe em: ${SITE}/status#incident-${i.id}` +
                  unsubFooter(s.unsubscribe_token),
              })
            }
            if (isResolved && severityAllowed(s, i.severity)) {
              events.push({
                subscriber: s,
                incident_id: i.id,
                event_kind: 'incident_resolved',
                reference_key: `incident_resolved:${i.id}`,
                subject: `Resolvido: ${i.title}`,
                body:
                  `O incidente foi marcado como resolvido.\n\nEscopo: ${scope}\nAberto em: ${i.detected_at}\nResolvido em: ${i.resolved_at}\n\nResumo: ${i.description ?? '—'}\n\nDetalhes: ${SITE}/status#incident-${i.id}` +
                  unsubFooter(s.unsubscribe_token),
              })
            }
            if (isPM) {
              events.push({
                subscriber: s,
                incident_id: i.id,
                event_kind: 'postmortem_published',
                reference_key: `postmortem:${i.id}`,
                subject: `Postmortem publicado: ${i.title}`,
                body:
                  `Um postmortem foi publicado.\n\n${i.postmortem_summary ?? ''}\n\nLeia em: ${SITE}/status#postmortem-${i.id}` +
                  unsubFooter(s.unsubscribe_token),
              })
            }
          }
        }

        // 3) Incident timeline updates (last 72h)
        for (const u of updatesList) {
          const inc = incidentById.get(u.incident_id)
          const title = inc?.title ?? 'Incidente'
          const scope = inc?.scope ?? '—'
          const statusLabel = (u.status ?? 'update').toString().toUpperCase()
          const slug = slugForIncident(u.incident_id)
          const cat = categoryForIncident(u.incident_id)
          for (const s of confirmed) {
            if (!subscriberWantsService(s.id, slug)) continue
            if (!subscriberWantsCategory(s, cat)) continue
            if (!severityAllowed(s, inc?.severity ?? null)) continue
            events.push({
              subscriber: s,
              incident_id: u.incident_id,
              event_kind: 'incident_update',
              reference_key: `incident_update:${u.id}`,
              subject: `[${statusLabel}] Atualização: ${title}`,
              body:
                `Nova atualização sobre o incidente.\n\nEscopo: ${scope}\nStatus: ${u.status ?? '—'}\nQuando: ${u.created_at}\n\n${u.body ?? '(sem detalhes)'}\n\nTimeline: ${SITE}/status#incident-${u.incident_id}` +
                unsubFooter(s.unsubscribe_token),
            })
          }
        }

        // 4) Dedup against dispatch log; enqueue new ones
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

          const { error: outboxErr } = await supabaseAdmin.from('message_outbox').insert({
            channel: 'email',
            status: 'queued',
            event_code: `status.${ev.event_kind}`,
            recipient_email: ev.subscriber.email,
            subject: ev.subject,
            body: ev.body,
            reference_type: 'status_subscriber',
            reference_id: `${ev.subscriber.id}#${ev.reference_key}`,
            payload: { event_kind: ev.event_kind, incident_id: ev.incident_id },
          })
          if (outboxErr) continue

          await supabaseAdmin.from('core_status_dispatch_log').insert({
            subscriber_id: ev.subscriber.id,
            incident_id: ev.incident_id,
            event_kind: ev.event_kind,
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
          subscribers: subscribers.length,
          incidents: incidentsList.length,
          updates: updatesList.length,
          enqueued,
          skipped,
        })
      },
    },
  },
})
