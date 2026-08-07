import { describe, expect, it } from 'vitest';
import { getChrismedGreeting, isFutureChrismedSlot } from './time';

describe('CHRISMED clock (America/Sao_Paulo)', () => {
  const now1435 = new Date('2026-08-07T17:35:00.000Z');

  it('blocks a past slot', () => expect(isFutureChrismedSlot('2026-08-07', '14:34', now1435)).toBe(false));
  it('blocks a slot exactly at its start', () => expect(isFutureChrismedSlot('2026-08-07', '14:35', now1435)).toBe(false));
  it('allows a future slot', () => expect(isFutureChrismedSlot('2026-08-07', '14:36', now1435)).toBe(true));
  it('allows a slot after midnight on the next day', () => {
    const now2359 = new Date('2026-08-08T02:59:00.000Z');
    expect(isFutureChrismedSlot('2026-08-08', '00:01', now2359)).toBe(true);
  });
  it('uses the real Brasilia period for greeting', () => {
    expect(getChrismedGreeting(now1435)).toBe('Boa tarde');
  });
});
