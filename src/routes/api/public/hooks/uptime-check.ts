import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

// Same sender constants as the transactional send route
const SITE_NAME = 'Impulsionando'
const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'

// Re-alert if site stays down for this many minutes (so we don't spam, but
// nudge again after a long outage). 0 disables re-alerts.
const REPEAT_DOWN_ALERT_MIN = 60
const HTTP_TIMEOUT_MS = 15000

type UptimeStateRow = {
  url: string
  is_up: boolean
  since: string
  last_alert_at: string | null
  consecutive_failures: number
  alert_emails: string[]
}

async function pingUrl(url: string): Promise<{ ok: boolean; status: number | null; ms: number; error: string | null }> {
  const start = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Impulsionando-Uptime/1.0' },
    })
    const ms = Date.now() - start
    return { ok: res.status >= 200 && res.status < 500, status: res.status, ms, error: null }
  } catch (e: any) {
    const ms = Date.now() - start
    return { ok: false, status: null, ms, error: (e?.message ?? String(e)).slice(0, 500) }
  } finally {
    clearTimeout(timer)
  }
}

async function enqueueAlertEmail(args: {
  templateName: 'site-down' | 'site-up'
  recipient: string
  data: Record<string, any>
}) {
  const tpl = TEMPLATES[args.templateName]
  if (!tpl) throw new Error(`Template ${args.templateName} not found`)

  const element = React.createElement(tpl.component, args.data)
  const html = await renderAsync(element)
  const text = await renderAsync(element, { plainText: true })
  const subject = typeof tpl.subject === 'function' ? tpl.subject(args.data) : tpl.subject

  const messageId = crypto.randomUUID()

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: args.templateName,
    recipient_email: args.recipient,
    status: 'pending',
  })

  const { error } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: args.recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: args.templateName,
      idempotency_key: `${args.templateName}-${args.data.url}-${args.data.detectedAt ?? args.data.recoveredAt ?? messageId}`,
      queued_at: new Date().toISOString(),
    },
  })

  if (error) {
    console.error('uptime alert: enqueue failed', error)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: args.templateName,
      recipient_email: args.recipient,
      status: 'failed',
      error_message: error.message,
    })
  }
}

export const Route = createFileRoute('/api/public/hooks/uptime-check')({
  server: {
    handlers: {
      POST: async () => {
        const { data: targets, error: stateErr } = await supabaseAdmin
          .from('uptime_state')
          .select('url, is_up, since, last_alert_at, consecutive_failures, alert_emails')

        if (stateErr || !targets) {
          console.error('uptime: failed to load state', stateErr)
          return Response.json({ ok: false, error: 'state_load_failed' }, { status: 500 })
        }

        const results: Array<{ url: string; ok: boolean; status: number | null }> = []

        for (const t of targets as UptimeStateRow[]) {
          const r = await pingUrl(t.url)
          const now = new Date()

          await supabaseAdmin.from('uptime_checks').insert({
            url: t.url,
            is_up: r.ok,
            http_status: r.status,
            response_ms: r.ms,
            error_message: r.error,
          })

          const wasUp = t.is_up
          const isUp = r.ok
          const failures = isUp ? 0 : (t.consecutive_failures ?? 0) + 1

          // Confirm a "down" only after 2 consecutive failures (avoid blips)
          const confirmedDown = !isUp && failures >= 2

          let nextIsUp = wasUp
          let nextSince = t.since
          let nextLastAlert = t.last_alert_at
          let stateChanged = false

          if (wasUp && confirmedDown) {
            nextIsUp = false
            nextSince = now.toISOString()
            stateChanged = true
            for (const email of t.alert_emails ?? []) {
              await enqueueAlertEmail({
                templateName: 'site-down',
                recipient: email,
                data: {
                  url: t.url,
                  status: r.status ? String(r.status) : 'sem resposta',
                  error: r.error ?? undefined,
                  detectedAt: now.toISOString(),
                },
              })
            }
            nextLastAlert = now.toISOString()
          } else if (!wasUp && isUp) {
            nextIsUp = true
            const downSinceMs = new Date(t.since).getTime()
            const downtimeMin = Math.max(1, Math.round((now.getTime() - downSinceMs) / 60000))
            stateChanged = true
            for (const email of t.alert_emails ?? []) {
              await enqueueAlertEmail({
                templateName: 'site-up',
                recipient: email,
                data: {
                  url: t.url,
                  downSince: t.since,
                  recoveredAt: now.toISOString(),
                  downtimeMinutes: downtimeMin,
                },
              })
            }
            nextSince = now.toISOString()
            nextLastAlert = now.toISOString()
          } else if (!wasUp && !isUp && REPEAT_DOWN_ALERT_MIN > 0) {
            // Re-alert periodically while still down
            const lastAlertMs = t.last_alert_at ? new Date(t.last_alert_at).getTime() : 0
            if (now.getTime() - lastAlertMs >= REPEAT_DOWN_ALERT_MIN * 60000) {
              for (const email of t.alert_emails ?? []) {
                await enqueueAlertEmail({
                  templateName: 'site-down',
                  recipient: email,
                  data: {
                    url: t.url,
                    status: r.status ? String(r.status) : 'sem resposta',
                    error: r.error ?? undefined,
                    detectedAt: now.toISOString(),
                  },
                })
              }
              nextLastAlert = now.toISOString()
            }
          }

          await supabaseAdmin
            .from('uptime_state')
            .update({
              is_up: nextIsUp,
              since: nextSince,
              last_check_at: now.toISOString(),
              last_alert_at: nextLastAlert,
              consecutive_failures: failures,
              last_error: r.error,
            })
            .eq('url', t.url)

          results.push({ url: t.url, ok: r.ok, status: r.status })
          if (stateChanged) {
            console.log('uptime: state change', { url: t.url, isUp: nextIsUp })
          }
        }

        return Response.json({ ok: true, results })
      },
    },
  },
})
