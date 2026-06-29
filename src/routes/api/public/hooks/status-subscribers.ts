import { createFileRoute } from '@tanstack/react-router'

/**
 * Cron tick (every 5min): enqueues confirmation emails for new subscribers
 * and incident/postmortem notifications for confirmed subscribers, via
 * the existing `message_outbox` (channel `email`, status `queued`).
 *
 * Dedup is enforced by `core_status_dispatch_log (subscriber_id, reference_key)`
 * unique index.
 */

type IncidentRow = {
  id: string
  title: string
  severity: string | null
  status: string | null
  started_at: string
  resolved_at: string | null
  summary: string | null
  affected_service: string | null
  postmortem_published_at: string | null
  postmortem_summary: string | null
}

type SubscriberRow = {
  id: string
  email: string
  confirm_token: string
  unsubscribe_token: string
  confirmed_at: string | null
}

const SITE = 'https://impulsionando.com.br'

function unsubFooter(unsubscribe_token: string): string {
  return `\n\n—\nGerencie sua inscrição: ${SITE}/api/public/status-unsubscribe?token=${unsubscribe_token}`
}

export const Route = createFileRoute('/api/public/hooks/status-subscribers')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

        const [{ data: subs }, { data: incidents }] = await Promise.all([
          supabaseAdmin
            .from('core_status_subscribers')
            .select('id,email,confirm_token,unsubscribe_token,confirmed_at')
            .is('unsubscribed_at', null)
            .is('bounced_at', null)
            .limit(5000),
          supabaseAdmin
            .from('core_incidents')
            .select(
              'id,title,severity,status,started_at,resolved_at,summary,affected_service,postmortem_published_at,postmortem_summary',
            )
            .or(`started_at.gte.${since},resolved_at.gte.${since},postmortem_published_at.gte.${since}`)
            .order('started_at', { ascending: false })
            .limit(50),
        ])

        const subscribers = (subs ?? []) as SubscriberRow[]
        const incidentsList = (incidents ?? []) as IncidentRow[]

        const events: Array<{
          subscriber: SubscriberRow
          incident_id: string | null
          event_kind: 'confirm' | 'incident_opened' | 'incident_resolved' | 'postmortem_published'
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

        // 2) Incident updates for confirmed subscribers
        const confirmed = subscribers.filter((x) => x.confirmed_at)
        for (const i of incidentsList) {
          const isOpened = new Date(i.started_at).getTime() >= Date.parse(since)
          const isResolved = i.resolved_at && Date.parse(i.resolved_at) >= Date.parse(since)
          const isPM = i.postmortem_published_at && Date.parse(i.postmortem_published_at) >= Date.parse(since)

          for (const s of confirmed) {
            if (isOpened) {
              events.push({
                subscriber: s,
                incident_id: i.id,
                event_kind: 'incident_opened',
                reference_key: `incident_opened:${i.id}`,
                subject: `[${(i.severity ?? 'sev?').toUpperCase()}] Incidente aberto: ${i.title}`,
                body:
                  `Um novo incidente foi aberto no Status Impulsionando.\n\nServiço: ${i.affected_service ?? '—'}\nSeveridade: ${i.severity ?? '—'}\nAberto em: ${i.started_at}\n\nResumo: ${i.summary ?? '(sem resumo)'}\n\nAcompanhe em: ${SITE}/status#incident-${i.id}` +
                  unsubFooter(s.unsubscribe_token),
              })
            }
            if (isResolved) {
              events.push({
                subscriber: s,
                incident_id: i.id,
                event_kind: 'incident_resolved',
                reference_key: `incident_resolved:${i.id}`,
                subject: `Resolvido: ${i.title}`,
                body:
                  `O incidente foi marcado como resolvido.\n\nServiço: ${i.affected_service ?? '—'}\nAberto em: ${i.started_at}\nResolvido em: ${i.resolved_at}\n\nResumo: ${i.summary ?? '—'}\n\nDetalhes: ${SITE}/status#incident-${i.id}` +
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

        // 3) Dedup against dispatch log; enqueue new ones
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
            recipient: ev.subscriber.email,
            subject: ev.subject,
            body: ev.body,
            reference_type: 'status_subscriber',
            reference_id: `${ev.subscriber.id}#${ev.reference_key}`,
            metadata: { event_kind: ev.event_kind, incident_id: ev.incident_id },
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
          enqueued,
          skipped,
        })
      },
    },
  },
})
