// Health check para o motor de monetização e webhook do Mercado Pago.
// Lê core_monetization_models (RLS friendly via publishable key + policy de leitura
// pública seria necessária — aqui usamos service-role para checagem operacional).
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/health/monetization')({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now()
        const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {}
        let overallOk = true

        // 1) DB readiness — usa admin para query trivial em core_monetization_models
        const dbStart = Date.now()
        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { error } = await supabaseAdmin
            .from('core_monetization_models')
            .select('id', { count: 'exact', head: true })
            .limit(1)
          if (error) throw error
          checks.monetization_db = { ok: true, ms: Date.now() - dbStart }
        } catch (e: any) {
          overallOk = false
          checks.monetization_db = { ok: false, ms: Date.now() - dbStart, error: String(e?.message ?? e).slice(0, 200) }
        }

        // 2) Webhook reachability — HEAD no endpoint da função edge mpago-webhook
        const whStart = Date.now()
        try {
          const url = process.env.SUPABASE_URL
          if (!url) throw new Error('SUPABASE_URL missing')
          const fnUrl = url.replace('.supabase.co', '.functions.supabase.co') + '/mpago-webhook'
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 5000)
          const res = await fetch(fnUrl, { method: 'OPTIONS', signal: ctrl.signal })
          clearTimeout(t)
          checks.mpago_webhook = { ok: res.status < 500, ms: Date.now() - whStart }
          if (res.status >= 500) overallOk = false
        } catch (e: any) {
          overallOk = false
          checks.mpago_webhook = { ok: false, ms: Date.now() - whStart, error: String(e?.message ?? e).slice(0, 200) }
        }

        return new Response(
          JSON.stringify({
            status: overallOk ? 'ok' : 'degraded',
            service: 'impulsionando-monetization',
            release: process.env.SENTRY_RELEASE ?? 'unknown',
            elapsed_ms: Date.now() - started,
            ts: new Date().toISOString(),
            checks,
          }),
          {
            status: overallOk ? 200 : 503,
            headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
          },
        )
      },
      HEAD: async () => new Response(null, { status: 200 }),
    },
  },
})
