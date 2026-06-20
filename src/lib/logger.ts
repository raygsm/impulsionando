// Structured JSON logger for backend (server functions + server routes).
// Emits a single JSON line per record so logs are queryable in any
// aggregator. Includes correlation_id, route, method, user_id when set.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  correlation_id?: string
  route?: string
  method?: string
  user_id?: string
  company_id?: string
  status?: number
  duration_ms?: number
  [key: string]: unknown
}

function emit(level: LogLevel, msg: string, ctx?: LogContext, err?: unknown) {
  const record: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: 'impulsionando',
    release: (typeof process !== 'undefined' && process.env?.SENTRY_RELEASE) || 'unknown',
    ...ctx,
  }
  if (err) {
    const e = err as { message?: string; stack?: string; name?: string }
    record.error = {
      name: e?.name,
      message: e?.message ?? String(err),
      stack: e?.stack,
    }
  }
  const line = JSON.stringify(record)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext, err?: unknown) => emit('warn', msg, ctx, err),
  error: (msg: string, ctx?: LogContext, err?: unknown) => emit('error', msg, ctx, err),
}

export function newCorrelationId(): string {
  try {
    return (globalThis.crypto as Crypto).randomUUID()
  } catch {
    return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  }
}
