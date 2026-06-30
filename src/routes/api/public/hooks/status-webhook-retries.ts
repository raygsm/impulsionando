import { createFileRoute } from '@tanstack/react-router'
import { createHmac } from 'crypto'

/**
 * Cron (every 5min, offset +2min from the main tick): picks failed status
 * webhook dispatches whose `next_retry_at` is due and retries them with
 * exponential backoff (5, 15, 45min) up to webhook.max_retries.
 *
 * Strategy:
 *  - Pick up to 50 failed dispatches with next_retry_at <= now().
 *  - For each, resolve its webhook config; skip if inactive or retry_count
 *    already reached max_retries.
 *  - POST a synthetic "[RETRY n/m]" payload to the hook URL.
 *  - Insert a new dispatch row (parent_dispatch_id = original) with the new
 *    retry_count. If it still fails AND retry_count < max_retries, schedule
 *    the next attempt; otherwise leave next_retry_at NULL.
 *  - Always clear next_retry_at on the parent row so it isn't picked again.
 */

const SITE = 'https://impulsionando.com.br'
const BACKOFF_MINUTES = [5, 15, 45, 120] // index = retry_count of the *new* attempt - 1

export const Route = createFileRoute('/api/public/hooks/status-webhook-retries')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const nowIso = new Date().toISOString()

        const { data: due, error } = await supabaseAdmin
          .from('core_status_webhook_dispatches')
          .select('id,webhook_id,reference_key,event_kind,retry_count')
          .eq('ok', false)
          .not('next_retry_at', 'is', null)
          .lte('next_retry_at', nowIso)
          .limit(50)

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (!due || due.length === 0) {
          return new Response(JSON.stringify({ ok: true, retried: 0 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const hookIds = Array.from(new Set(due.map((d) => d.webhook_id)))
        const { data: hooks } = await supabaseAdmin
          .from('core_status_webhooks')
          .select('id,label,url,kind,secret,active,max_retries')
          .in('id', hookIds)
        const hookMap = new Map<string, any>((hooks ?? []).map((h: any) => [h.id, h]))

        let retried = 0
        let okCount = 0
        let failCount = 0
        let skipped = 0

        for (const d of due) {
          const hook = hookMap.get(d.webhook_id)
          // Always clear the parent's next_retry_at so it isn't re-picked
          await supabaseAdmin
            .from('core_status_webhook_dispatches')
            .update({ next_retry_at: null })
            .eq('id', d.id)

          if (!hook || !hook.active) {
            skipped++
            continue
          }
          const max = Math.max(0, Number(hook.max_retries ?? 3))
          const nextAttempt = (d.retry_count ?? 0) + 1
          if (nextAttempt > max) {
            skipped++
            continue
          }

          const sentIso = new Date().toISOString()
          const ev = {
            reference_key: d.reference_key,
            event_kind: d.event_kind,
            title: `[RETRY ${nextAttempt}/${max}] ${d.event_kind} — ${hook.label}`,
            text: `Retentativa automática do disparo ${d.id} (ref ${d.reference_key}) em ${sentIso}.`,
            url: `${SITE}/status`,
            retry: true as const,
            attempt: nextAttempt,
          }

          let body: unknown
          if (hook.kind === 'slack') body = { text: `*${ev.title}*\n${ev.text}\n${ev.url}` }
          else if (hook.kind === 'discord') body = { content: `**${ev.title}**\n${ev.text}\n${ev.url}` }
          else body = { ...ev, sent_at: sentIso }

          const json = JSON.stringify(body)
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (hook.secret && hook.kind === 'generic') {
            headers['X-Impulsionando-Signature'] = createHmac('sha256', hook.secret)
              .update(json)
              .digest('hex')
            headers['X-Impulsionando-Retry'] = String(nextAttempt)
          }

          let status = 0
          let ok = false
          let err: string | null = null
          try {
            const res = await fetch(hook.url, { method: 'POST', headers, body: json })
            status = res.status
            ok = res.ok
            if (!ok) err = (await res.text()).slice(0, 500)
          } catch (e) {
            err = e instanceof Error ? e.message.slice(0, 500) : 'unknown error'
          }
          retried++
          if (ok) okCount++
          else failCount++

          const stillRetryable = !ok && nextAttempt < max
          const backoffMin = BACKOFF_MINUTES[Math.min(nextAttempt, BACKOFF_MINUTES.length - 1)]
          const newNextRetryAt = stillRetryable
            ? new Date(Date.now() + backoffMin * 60_000).toISOString()
            : null

          await supabaseAdmin.from('core_status_webhook_dispatches').insert({
            webhook_id: hook.id,
            reference_key: `${d.reference_key}:retry:${nextAttempt}`,
            event_kind: d.event_kind,
            status_code: status || null,
            ok,
            error: err,
            retry_count: nextAttempt,
            next_retry_at: newNextRetryAt,
            parent_dispatch_id: d.id,
          })

          await supabaseAdmin
            .from('core_status_webhooks')
            .update({
              last_dispatch_at: sentIso,
              last_status_code: status || null,
              last_error: ok ? null : err,
            })
            .eq('id', hook.id)
        }

        return new Response(
          JSON.stringify({ ok: true, retried, okCount, failCount, skipped }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
