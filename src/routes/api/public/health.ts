// Public health endpoint: liveness + lightweight DB readiness probe.
// Returns 200 when service + DB são alcançáveis; 503 caso contrário.
// Monitorado por /api/public/hooks/uptime-check, que alerta após
// `uptime_state.alert_after_seconds` de falha contínua.
import { createFileRoute } from '@tanstack/react-router'

const STARTED_AT = Date.now()

/** Lê a URL do backend com fallback entre nomes server-only e VITE_*. */
function readSupabaseEnv() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  return { url, key }
}

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, { ok: boolean; ms?: number; status?: number; error?: string }> = {}
        let overallOk = true

        // DB readiness via PostgREST root.
        // Consideramos "up" qualquer resposta HTTP (2xx/3xx/4xx) — só falha
        // real de rede (fetch reject / timeout) ou 5xx contam como "down".
        // Um 401 do PostgREST significa que o serviço respondeu, portanto DB ok.
        const dbStart = Date.now()
        try {
          const { url, key } = readSupabaseEnv()
          if (!url || !key) throw new Error('supabase env missing')
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 5000)
          const res = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            signal: ctrl.signal,
          })
          clearTimeout(t)
          const reachable = res.status < 500
          checks.db = { ok: reachable, ms: Date.now() - dbStart, status: res.status }
          if (!reachable) overallOk = false
        } catch (e: any) {
          overallOk = false
          checks.db = {
            ok: false,
            ms: Date.now() - dbStart,
            error: String(e?.message ?? e).slice(0, 200),
          }
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
