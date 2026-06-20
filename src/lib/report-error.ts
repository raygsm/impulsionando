// Client-safe error reporter. Lazily loads Sentry only in the browser.
// Wrapped here so route files (which are server-reachable for SSR) do not
// import `*.client.ts` directly — that trips TanStack's import protection.
export function reportError(error: unknown, tags?: Record<string, string>) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dynamicImport = (s: string) => (Function('s', 'return import(s)') as any)(s)
  dynamicImport('@/lib/sentry.client')
    .then((mod: { Sentry: { captureException: (e: unknown, ctx?: unknown) => void } }) => {
      mod.Sentry.captureException(error, tags ? { tags } : undefined)
    })
    .catch(() => {
      // Swallow — Sentry is best-effort.
    })
}
