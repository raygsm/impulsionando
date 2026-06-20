// Public health endpoint: liveness + lightweight DB readiness probe.
// Returns 200 when service + DB are reachable; 503 otherwise.
// Monitored by /api/public/hooks/uptime-check, which alerts after
// `uptime_state.alert_after_seconds` of continuous failure.
import { createFileRoute } from '@tanstack/react-router'

const STARTED_AT = Date.now()

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {}
        let overallOk = true

        // DB readiness via PostgREST root (anon key, no schema dependency)
        const dbStart = Date.now()
        try {
          const url = process.env.SUPABASE_URL
          const key = process.env.SUPABASE_PUBLISHABLE_KEY
          if (!url || !key) throw new Error('supabase env missing')
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 5000)
          const res = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            signal: ctrl.signal,
          })
          clearTimeout(t)
          checks.db = { ok: res.ok, ms: Date.now() - dbStart }
          if (!res.ok) overallOk = false
        } catch (e: any) {
          overallOk = false
          checks.db = { ok: false, ms: Date.now() - dbStart, error: String(e?.message ?? e).slice(0, 200) }
        }

        const body = {
          status: overallOk ? 'ok' : 'degraded',
          service: 'impulsionando',
          release: process.env.SENTRY_RELEASE ?? process.env.GIT_SHA ?? 'unknown',
          uptime_ms: Date.now() - STARTED_AT,
          ts: new Date().toISOString(),
          checks,
        }

        return new Response(JSON.stringify(body), {
          status: overallOk ? 200 : 503,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
          },
        })
      },
      HEAD: async () => new Response(null, { status: 200 }),
    },
  },
})
