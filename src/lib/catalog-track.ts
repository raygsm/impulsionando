/**
 * Client-side debounced, deduped, batched tracker for catalog events.
 * Reduces noise from rapid repeated clicks and cuts request volume.
 *
 * Counters are surfaced periodically as a `tracker_stats` event so admins
 * can see how many clicks were deduped/dropped (KPI quality signal).
 */
import { trackCatalogEvent, trackCatalogEventsBatch } from '@/lib/catalogo.functions'

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
const STATS_FLUSH_MS = 30_000 // emit tracker_stats every 30s of activity

const queue: CatalogEvent[] = []
const lastSent = new Map<string, number>()
let timer: ReturnType<typeof setTimeout> | null = null
let statsTimer: ReturnType<typeof setTimeout> | null = null
let installedListeners = false

// Counters (reset after each tracker_stats emission)
const counters = { attempted: 0, sent: 0, deduped: 0, dropped: 0, batches: 0 }

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

function scheduleStats() {
  if (statsTimer) return
  statsTimer = setTimeout(() => {
    statsTimer = null
    void emitStats()
  }, STATS_FLUSH_MS)
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
    counters.sent += batch.length
    counters.batches += 1
  } catch {
    counters.dropped += batch.length
  }
  if (queue.length > 0) schedule()
}

async function emitStats() {
  if (counters.attempted === 0) return
  const snapshot = { ...counters }
  counters.attempted = 0
  counters.sent = 0
  counters.deduped = 0
  counters.dropped = 0
  counters.batches = 0
  try {
    await trackCatalogEvent({
      data: {
        eventName: 'tracker_stats',
        metadata: snapshot as unknown as Record<string, unknown>,
      },
    })
  } catch {
    /* stats are best-effort */
  }
}

function installListeners() {
  if (installedListeners || typeof window === 'undefined') return
  installedListeners = true
  const onHide = () => {
    void flush()
    void emitStats()
  }
  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide()
  })
}

export function trackCatalog(event: CatalogEvent) {
  installListeners()
  counters.attempted += 1
  const sig = signature(event)
  const now = Date.now()
  const prev = lastSent.get(sig)
  if (prev && now - prev < DEDUPE_MS) {
    counters.deduped += 1
    return
  }
  lastSent.set(sig, now)
  queue.push(event)
  scheduleStats()
  if (queue.length >= MAX_BATCH) {
    void flush()
  } else {
    schedule()
  }
}

export function flushCatalogTracker() {
  return flush()
}

/** Test/debug only — returns a copy of in-memory counters. */
export function _peekTrackerCounters() {
  return { ...counters }
}
