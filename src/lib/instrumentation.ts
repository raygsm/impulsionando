// Wrapper de instrumentação: loga JSON estruturado + envia ao Sentry em erro.
// Usa amostragem para breadcrumbs/sucesso a fim de não estourar quota.
import { logger, newCorrelationId, type LogContext } from './logger'
import { captureServerException } from './sentry.server'

const SUCCESS_SAMPLE_RATE = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1')

export async function withInstrumentation<T>(
  name: string,
  ctx: Omit<LogContext, 'correlation_id'> & { user_id?: string },
  fn: () => Promise<T>,
): Promise<T> {
  const correlation_id = newCorrelationId()
  const started = Date.now()
  const baseCtx: LogContext = { ...ctx, correlation_id, route: name }
  try {
    const result = await fn()
    if (Math.random() < SUCCESS_SAMPLE_RATE) {
      logger.info(`${name} ok`, { ...baseCtx, duration_ms: Date.now() - started })
    }
    return result
  } catch (err) {
    const duration_ms = Date.now() - started
    logger.error(`${name} failed`, { ...baseCtx, duration_ms }, err)
    // fire-and-forget — não bloqueia a resposta ao cliente
    void captureServerException(err, { ...baseCtx, duration_ms })
    throw err
  }
}
