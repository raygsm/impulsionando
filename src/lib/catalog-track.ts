/**
 * Client-side debounced, deduped, batched tracker for catalog events.
 * Reduces noise from rapid repeated clicks and cuts request volume.
 *
 * Usage:
 *   const track = useCatalogTracker()
 *   track({ eventName: 'select_module', ... })
 *
 * - Identical events fired within DEDUPE_MS are coalesced (one row only).
 * - Buffered events flush every FLUSH_MS or when MAX_BATCH is reached.
 * - flush() on pagehide/visibilitychange guarantees delivery.
 */
import { trackCatalogEventsBatch } from '@/lib/catalogo.functions'

export type CatalogEvent = {
  eventName: string
  macroSlug?: string | null
  subnichoSlug?: string | null
  planTier?: string | null
  selectedModules?: string[]
  intentId?: string | null
  sessionToken?: string | null
  metadata?: Record<string, unknown>
}

const FLUSH_MS = 1500
const DEDUPE_MS = 800
const MAX_BATCH = 25

const queue: CatalogEvent[] = []
const lastSent = new Map<string, number>()
let timer: ReturnType<typeof setTimeout> | null = null
let installedListeners = false

function signature(e: CatalogEvent) {
  return [
    e.eventName,
    e.macroSlug ?? '',
    e.subnichoSlug ?? '',
    e.planTier ?? '',
    (e.selectedModules ?? []).join(','),
    e.intentId ?? '',
  ].join('|')
}

function schedule() {
  if (timer) return
  timer = setTimeout(flush, FLUSH_MS)
}

async function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (queue.length === 0) return
  const batch = queue.splice(0, MAX_BATCH)
  try {
    await trackCatalogEventsBatch({ data: { events: batch } })
  } catch {
    /* drop silently; tracking must never break UX */
  }
  if (queue.length > 0) schedule()
}

function installListeners() {
  if (installedListeners || typeof window === 'undefined') return
  installedListeners = true
  const onHide = () => {
    void flush()
  }
  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide()
  })
}

export function trackCatalog(event: CatalogEvent) {
  installListeners()
  const sig = signature(event)
  const now = Date.now()
  const prev = lastSent.get(sig)
  if (prev && now - prev < DEDUPE_MS) return // dedupe rapid duplicates
  lastSent.set(sig, now)
  queue.push(event)
  if (queue.length >= MAX_BATCH) {
    void flush()
  } else {
    schedule()
  }
}

export function flushCatalogTracker() {
  return flush()
}
