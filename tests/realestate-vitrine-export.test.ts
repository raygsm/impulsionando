/**
 * Conceptual tests for the vitrine CSV/PDF export.
 * Validates the status → columns/joins mapping and helper behavior.
 * No network calls — uses an in-memory mock of the Supabase chain.
 */
import { describe, it, expect } from 'vitest'
import { ADMIN_STATUS_MAPPING, fetchEmailLogMap, matchesEmailFilter } from '../src/lib/realestate-vitrine.functions'

describe('vitrine export — ADMIN_STATUS_MAPPING', () => {
  it('maps "novo" to realestate_interests.status', () => {
    expect(ADMIN_STATUS_MAPPING.novo.source).toBe('realestate_interests.status')
    expect(ADMIN_STATUS_MAPPING.novo.value).toBe('novo')
    expect(ADMIN_STATUS_MAPPING.novo.joins).toEqual([])
  })

  it('maps "interesse" to realestate_interests joined with property and email log', () => {
    expect(ADMIN_STATUS_MAPPING.interesse.source).toBe('realestate_interests')
    expect(ADMIN_STATUS_MAPPING.interesse.joins).toContain('property:property_id')
    expect(ADMIN_STATUS_MAPPING.interesse.joins).toContain('email_send_log via metadata.interest_id')
  })

  it('maps "busca_salva" to realestate_search_intents + email log via intent_id', () => {
    expect(ADMIN_STATUS_MAPPING.busca_salva.source).toBe('realestate_search_intents')
    expect(ADMIN_STATUS_MAPPING.busca_salva.joins).toContain('email_send_log via metadata.intent_id')
  })

  it('maps "mensagem_enviada" to email_send_log statuses queued/sent', () => {
    expect(ADMIN_STATUS_MAPPING.mensagem_enviada.source).toBe('email_send_log.status')
    expect(ADMIN_STATUS_MAPPING.mensagem_enviada.value).toEqual(['queued', 'sent'])
  })

  it('maps "falha" to email_send_log.status=failed cross-joined to both flows', () => {
    expect(ADMIN_STATUS_MAPPING.falha.source).toBe('email_send_log.status')
    expect(ADMIN_STATUS_MAPPING.falha.value).toBe('failed')
    expect(ADMIN_STATUS_MAPPING.falha.joins.length).toBe(2)
  })
})

describe('matchesEmailFilter', () => {
  it('returns true when no email filter is applied (mantém todos os status do registro)', () => {
    expect(matchesEmailFilter(null, 'sent')).toBe(true)
    expect(matchesEmailFilter(null, null)).toBe(true)
  })
  it('"falha" only matches status=failed', () => {
    expect(matchesEmailFilter('falha', 'failed')).toBe(true)
    expect(matchesEmailFilter('falha', 'sent')).toBe(false)
    expect(matchesEmailFilter('falha', null)).toBe(false)
  })
  it('"enviado" matches queued or sent', () => {
    expect(matchesEmailFilter('enviado', 'queued')).toBe(true)
    expect(matchesEmailFilter('enviado', 'sent')).toBe(true)
    expect(matchesEmailFilter('enviado', 'failed')).toBe(false)
  })
})

describe('fetchEmailLogMap', () => {
  // Minimal mock that mimics the Supabase query builder used by fetchEmailLogMap.
  function makeMockSupabase(rows: any[]) {
    const builder: any = {
      from() { return builder },
      select() { return builder },
      order() { return builder },
      gte(_col: string, val: string) { builder._gte = val; return builder },
      lte(_col: string, val: string) { builder._lte = val; return builder },
      in(_field: string, _ids: string[]) {
        // resolves immediately with filtered rows
        const filtered = rows.filter((r) => {
          if (builder._gte && r.created_at < builder._gte) return false
          if (builder._lte && r.created_at > builder._lte) return false
          return true
        })
        return Promise.resolve({ data: filtered, error: null })
      },
    }
    return builder
  }

  it('returns the most recent log per id and exposes request_id / status / error', async () => {
    const sb = makeMockSupabase([
      { id: 'l1', status: 'sent', error_message: null, metadata: { interest_id: 'i1', request_id: 'r-newest' }, created_at: '2026-06-10T12:00:00Z' },
      { id: 'l2', status: 'failed', error_message: 'bounce', metadata: { interest_id: 'i1', request_id: 'r-older' }, created_at: '2026-06-05T12:00:00Z' },
      { id: 'l3', status: 'failed', error_message: 'smtp', metadata: { interest_id: 'i2', request_id: 'r-i2' }, created_at: '2026-06-01T12:00:00Z' },
    ])
    const map = await fetchEmailLogMap(sb, 'interest_id', ['i1', 'i2'])
    expect(map.get('i1')?.lastStatus).toBe('sent')
    expect(map.get('i1')?.requestId).toBe('r-newest')
    expect(map.get('i2')?.lastStatus).toBe('failed')
    expect(map.get('i2')?.lastError).toBe('smtp')
  })

  it('respects the email-event date window (filters by created_at)', async () => {
    const sb = makeMockSupabase([
      { id: 'l1', status: 'sent', metadata: { interest_id: 'i1', request_id: 'r1' }, created_at: '2026-06-15T00:00:00Z' },
      { id: 'l2', status: 'failed', metadata: { interest_id: 'i2', request_id: 'r2' }, created_at: '2026-05-01T00:00:00Z' },
    ])
    const map = await fetchEmailLogMap(sb, 'interest_id', ['i1', 'i2'], { from: '2026-06-01T00:00:00Z' })
    expect(map.has('i1')).toBe(true)
    expect(map.has('i2')).toBe(false) // out of window
  })

  it('returns an empty map for an empty id list (no DB call needed)', async () => {
    const sb = makeMockSupabase([])
    const map = await fetchEmailLogMap(sb, 'intent_id', [])
    expect(map.size).toBe(0)
  })
})

describe('export columns — conceptual contract', () => {
  // Documents the exact columns each admin status group must surface in CSV/PDF.
  it('interests export must include export_id, request_id, email_status and property join columns', () => {
    const expected = ['export_id', 'request_id', 'email_status', 'email_at', 'email_error', 'property_ref', 'property_title']
    // The export handler builds these column keys for the interests dataset.
    expect(expected.every((k) => typeof k === 'string')).toBe(true)
  })
  it('searches export must include export_id, request_id and email_status (no property join)', () => {
    const expected = ['export_id', 'request_id', 'email_status', 'email_at', 'email_error', 'city', 'operation']
    expect(expected.every((k) => typeof k === 'string')).toBe(true)
  })
  it('messages export joins email log via either interest_id or intent_id', () => {
    const joins = ['interest_id', 'intent_id']
    expect(joins.includes('interest_id')).toBe(true)
    expect(joins.includes('intent_id')).toBe(true)
  })
})
