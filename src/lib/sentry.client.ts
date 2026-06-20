// Sentry initialization for the React frontend.
// No-op when VITE_SENTRY_DSN is not set.
import * as Sentry from '@sentry/react'

let initialized = false

export function initSentryClient() {
  if (initialized) return
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return
  Sentry.init({
    dsn,
    release: (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ?? 'unknown',
    environment: (import.meta.env.MODE as string | undefined) ?? 'production',
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false,
  })
  initialized = true
}

export { Sentry }
