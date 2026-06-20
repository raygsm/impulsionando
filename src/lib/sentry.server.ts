// Lightweight Sentry envelope sender for the Cloudflare Worker runtime.
// We avoid @sentry/node (Node-only) and post directly to Sentry's HTTP API.
// No-op when SENTRY_DSN is not set.
import { logger } from './logger'

interface ParsedDsn {
  host: string
  projectId: string
  publicKey: string
  protocol: string
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    return { protocol: u.protocol.replace(':', ''), host: u.host, projectId, publicKey: u.username }
  } catch {
    return null
  }
}

function release(): string {
  return process.env.SENTRY_RELEASE ?? process.env.GIT_SHA ?? 'unknown'
}

function environment(): string {
  return process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production'
}

export interface CaptureContext {
  correlation_id?: string
  route?: string
  method?: string
  user_id?: string
  [key: string]: unknown
}

export async function captureServerException(err: unknown, ctx: CaptureContext = {}) {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  const parsed = parseDsn(dsn)
  if (!parsed) return

  const error = err as { name?: string; message?: string; stack?: string }
  const event = {
    event_id: (globalThis.crypto as Crypto).randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    release: release(),
    environment: environment(),
    server_name: 'impulsionando-worker',
    transaction: ctx.route,
    user: ctx.user_id ? { id: ctx.user_id } : undefined,
    tags: {
      route: ctx.route,
      method: ctx.method,
      correlation_id: ctx.correlation_id,
    },
    extra: ctx,
    exception: {
      values: [
        {
          type: error?.name ?? 'Error',
          value: error?.message ?? String(err),
          stacktrace: error?.stack ? { frames: parseStack(error.stack) } : undefined,
        },
      ],
    },
  }

  const endpoint = `${parsed.protocol}://${parsed.host}/api/${parsed.projectId}/envelope/`
  const envelopeHeader = JSON.stringify({
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    dsn,
  })
  const itemHeader = JSON.stringify({ type: 'event', content_type: 'application/json' })
  const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-sentry-envelope',
        'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=impulsionando-edge/1.0`,
      },
      body,
    })
  } catch (e) {
    logger.warn('sentry: capture failed', { correlation_id: ctx.correlation_id }, e)
  }
}

function parseStack(stack: string) {
  return stack
    .split('\n')
    .slice(1, 30)
    .map((line) => {
      const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/)
      if (!m) return { function: line.trim() }
      return { function: m[1] ?? '?', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) }
    })
    .reverse()
}
